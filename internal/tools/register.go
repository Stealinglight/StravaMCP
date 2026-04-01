package tools

import (
	"github.com/mark3labs/mcp-go/server"
	"github.com/Stealinglight/StravaMCP/internal/strava"
)

// RegisterAll registers all MCP tools with the server.
// Registers 11 tools across 5 resource categories:
// - Activities: get_activities, get_activity_by_id, create_activity, update_activity, get_activity_zones
// - Athlete: get_athlete, get_athlete_stats
// - Streams: get_activity_streams
// - Clubs: get_club_activities
// - Uploads: create_upload, get_upload
func RegisterAll(s *server.MCPServer, client *strava.Client) {
	registerActivities(s, client)
	registerAthlete(s, client)
	registerStreams(s, client)
	registerClubs(s, client)
	registerUploads(s, client)
}
