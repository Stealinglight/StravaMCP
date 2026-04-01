package server

import (
	mcpserver "github.com/mark3labs/mcp-go/server"
	"github.com/Stealinglight/StravaMCP/internal/strava"
	"github.com/Stealinglight/StravaMCP/internal/tools"
)

// New creates a new MCP server with the given version string and Strava client.
// Tools are registered via tools.RegisterAll (empty in Phase 1, populated in Phase 2).
func New(version string, client *strava.Client) *mcpserver.MCPServer {
	s := mcpserver.NewMCPServer(
		"strava-mcp",
		version,
		mcpserver.WithLogging(),
	)
	tools.RegisterAll(s, client)
	return s
}
