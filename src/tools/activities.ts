import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { ActivitySummary, DetailedActivity, ActivityZones } from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';

/**
 * Schema for get_activities parameters
 */
export const GetActivitiesSchema = z.object({
  before: z.number().optional().describe('Epoch timestamp to retrieve activities before'),
  after: z.number().optional().describe('Epoch timestamp to retrieve activities after'),
  page: z.number().optional().default(1).describe('Page number (default: 1)'),
  per_page: z.number().optional().default(30).describe('Number of items per page (default: 30, max: 200)'),
});

/**
 * Retrieves the authenticated athlete's activities.
 * Supports filtering by date range using before/after timestamps.
 * 
 * @param client - StravaClient instance
 * @param params - Query parameters for filtering activities
 * @returns Array of activity summaries
 * 
 * @example
 * ```typescript
 * // Get today's activities
 * const today = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
 * const activities = await getActivities(client, { after: today });
 * ```
 */
export const getActivities = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetActivitiesSchema>): Promise<ActivitySummary[]> => {
    return await client.get<ActivitySummary[]>('/athlete/activities', { params });
  }
);

/**
 * Schema for get_activity_by_id parameters
 */
export const GetActivityByIdSchema = z.object({
  id: z.number().describe('The ID of the activity'),
  include_all_efforts: z.boolean().optional().describe('Include all segment efforts (default: false)'),
});

/**
 * Retrieves detailed information about a specific activity.
 * 
 * @param client - StravaClient instance
 * @param params - Activity ID and options
 * @returns Detailed activity information
 */
export const getActivityById = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetActivityByIdSchema>): Promise<DetailedActivity> => {
    const { id, include_all_efforts } = params;
    return await client.get<DetailedActivity>(`/activities/${id}`, {
      params: { include_all_efforts },
    });
  }
);

/**
 * Schema for create_activity parameters
 */
export const CreateActivitySchema = z.object({
  name: z.string().describe('The name of the activity'),
  sport_type: z.string().describe('Sport type: Run, TrailRun, Walk, Hike, Ride, MountainBikeRide, GravelRide, VirtualRide, Swim, etc.'),
  start_date_local: z.string().describe('ISO 8601 formatted date time (e.g., 2024-01-13T06:00:00Z)'),
  elapsed_time: z.number().describe('Total elapsed time in seconds'),
  type: z.string().optional().describe('Legacy activity type (deprecated)'),
  description: z.string().optional().describe('Description of the activity'),
  distance: z.number().optional().describe('Distance in meters'),
  trainer: z.boolean().optional().describe('Whether this was a trainer/indoor activity'),
  commute: z.boolean().optional().describe('Whether this was a commute'),
});

/**
 * Creates a new manual activity.
 * Useful for adding activities that weren't recorded or imported automatically.
 * 
 * @param client - StravaClient instance
 * @param params - Activity creation parameters
 * @returns Created activity details
 * 
 * @example
 * ```typescript
 * const activity = await createActivity(client, {
 *   name: 'Morning Run',
 *   sport_type: 'Run',
 *   start_date_local: '2024-01-13T06:00:00Z',
 *   elapsed_time: 3600,
 *   distance: 10000,
 *   description: 'Easy recovery run through the park'
 * });
 * ```
 */
export const createActivity = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof CreateActivitySchema>): Promise<DetailedActivity> => {
    return await client.post<DetailedActivity>('/activities', params);
  }
);

/**
 * Schema for update_activity parameters
 */
export const UpdateActivitySchema = z.object({
  id: z.number().describe('The ID of the activity to update'),
  name: z.string().optional().describe('The name/title of the activity'),
  type: z.string().optional().describe('Legacy activity type (deprecated, use sport_type)'),
  sport_type: z.string().optional().describe('Sport type: Run, TrailRun, Walk, Hike, Ride, MountainBikeRide, GravelRide, etc.'),
  description: z.string().optional().describe('Detailed description of the activity'),
  trainer: z.boolean().optional().describe('Whether this was a trainer/indoor activity'),
  commute: z.boolean().optional().describe('Whether this was a commute'),
  hide_from_home: z.boolean().optional().describe('Whether to hide from home feed'),
  gear_id: z.string().optional().describe('The ID of the gear used'),
});

