package tools

import (
	"github.com/mark3labs/mcp-go/server"
	"github.com/Stealinglight/StravaMCP/internal/strava"
)

// RegisterAll registers all MCP tools with the server.
// Registers 11 tools across 5 resource categories:
// - Activities: strava_get_activities, strava_get_activity_by_id, strava_create_activity, strava_update_activity, strava_get_activity_zones
// - Athlete: strava_get_athlete, strava_get_athlete_stats
// - Streams: strava_get_activity_streams
// - Clubs: strava_get_club_activities
// - Uploads: strava_create_upload, strava_get_upload
func RegisterAll(s *server.MCPServer, client *strava.Client) {
	registerActivities(s, client)
	registerAthlete(s, client)
	registerStreams(s, client)
	registerClubs(s, client)
	registerUploads(s, client)
}
