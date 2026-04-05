package server

import (
	mcpserver "github.com/mark3labs/mcp-go/server"
	"github.com/Stealinglight/StravaMCP/internal/strava"
	"github.com/Stealinglight/StravaMCP/internal/tools"
)

// New creates a new MCP server with the given version string and Strava client.
func New(version string, client *strava.Client) *mcpserver.MCPServer {
	s := mcpserver.NewMCPServer(
		"strava-mcp",
		version,
		mcpserver.WithLogging(),
	)
	tools.RegisterAll(s, client)
	return s
}
