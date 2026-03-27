package tools

import (
	"github.com/mark3labs/mcp-go/server"
	"strava-mcp/internal/strava"
)

// RegisterAll registers all MCP tools with the server.
func RegisterAll(s *server.MCPServer, client *strava.Client) {
	registerActivities(s, client)
	// Phase 2 adds more: athlete, streams, clubs, uploads.
}
