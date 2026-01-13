import { StravaClient } from '../strava-client.js';

export interface UpdateActivityParams {
  id: number;
  name?: string;
  type?: string;
  sport_type?: string;
  description?: string;
  trainer?: boolean;
  commute?: boolean;
  hide_from_home?: boolean;
  gear_id?: string;
}

/**
 * Updates an activity with the given parameters.
 * Priority use case: Enriching Apple Watch runs with better details, descriptions, and metadata.
 * 
 * @param client - StravaClient instance
 * @param params - Activity update parameters
 * @returns Updated activity data
 */
export async function updateActivity(client: StravaClient, params: UpdateActivityParams) {
  const { id, ...updateData } = params;
  
  // Remove undefined values
  const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  const response = await client.put(`/activities/${id}`, cleanedData);
  return response.data;
}

export const updateActivityTool = {
  name: 'update_activity',
  description: `Updates an existing Strava activity with new information. 
  
Priority use case: Enriching Apple Watch runs with better titles, detailed descriptions, and accurate sport types.

Use this to:
- Add meaningful names/descriptions to auto-imported activities
- Correct sport types (e.g., 'Run' vs 'TrailRun' vs 'VirtualRun')
- Mark activities as trainer/commute
- Hide activities from home feed
- Associate activities with gear

Common Apple Watch enhancements:
- Change generic "Morning Run" to descriptive names
- Add route details, weather conditions, or training notes
- Set proper sport_type for accurate training logs`,
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'The ID of the activity to update (required)',
      },
      name: {
        type: 'string',
        description: 'The name/title of the activity',
      },
      type: {
        type: 'string',
        description: 'Legacy activity type (deprecated, use sport_type instead)',
      },
      sport_type: {
        type: 'string',
        description: 'The sport type: Run, TrailRun, VirtualRun, Ride, MountainBikeRide, GravelRide, EBikeRide, VirtualRide, Swim, Walk, Hike, etc.',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the activity (training notes, conditions, effort, etc.)',
      },
      trainer: {
        type: 'boolean',
        description: 'Whether this was a trainer/indoor activity',
      },
      commute: {
        type: 'boolean',
        description: 'Whether this was a commute',
      },
      hide_from_home: {
        type: 'boolean',
        description: 'Whether to hide this activity from the home feed',
      },
      gear_id: {
        type: 'string',
        description: 'The ID of the gear (shoes, bike, etc.) used for this activity',
      },
    },
    required: ['id'],
  },
};
