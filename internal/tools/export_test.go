package tools

import "time"

// BuildGroundingFooterForTest exposes the unexported buildGroundingFooter to the
// external tools_test package. This file is only compiled during `go test`, so
// the helper stays unexported in the production build.
func BuildGroundingFooterForTest(now time.Time, after int) string {
	return buildGroundingFooter(now, after)
}