/**
 * Updates an existing activity with new information.
 * Supports partial updates - only provided fields will be modified.
 * 
 * **CRITICAL for Enrichment Workflow**: This is the primary tool for enhancing
 * Apple Watch activities with better titles and descriptions.
 * 
 * @param client - StravaClient instance
 * @param params - Activity update parameters (only changed fields)
 * @returns Updated activity details
 * 
 * @example
 * ```typescript
 * // Enrich an Apple Watch activity
 * const updated = await updateActivity(client, {
 *   id: 12345678,
 *   name: 'Progressive Long Run - 10K',
 *   description: 'Felt strong today. Weather was perfect at 55°F. Progressive pace from 6:30 to 5:45 /km. HR stayed in zone 2-3.',
 *   sport_type: 'Run'
 * });
 * ```
 */
export const updateActivity = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof UpdateActivitySchema>): Promise<DetailedActivity> => {
    const { id, ...updateData } = params;
    return await client.put<DetailedActivity>(`/activities/${id}`, updateData);
  }
);

/**
 * Schema for get_activity_zones parameters
 */
export const GetActivityZonesSchema = z.object({
  id: z.number().describe('The ID of the activity'),
});

/**
 * Retrieves the zones of a given activity.
 * Zones include time spent in different heart rate and power zones.
 * 
 * @param client - StravaClient instance
 * @param params - Activity ID
 * @returns Activity zones (heart rate and/or power)
 */
export const getActivityZones = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof GetActivityZonesSchema>): Promise<ActivityZones[]> => {
    const { id } = params;
    return await client.get<ActivityZones[]>(`/activities/${id}/zones`);
  }
);

/**
 * MCP Tool definitions for activities
 */
