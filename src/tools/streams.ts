import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import { Stream } from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';

/**
 * Available stream types for activities
 */
export const STREAM_TYPES = [
  'time',
  'latlng',
  'distance',
  'altitude',
  'velocity_smooth',
  'heartrate',
  'cadence',
  'watts',
  'temp',
  'moving',
  'grade_smooth',
];

/**
 * Schema for get_activity_streams parameters
 */
export const GetActivityStreamsSchema = z.object({
  id: z.number().describe('The ID of the activity'),
  keys: z
    .array(z.enum(STREAM_TYPES))
    .optional()
    .describe('Array of stream types to retrieve. If not provided, returns all available streams.'),
  key_by_type: z
    .boolean()
    .optional()
    .default(true)
    .describe('Return streams keyed by type instead of as an array (default: true)'),
});

/**
 * Retrieves telemetry streams for a specific activity.
 * Streams contain time-series data recorded during the activity.
 * 
 * **Critical for Deep Performance Analysis**: Streams provide the raw sensor data
 * that enables detailed analysis of pacing, heart rate zones, power distribution,
 * elevation profiles, and more.
 * 
 * @param client - StravaClient instance
 * @param params - Activity ID and stream options
 * @returns Activity streams keyed by type
 * 
 * @example
 * ```typescript
 * // Get heart rate and pace data for analysis
 * const streams = await getActivityStreams(client, {
 *   id: 12345678,
 *   keys: ['time', 'heartrate', 'velocity_smooth', 'distance']
 * });
 * 
 * // Analyze heart rate zones over time
 * const hrData = streams.heartrate.data;
 * const timeData = streams.time.data;
 * ```
 */
export const getActivityStreams = withErrorHandling(
  async (
    client: StravaClient,
    params: z.infer<typeof GetActivityStreamsSchema>
  ): Promise<Record<string, Stream>> => {
    const { id, keys, key_by_type } = params;

    // If keys not provided, request all common streams
    const streamKeys = keys || STREAM_TYPES;

    const response = await client.get<Stream[]>(`/activities/${id}/streams`, {
      params: {
        keys: streamKeys.join(','),
        key_by_type: key_by_type,
      },
    });

    // Convert array response to keyed object if needed
    if (Array.isArray(response)) {
      return response.reduce((acc, stream) => {
        acc[stream.series_type] = stream;
        return acc;
      }, {} as Record<string, Stream>);
    }

    return response as unknown as Record<string, Stream>;
  }
);

/**
 * MCP Tool definition for activity streams
 */
export const streamsTools = [
  {
    name: 'get_activity_streams',
    description: `**[TELEMETRY & DEEP ANALYSIS]** Retrieves time-series sensor data (streams) from an activity.

**Performance Coach's Secret Weapon**: While activity summaries give you averages, streams give you the complete story - every data point recorded during the activity. Essential for understanding pacing strategy, heart rate response, power distribution, and elevation profiles.

**Available Stream Types:**

**Core Metrics:**
- **time**: Time elapsed in seconds from start (array of timestamps)
- **distance**: Distance in meters at each point
- **latlng**: GPS coordinates [latitude, longitude] for mapping route
- **altitude**: Elevation in meters at each point

**Performance Metrics:**
- **velocity_smooth**: Smoothed speed in meters/second (better than raw GPS)
- **grade_smooth**: Smoothed gradient percentage (positive = uphill, negative = downhill)
- **moving**: Boolean indicating if athlete was moving (vs stopped)

**Physiological Data:**
- **heartrate**: Heart rate in beats per minute (if HR monitor used)
- **cadence**: Running cadence (steps/min) or cycling cadence (RPM)
- **temp**: Temperature in Celsius

**Power Data (cycling/running):**
- **watts**: Power output in watts (if power meter used)

**Analysis Use Cases:**

1. **Pacing Analysis**:
   - Identify if pacing was even, positive split, or negative split
   - Find where pace dropped off (fatigue points)
   - Compare intended vs actual pace strategy

2. **Heart Rate Analysis**:
   - Verify time in each HR zone
   - Check HR response to elevation changes
   - Identify cardiac drift (HR rising at same pace)
   - Recovery analysis (how fast HR drops)

3. **Elevation Strategy**:
   - Analyze power/effort on climbs vs descents
   - Identify elevation gain distribution
   - Understand route difficulty profile

4. **Efficiency Metrics**:
   - Cadence consistency
   - Power distribution (variability)
   - Speed-to-HR relationship

5. **Route Visualization**:
   - Map the exact route taken
   - Identify interesting segments
   - Plan future routes

**Performance Coaching Workflow**:
1. Get activity streams after an important workout or race
2. Analyze the data to understand execution
3. Provide specific feedback: "Your HR spiked to 175 at km 5 (the big hill) but recovered well"
4. Use insights to plan future training: "Your pacing was perfect for the first half but dropped 15s/km in the second half - let's work on endurance"

**Technical Notes**:
- Not all streams available for all activities (depends on device/sensors)
- Data points are time-aligned across all streams
- Arrays are same length - index [i] in time corresponds to index [i] in all other streams
- Request only needed streams for efficiency (or omit 'keys' for all available)

**Pro Tip**: Combine streams for advanced insights:
- velocity_smooth + heartrate = aerobic efficiency
- grade_smooth + watts = climbing power
- distance + time + heartrate = heart rate zones over race segments`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'number' as const,
          description: 'The ID of the activity',
        },
        keys: {
          type: 'array' as const,
          items: {
            type: 'string' as const,
            enum: STREAM_TYPES,
          },
          description:
            'Array of stream types to retrieve: time, latlng, distance, altitude, velocity_smooth, heartrate, cadence, watts, temp, moving, grade_smooth. Omit to get all available streams.',
        },
        key_by_type: {
          type: 'boolean' as const,
          description: 'Return streams as an object keyed by type (default: true)',
        },
      },
      required: ['id'],
    },
  },
];
