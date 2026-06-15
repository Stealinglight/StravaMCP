package tools

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/mark3labs/mcp-go/mcp"

	"github.com/Stealinglight/StravaMCP/internal/strava"
)

// staleAfterThreshold is how far before "now" an 'after' epoch may sit before
// get_activities flags it as suspicious. A little over a year, so a deliberate
// "everything in the last 12 months" query does not trip the warning, but the
// classic wrong-year mistake (an LLM defaulting to a prior year because it has
// no real clock) does. See buildGroundingFooter.
const staleAfterThreshold = 370 * 24 * time.Hour

// buildGroundingFooter returns a footer appended to every get_activities
// response. It exists because the calling LLM has no reliable internal clock
// and will silently reason in the wrong YEAR — it once queried Strava with an
// 'after' epoch a full year stale, which produced an empty/incorrect result and
// (separately) wedged the conversation. Injecting the authoritative server time
// into the tool result gives the model ground truth inline, on every call, that
// it cannot skip the way it skips a system-prompt instruction.
//
// It is a pure function of (now, after) so it is trivially testable with a
// fixed clock. `after` is the epoch-seconds filter the caller passed, or 0 if
// none was provided.
func buildGroundingFooter(now time.Time, after int) string {
	footer := fmt.Sprintf(
		"\n\n[server time: %s — epoch %d. Compute any date range from THIS value, not from memory or training data.]",
		now.Format(time.RFC3339),
		now.Unix(),
	)

	if after > 0 {
		afterTime := time.Unix(int64(after), 0).In(now.Location())
		// Flag a prior calendar year OR an epoch well over a year old — both are
		// hallmarks of the wrong-year mistake. Non-blocking: the data is still
		// returned; this only nudges the model to recompute and retry.
		if afterTime.Year() < now.Year() || now.Sub(afterTime) > staleAfterThreshold {
			footer += fmt.Sprintf(
				"\n[⚠ the 'after' filter you sent (%d) resolves to %s — a PRIOR/STALE date relative to the server time above. "+
					"If you meant recent activities, recompute 'after' from the server time and call again.]",
				after,
				afterTime.Format("2006-01-02"),
			)
		}
	}

	return footer
}

// FormatResponse pretty-prints raw JSON data with 2-space indentation and
// conditionally appends a rate limit warning when API usage exceeds 80%.
// If the data is not valid JSON, returns the raw string as-is.
func FormatResponse(data []byte, client *strava.Client) *mcp.CallToolResult {
	return FormatResponseWithFooter(data, client, "")
}

// FormatResponseWithFooter is FormatResponse with an extra trailing footer
// appended to the (valid or raw) body. Used by get_activities to inject the
// server-time grounding footer (see buildGroundingFooter) without changing the
// FormatResponse signature relied on by every other tool. An empty footer makes
// it behave identically to FormatResponse.
func FormatResponseWithFooter(data []byte, client *strava.Client, footer string) *mcp.CallToolResult {
	var pretty bytes.Buffer
	if err := json.Indent(&pretty, data, "", "  "); err != nil {
		// Not valid JSON -- return raw string (still grounded with the footer)
		return mcp.NewToolResultText(string(data) + footer)
	}

	result := pretty.String()

	// Append rate limit warning if usage is high
	if warning := client.RateLimitWarning(); warning != "" {
		result += "\n\n" + warning
	}

	result += footer

	return mcp.NewToolResultText(result)
}

// HandleToolError formats an error into an MCP error result.
// If the error is a StravaError, includes the HTTP status code and response body.
// Otherwise, includes the raw error message.
func HandleToolError(toolName string, err error) *mcp.CallToolResult {
	var stravaErr *strava.StravaError
	if strava.AsStravaError(err, &stravaErr) {
		return mcp.NewToolResultErrorf("%s: Strava API error (%d): %s", toolName, stravaErr.StatusCode, stravaErr.Body)
	}
	return mcp.NewToolResultErrorf("%s: %v", toolName, err)
}
