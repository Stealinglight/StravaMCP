import { z } from 'zod';
import { StravaClient } from '../lib/strava-client.js';
import {
  OpenAISearchResponse,
  OpenAIFetchResult,
  DetailedActivity,
  ActivitySummary,
} from '../config/types.js';
import { withErrorHandling } from '../utils/errors.js';
import { formatDistance, formatDuration, formatPace, formatElevation } from '../utils/formatters.js';

/**
 * Schema for OpenAI search tool parameters
 */
export const SearchSchema = z.object({
  query: z.string().describe('Natural language search query for Strava activities'),
});

/**
 * Schema for OpenAI fetch tool parameters
 */
export const FetchSchema = z.object({
  id: z.string().describe('Unique identifier for the Strava activity'),
});

/**
 * Parse query for date hints and return appropriate timestamp filters
 */
function parseQueryForDateFilter(query: string): { after?: number; before?: number } {
  const lowerQuery = query.toLowerCase();
  const now = Date.now();
  
  // Today
  if (lowerQuery.includes('today')) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return { after: Math.floor(todayStart.getTime() / 1000) };
  }
  
  // This week
  if (lowerQuery.includes('this week') || lowerQuery.includes('week')) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return { after: Math.floor(weekStart.getTime() / 1000) };
  }
  
  // Recent (last 30 days)
  if (lowerQuery.includes('recent')) {
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    return { after: Math.floor(thirtyDaysAgo.getTime() / 1000) };
  }
  
  // Last week
  if (lowerQuery.includes('last week')) {
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
    lastWeekEnd.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    return {
      after: Math.floor(lastWeekStart.getTime() / 1000),
      before: Math.floor(lastWeekEnd.getTime() / 1000),
    };
  }
  
  // Default: last 90 days
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
  return { after: Math.floor(ninetyDaysAgo.getTime() / 1000) };
}

/**
 * Format activity as a readable document for OpenAI fetch tool
 */
function formatActivityAsDocument(activity: DetailedActivity): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`# ${activity.name}`);
  lines.push('');
  
  // Basic info
  lines.push(`**Activity Type:** ${activity.sport_type}`);
  lines.push(`**Date:** ${new Date(activity.start_date).toLocaleString()}`);
  lines.push('');
  
  // Key metrics
  lines.push('## Key Metrics');
  lines.push('');
  lines.push(`- **Distance:** ${formatDistance(activity.distance)}`);
  lines.push(`- **Duration:** ${formatDuration(activity.moving_time)}`);
  lines.push(`- **Elapsed Time:** ${formatDuration(activity.elapsed_time)}`);
  
  if (activity.average_speed > 0) {
    lines.push(`- **Average Pace:** ${formatPace(activity.average_speed)}`);
    lines.push(`- **Max Speed:** ${formatPace(activity.max_speed)}`);
  }
  
  if (activity.total_elevation_gain > 0) {
    lines.push(`- **Elevation Gain:** ${formatElevation(activity.total_elevation_gain)}`);
  }
  
  lines.push('');
  
  // Heart rate data if available
  if (activity.has_heartrate && activity.average_heartrate) {
    lines.push('## Heart Rate');
    lines.push('');
    lines.push(`- **Average HR:** ${activity.average_heartrate} bpm`);
    if (activity.max_heartrate) {
      lines.push(`- **Max HR:** ${activity.max_heartrate} bpm`);
    }
    lines.push('');
  }
  
  // Power data if available
  if (activity.device_watts && activity.average_watts) {
    lines.push('## Power');
    lines.push('');
    lines.push(`- **Average Power:** ${activity.average_watts}W`);
    if (activity.kilojoules) {
      lines.push(`- **Energy:** ${activity.kilojoules} kJ`);
    }
    lines.push('');
  }
  
  // Description
  if (activity.description) {
    lines.push('## Description');
    lines.push('');
    lines.push(activity.description);
    lines.push('');
  }
  
  // Activity details
  lines.push('## Activity Details');
  lines.push('');
  lines.push(`- **Trainer Activity:** ${activity.trainer ? 'Yes' : 'No'}`);
  lines.push(`- **Commute:** ${activity.commute ? 'Yes' : 'No'}`);
  lines.push(`- **Manual Entry:** ${activity.manual ? 'Yes' : 'No'}`);
  
  if (activity.device_name) {
    lines.push(`- **Recorded With:** ${activity.device_name}`);
  }
  
  if (activity.gear) {
    lines.push(`- **Gear:** ${activity.gear.name} (${formatDistance(activity.gear.distance)} total)`);
  }
  
  lines.push('');
  
  // Social stats
  lines.push('## Social');
  lines.push('');
  lines.push(`- **Kudos:** ${activity.kudos_count}`);
  lines.push(`- **Comments:** ${activity.comment_count}`);
  lines.push(`- **Achievements:** ${activity.achievement_count}`);
  
  return lines.join('\n');
}

