package tools

import (
	"github.com/mark3labs/mcp-go/server"
	"strava-mcp/internal/strava"
)

// RegisterAll registers all MCP tools with the server.
// Phase 2 will register Strava tools here.
func RegisterAll(s *server.MCPServer, client *strava.Client) {
	// No tools registered yet.
	// Phase 2 adds: activities, athlete, streams, segments, routes, gear, laps, uploads.
}
