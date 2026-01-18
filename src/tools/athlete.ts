import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { Athlete, AthleteStats } from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';

/**
 * Retrieves the currently authenticated athlete's profile information.
 * 
 * @param client - StravaClient instance
 * @returns Athlete profile information
 * 
 * @example
 * ```typescript
 * const athlete = await getAthlete(client);
 * console.log(`${athlete.firstname} ${athlete.lastname}`);
 * ```
 */
export const getAthlete = withErrorHandling(
  async (client: StravaClient): Promise<Athlete> => {
    return await client.get<Athlete>('/athlete');
  }
);

/**
 * Schema for get_athlete_stats parameters
 */
export const GetAthleteStatsSchema = z.object({
  id: z.number().optional().describe('Athlete ID (defaults to authenticated athlete)'),
});

/**
 * Retrieves statistics about an athlete's activities.
 * Returns totals and trends for different activity types (running, cycling, swimming).
 * 
 * @param client - StravaClient instance
 * @param params - Athlete ID (optional, defaults to authenticated athlete)
 * @returns Athlete statistics including recent, year-to-date, and all-time totals
 * 
 * @example
 * ```typescript
 * // Get authenticated athlete's stats
 * const stats = await getAthleteStats(client, {});
 * 
 * console.log(`Recent runs: ${stats.recent_run_totals.count}`);
 * console.log(`YTD run distance: ${stats.ytd_run_totals.distance / 1000} km`);
 * ```
 */
export const getAthleteStats = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetAthleteStatsSchema>): Promise<AthleteStats> => {
    // If no ID provided, first get the authenticated athlete's ID
    let athleteId = params.id;
    
    if (!athleteId) {
      const athlete = await client.get<Athlete>('/athlete');
      athleteId = athlete.id;
    }
    
    return await client.get<AthleteStats>(`/athletes/${athleteId}/stats`);
  }
);

/**
 * MCP Tool definitions for athlete operations
 */
export const athleteTools = [
  {
    name: 'get_athlete',
    description: `Retrieves the authenticated athlete's profile information.

**OAuth Scope**: Requires profile:read_all for detailed representation.

Returns comprehensive profile data including:
- Name and username
- Location (city, state, country)
- Profile pictures (avatar, profile medium, profile)
- Account type (premium/summit status)
- Account creation and update dates
- Weight (if profile:read_all scope)
- Basic settings and preferences

Use this to:
- Get the athlete's ID for other API calls
- Display profile information
- Check account status
- Personalize responses with the athlete's name ("Hi Sarah!")

This is useful when you need to reference the athlete by name or understand their account status.`,
    inputSchema: {
      type: 'object' as const,
      properties: {} as Record<string, never>,
    },
  },
  {
    name: 'get_athlete_stats',
    description: `Retrieves comprehensive statistics about an athlete's activities.

**OAuth Scope**: Requires profile:read_all. Can only retrieve stats for the authenticated athlete.

**Performance Coaching Value**: Essential for understanding training volume, trends, and progress over different time periods.

Returns activity totals broken down by:
- **Recent** (last 4 weeks)
- **Year-to-date** (current calendar year)
- **All-time** (entire Strava history)

For each period, provides data for three activity types:
- **Running**: Distance, time, elevation, count
- **Cycling**: Distance, time, elevation, count
- **Swimming**: Distance, time, count

Statistics include:
- Total distance (meters)
- Total moving time (seconds)
- Total elevation gain (meters)
- Activity count
- Achievement count

**Coaching Applications**:
- Track training volume week over week
- Compare current year progress to goals
- Identify trends (increasing/decreasing volume)
- Assess training consistency
- Plan future workouts based on recent load
- Celebrate milestones and achievements

**Example Insights**:
- "You've run 150km this month, up 20% from last month"
- "YTD you've climbed 5,000m - halfway to your annual goal!"
- "Recent activity shows consistent 4x/week training"`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'Athlete ID (optional - defaults to authenticated athlete)',
        },
      },
    },
  },
];
