package server

import (
	mcpserver "github.com/mark3labs/mcp-go/server"
	"strava-mcp/internal/tools"
)

// New creates a new MCP server with the given version string.
// Tools are registered via tools.RegisterAll (empty in Phase 1, populated in Phase 2).
func New(version string) *mcpserver.MCPServer {
	s := mcpserver.NewMCPServer(
		"strava-mcp",
		version,
		mcpserver.WithLogging(),
	)
	tools.RegisterAll(s)
	return s
}
