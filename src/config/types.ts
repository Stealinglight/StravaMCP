/**
 * Strava OAuth token structure
 */
export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in?: number;
  token_type?: string;
}

/**
 * Strava API activity summary
 */
export interface ActivitySummary {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  average_speed: number;
  max_speed: number;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
}

/**
 * Detailed activity
 */
export interface DetailedActivity extends ActivitySummary {
  description?: string;
  calories?: number;
  device_name?: string;
  embed_token?: string;
  splits_metric?: any[];
  splits_standard?: any[];
  laps?: any[];
  gear?: {
    id: string;
    primary: boolean;
    name: string;
    distance: number;
  };
  partner_brand_tag?: string;
  photos?: {
    primary?: any;
    count: number;
  };
  highlighted_kudosers?: any[];
  hide_from_home?: boolean;
  device_watts?: boolean;
  average_watts?: number;
  kilojoules?: number;
  average_cadence?: number;
  average_temp?: number;
  suffer_score?: number;
}

/**
 * Athlete profile
 */
export interface Athlete {
  id: number;
  username?: string;
  resource_state: number;
  firstname: string;
  lastname: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  summit?: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id?: number;
  profile_medium?: string;
  profile?: string;
  friend?: string;
  follower?: string;
}

/**
 * Athlete stats
 */
export interface AthleteStats {
  biggest_ride_distance?: number;
  biggest_climb_elevation_gain?: number;
  recent_ride_totals: ActivityTotals;
  recent_run_totals: ActivityTotals;
  recent_swim_totals: ActivityTotals;
  ytd_ride_totals: ActivityTotals;
  ytd_run_totals: ActivityTotals;
  ytd_swim_totals: ActivityTotals;
  all_ride_totals: ActivityTotals;
  all_run_totals: ActivityTotals;
  all_swim_totals: ActivityTotals;
}

export interface ActivityTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

/**
 * Activity streams
 */
export interface StreamSet {
  time?: Stream;
  distance?: Stream;
  latlng?: Stream;
  altitude?: Stream;
  velocity_smooth?: Stream;
  heartrate?: Stream;
  cadence?: Stream;
  watts?: Stream;
  temp?: Stream;
  moving?: Stream;
  grade_smooth?: Stream;
}

export interface Stream {
  data: any[];
  series_type: string;
  original_size: number;
  resolution: string;
}

/**
 * Club activity
 */
export interface ClubActivity extends ActivitySummary {
  athlete: {
    resource_state: number;
    firstname: string;
    lastname: string;
  };
}

/**
 * Upload response
 */
export interface Upload {
  id: number;
  id_str: string;
  external_id: string;
  error?: string;
  status: string;
  activity_id?: number;
}

/**
 * Activity zones
 */
export interface ActivityZones {
  heartrate?: {
    custom_zones: boolean;
    zones: Zone[];
  };
  power?: {
    zones: Zone[];
  };
}

export interface Zone {
  min: number;
  max: number;
  time: number;
}

/**
 * OpenAI search tool result format
 * Must be JSON-encoded in tool response
 */
export interface OpenAISearchResult {
  id: string;
  title: string;
  url: string;
}

/**
 * OpenAI search tool response format
 */
export interface OpenAISearchResponse {
  results: OpenAISearchResult[];
}

/**
 * OpenAI fetch tool result format
 * Must be JSON-encoded in tool response
 */
export interface OpenAIFetchResult {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, any>;
}