/**
 * Search Strava activities based on natural language query
 * Returns list of matching activities in OpenAI format
 */
export const searchActivities = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof SearchSchema>): Promise<OpenAISearchResponse> => {
    const { query } = params;
    
    // Parse query for date filters
    const dateFilter = parseQueryForDateFilter(query);
    
    // Fetch activities from Strava
    const activities = await client.get<ActivitySummary[]>('/athlete/activities', {
      params: {
        ...dateFilter,
        per_page: 30, // Get more than needed to allow for filtering
      },
    });
    
    // Convert to OpenAI search result format
    const results = activities.slice(0, 10).map((activity) => ({
      id: activity.id.toString(),
      title: `${activity.name} - ${activity.sport_type} (${formatDistance(activity.distance)})`,
      url: `https://www.strava.com/activities/${activity.id}`,
    }));
    
    return { results };
  }
);

/**
 * Fetch complete activity details by ID
 * Returns full activity data in OpenAI document format
 */
export const fetchActivity = withErrorHandling(
  async (client: StravaClient, params: z.infer<typeof FetchSchema>): Promise<OpenAIFetchResult> => {
    const activityId = parseInt(params.id, 10);
    
    if (isNaN(activityId)) {
      throw new Error(`Invalid activity ID: ${params.id}`);
    }
    
    // Fetch detailed activity from Strava
    const activity = await client.get<DetailedActivity>(`/activities/${activityId}`);
    
    // Format as readable document
    const text = formatActivityAsDocument(activity);
    
    // Build metadata
    const metadata: Record<string, any> = {
      sport_type: activity.sport_type,
      date: activity.start_date_local,
      distance_meters: activity.distance,
      moving_time_seconds: activity.moving_time,
      total_elevation_gain_meters: activity.total_elevation_gain,
      trainer: activity.trainer,
      commute: activity.commute,
    };
    
    if (activity.average_heartrate) {
      metadata.average_heartrate = activity.average_heartrate;
    }
    
    if (activity.average_watts) {
      metadata.average_watts = activity.average_watts;
    }
    
    return {
      id: activity.id.toString(),
      title: activity.name,
      text,
      url: `https://www.strava.com/activities/${activity.id}`,
      metadata,
    };
  }
);

/**
 * MCP Tool definitions for OpenAI compatibility
 */
export const openaiTools = [
  {
    name: 'search',
    description: `Search for Strava activities using natural language queries.

**Required for OpenAI ChatGPT integration.**

This tool searches the authenticated athlete's Strava activities and returns a list of relevant results. It automatically interprets temporal queries like "today", "this week", "recent", etc.

Use this tool to:
- Find activities from specific time periods
- Locate activities before fetching full details
- Browse recent workout history
- Search for specific types of activities

The tool returns up to 10 matching activities with basic information. Use the 'fetch' tool with an activity ID to get complete details.

**Example queries:**
- "today's runs"
- "activities this week"
- "recent cycling rides"
- "last week's workouts"

**Returns:** Array of search results, each with:
- id: Unique activity identifier (use with fetch tool)
- title: Activity name and key stats
- url: Direct link to activity on Strava`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'Natural language search query for activities (e.g., "today\'s run", "activities this week")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch',
    description: `Retrieve complete details for a specific Strava activity by ID.

**Required for OpenAI ChatGPT integration.**

This tool fetches comprehensive information about a single activity, formatted as a readable document. It includes all metrics, descriptions, gear information, and social stats.

Use this tool after using 'search' to:
- Get full activity details for analysis
- Read training notes and descriptions
- Access detailed performance metrics
- View heart rate and power data
- Check gear and equipment used

The returned document includes:
- Complete activity metrics (distance, time, pace, elevation)
- Heart rate data (if available)
- Power data (if available)
- Full description and training notes
- Device and gear information
- Social stats (kudos, comments, achievements)

**Input:** Activity ID from search results (string format)

**Returns:** Complete activity document with:
- id: Activity identifier
- title: Activity name
- text: Full formatted activity details (markdown)
- url: Direct link to activity on Strava
- metadata: Structured data for programmatic access`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string' as const,
          description: 'Unique identifier for the Strava activity (from search results)',
        },
      },
      required: ['id'],
    },
  },
];
