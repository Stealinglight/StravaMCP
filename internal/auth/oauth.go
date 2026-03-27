package auth

import (
	"log/slog"
	"net/http"

	"strava-mcp/internal/config"
)

// NewCallbackHandler creates an HTTP handler for the OAuth callback endpoint.
func NewCallbackHandler(state string, codeCh chan<- string, errCh chan<- error) http.Handler {
	return nil
}

// BuildAuthorizeURL constructs the Strava OAuth authorization URL.
func BuildAuthorizeURL(clientID, state string) string {
	return ""
}

// ExchangeCode exchanges an authorization code for tokens.
func ExchangeCode(clientID, clientSecret, code, tokenURL string) (*Tokens, error) {
	return nil, nil
}

// FetchAthleteName calls GET /athlete and returns "firstname lastname".
func FetchAthleteName(accessToken, athleteURL string) (string, error) {
	return "", nil
}

// RunOAuthFlow runs the complete OAuth browser flow.
func RunOAuthFlow(cfg *config.Config, store TokenStore, logger *slog.Logger) error {
	return nil
}