export const activitiesTools = [
  {
    name: 'get_activities',
    description: `Retrieves the authenticated athlete's activities.

**Key for Enrichment Workflow**: Use this to find activities from specific time periods, especially "today's run" or recent activities that need updating.

**OAuth Scope**: Requires activity:read. Note: "Only Me" privacy activities require activity:read_all scope.

Features:
- Filter by date range using 'before' and 'after' epoch timestamps
- Paginate through results (max 200 per page)
- Returns summary information for each activity (not full details)

Common use cases:
- Find today's activities: Set 'after' to today's start timestamp
- Find this week's activities: Set 'after' to the start of the week
- Browse recent activities: Use default parameters

**Privacy Note**: Only returns activities the authenticated athlete has permission to view based on privacy settings and OAuth scope.

Example: To find today's runs, calculate today's start epoch timestamp and use it as the 'after' parameter.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        before: {
          type: 'number' as const,
          description: 'Epoch timestamp to retrieve activities before (exclusive)',
        },
        after: {
          type: 'number' as const,
          description: 'Epoch timestamp to retrieve activities after (inclusive). Use this to find recent activities.',
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
    },
  },
  {
    name: 'get_activity_by_id',
    description: `Retrieves detailed information about a specific activity by its ID.

Returns comprehensive activity data including:
- Full description and name
- Detailed statistics (distance, time, elevation, speed, heart rate, etc.)
- Gear information
- Splits and laps
- Photos and kudos
- Device information

Use this after 'get_activities' to get full details about a specific activity before updating it.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the activity',
        },
        include_all_efforts: {
          type: 'boolean' as const,
          description: 'Include all segment efforts (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_activity',
    description: `Creates a new manual activity on Strava.

**OAuth Scope**: Requires activity:write permission.

Use this when:
- Adding activities that weren't automatically recorded
- Logging cross-training or activities from non-connected devices
- Backdating activities that were missed
- Creating placeholder activities for training logs

**Required Fields**:
- name: Activity title
- sport_type: Type of activity (Run, Ride, Swim, etc.)
- start_date_local: When the activity started (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)
- elapsed_time: Duration in seconds

**Optional but Recommended**:
- distance: Distance in meters
- description: Detailed notes about the activity
- trainer: Whether it was indoors on a trainer (boolean)
- commute: Whether this was a commute (boolean)

**Valid Sport Types**: Run, TrailRun, Walk, Hike, VirtualRun, Ride, MountainBikeRide, GravelRide, EBikeRide, VirtualRide, Handcycle, Swim, Crossfit, Elliptical, Rowing, StairStepper, WeightTraining, Workout, Yoga, and many more.

**Example**: Logging a gym workout that wasn't tracked: name="Strength Training", sport_type="WeightTraining", elapsed_time=3600 (1 hour).`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string' as const,
          description: 'The name of the activity',
        },
        sport_type: {
          type: 'string' as const,
          description: 'Sport type (e.g., Run, Ride, Swim)',
        },
        start_date_local: {
          type: 'string' as const,
          description: 'ISO 8601 formatted date time (e.g., 2024-01-13T06:00:00Z)',
        },
        elapsed_time: {
          type: 'number' as const,
          description: 'Total elapsed time in seconds',
        },
        type: {
          type: 'string' as const,
          description: 'Legacy activity type (deprecated, use sport_type)',
        },
        description: {
          type: 'string' as const,
          description: 'Description of the activity',
        },
        distance: {
          type: 'number' as const,
          description: 'Distance in meters',
        },
        trainer: {
          type: 'boolean' as const,
          description: 'Whether this was a trainer/indoor activity',
        },
        commute: {
          type: 'boolean' as const,
          description: 'Whether this was a commute',
        },
      },
      required: ['name', 'sport_type', 'start_date_local', 'elapsed_time'],
    },
  },
  {
    name: 'update_activity',
    description: `**[CRITICAL - PRIMARY ENRICHMENT TOOL]** Updates an existing Strava activity.

**OAuth Scope**: Requires activity:write permission.

**This is THE most important tool for the enrichment workflow.** Use this to transform basic auto-imported activities (especially from Apple Watch) into detailed, meaningful training logs.

**The Enrichment Pattern:**
1. Use 'get_activities' with 'after' parameter to find today's or recent activities
2. Identify the activity that needs enrichment (often has generic names like "Morning Run")
3. Use 'update_activity' to add:
   - Meaningful name (e.g., "Progressive Long Run - 10K" instead of "Morning Run")
   - Detailed description (weather, effort level, training notes, how you felt, route details)
   - Correct sport_type if needed (Run vs TrailRun vs VirtualRun)

**Supports partial updates**: Only provide the fields you want to change. All other fields remain unchanged.

**Apple Watch Enhancement Examples:**
- Generic "Afternoon Run" → "Hill Repeats Workout - 8x400m"
- No description → "Perfect weather (60°F). Focused on form. Felt strong on the hills. HR avg 155 bpm. Recovery: 2 min between reps."
- Type: Run → sport_type: TrailRun (if it was on trails)

**Available Fields:**
- name: Activity title
- description: Detailed training notes (weather, effort, feelings, splits, etc.)
- sport_type: Accurate sport classification
- trainer: Mark as indoor if needed
- commute: Mark as commute
- hide_from_home: Hide from feed
- gear_id: Associate with specific shoes/bike

**Coach's Perspective**: Rich descriptions help track training patterns, identify what works, and review progress over time. Transform data into insights!`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the activity to update (REQUIRED)',
        },
        name: {
          type: 'string' as const,
          description: 'New activity name/title',
        },
        type: {
          type: 'string' as const,
          description: 'Legacy activity type (deprecated)',
        },
        sport_type: {
          type: 'string' as const,
          description: 'Sport type: Run, TrailRun, Walk, Hike, VirtualRun, Ride, MountainBikeRide, etc.',
        },
        description: {
          type: 'string' as const,
          description: 'Detailed description with training notes, weather, effort, feelings, route details, etc.',
        },
        trainer: {
          type: 'boolean' as const,
          description: 'Mark as trainer/indoor activity',
        },
        commute: {
          type: 'boolean' as const,
          description: 'Mark as commute',
        },
        hide_from_home: {
          type: 'boolean' as const,
          description: 'Hide from home feed',
        },
        gear_id: {
          type: 'string' as const,
          description: 'ID of the gear (shoes, bike) used',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_activity_zones',
    description: `Retrieves the zones of a given activity.

**Note**: This is a **Strava Summit feature**. Requires appropriate activity:read scope based on privacy settings.

Returns time spent in different intensity zones:
- Heart rate zones (if HR data available)
- Power zones (if power data available)

Zone response includes:
- Distribution buckets showing time in each zone
- Whether zones are sensor-based vs calculated
- Whether custom zones or default zones are used
- Zone score and max values

Useful for:
- Analyzing training intensity distribution
- Verifying if an activity met zone targets (e.g., "Did I stay in Zone 2?")
- Understanding effort distribution across an activity
- Performance coaching and analysis
- Tracking training load by zone

**Coaching Value**: Essential for verifying that easy runs stayed easy, tempo runs hit the right intensity, and interval workouts achieved target zones.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the activity',
        },
      },
      required: ['id'],
    },
  },
];
