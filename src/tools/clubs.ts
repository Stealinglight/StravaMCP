import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { ClubActivity } from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';

/**
 * Schema for get_club_activities parameters
 */
export const GetClubActivitiesSchema = z.object({
  id: z.number().describe('The ID of the club'),
  page: z.number().optional().default(1).describe('Page number (default: 1)'),
  per_page: z.number().optional().default(30).describe('Number of items per page (default: 30, max: 200)'),
});

/**
 * Retrieves recent activities from club members.
 * 
 * @param client - StravaClient instance
 * @param params - Club ID and pagination options
 * @returns Array of club member activities
 * 
 * @example
 * ```typescript
 * const activities = await getClubActivities(client, {
 *   id: 123456,
 *   per_page: 50
 * });
 * ```
 */
export const getClubActivities = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetClubActivitiesSchema>): Promise<ClubActivity[]> => {
    const { id, page, per_page } = params;
    return await client.get<ClubActivity[]>(`/clubs/${id}/activities`, {
      params: { page, per_page },
    });
  }
);

/**
 * MCP Tool definitions for club operations
 */
export const clubsTools = [
  {
    name: 'get_club_activities',
    description: `Retrieves recent activities from members of a specific club.

Clubs on Strava are groups of athletes who share activities, compete on leaderboards, and stay connected. This tool lets you see what club members have been up to.

Returns activity summaries including:
- Activity details (name, distance, time, elevation, etc.)
- Athlete information (name of club member who did the activity)
- Activity statistics and metadata

**Use Cases:**
- Monitor club activity and engagement
- See what training club members are doing
- Find popular routes or workout types
- Track club challenges or group goals
- Encourage and support club members

**Coaching Applications:**
- Review team training consistency
- Identify athletes who might need check-ins
- Celebrate club achievements
- Coordinate group workouts based on activity patterns

Note: Only shows activities from club members who have their privacy settings set to allow club visibility.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the club',
        },
        page: {
          type: 'number' as const,
          description: 'Page number (default: 1)',
        },
        per_page: {
          type: 'number' as const,
          description: 'Number of items per page (default: 30, max: 200)',
        },
      },
      required: ['id'],
    },
  },
];
