---
layout: default
title: API Reference
nav_order: 4
---

# API Reference
{: .no_toc }

Complete reference for all 11 Strava MCP tools.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Activities

### get_activities

List recent activities with optional date filtering.

**Parameters**:
- `before` (number, optional): Epoch timestamp - activities before this time
- `after` (number, optional): Epoch timestamp - activities after this time
- `page` (number, optional): Page number (default: 1)
- `per_page` (number, optional): Results per page, max 200 (default: 30)

**Example**:
```json
{
  "after": 1705104000,
  "per_page": 10
}
```

**Response**: Array of activity summaries with id, name, distance, moving_time, type, etc.

---

### get_activity_by_id

Get detailed information about a specific activity.

**Parameters**:
- `id` (number, required): Activity ID

**Example**:
```json
{
  "id": 123456789
}
```

**Response**: Full activity details including splits, laps, segment efforts, gear, and more.

---

### create_activity

Create a new manual activity.

**Parameters**:
- `name` (string, required): Activity name
- `sport_type` (string, required): Activity type (Run, Ride, Swim, etc.)
- `start_date_local` (string, required): ISO 8601 formatted date
- `elapsed_time` (number, required): Total elapsed time in seconds
- `description` (string, optional): Activity description
- `distance` (number, optional): Distance in meters
- `trainer` (boolean, optional): Indoor trainer activity
- `commute` (boolean, optional): Mark as commute

**Example**:
```json
{
  "name": "Morning Run",
  "sport_type": "Run",
  "start_date_local": "2026-01-17T07:30:00Z",
  "elapsed_time": 3600,
  "distance": 10000,
  "description": "Easy recovery run"
}
```

**Response**: Created activity object.

---

### update_activity

Update an existing activity's metadata.

**Parameters**:
- `id` (number, required): Activity ID to update
- `name` (string, optional): New activity name
- `sport_type` (string, optional): New activity type
- `description` (string, optional): New description
- `trainer` (boolean, optional): Mark as trainer activity
- `commute` (boolean, optional): Mark as commute
- `gear_id` (string, optional): Gear ID to associate

**Example**:
```json
{
  "id": 123456789,
  "name": "Progressive Long Run - 10K",
  "description": "Great run! Started easy and built pace in final 5K..."
}
```

**Response**: Updated activity object.

{: .tip }
> This is the **key tool** for enriching activities with meaningful titles and descriptions!

---

### get_activity_zones

Get heart rate and power zone distribution for an activity.

**Parameters**:
- `id` (number, required): Activity ID

**Example**:
```json
{
  "id": 123456789
}
```

**Response**: Zone distribution data showing time spent in each heart rate/power zone.

---

## Athlete

### get_athlete

Get the authenticated athlete's profile information.

**Parameters**: None

**Example**:
```json
{}
```

**Response**: Athlete profile including id, username, firstname, lastname, city, state, country, sex, premium status, profile photo, and more.

---

### get_athlete_stats

Get activity statistics for the authenticated athlete.

**Parameters**:
- `id` (number, optional): Athlete ID (defaults to authenticated athlete)

**Example**:
```json
{}
```

**Response**: Statistics including:
- Recent (last 4 weeks)
- Year-to-date (YTD)
- All-time totals

For each period: count, distance, moving_time, elevation_gain, achievement_count.

{: .note }
> Perfect for tracking progress and training volume!

---

## Streams (Telemetry)

### get_activity_streams

Get time-series telemetry data for an activity.

**Parameters**:
- `id` (number, required): Activity ID
- `keys` (array, optional): Stream types to include. Default: all available.

**Available stream keys**:
- `time`: Time in seconds from start
- `distance`: Distance in meters
- `latlng`: GPS coordinates [lat, lng]
- `altitude`: Elevation in meters
- `velocity_smooth`: Speed in m/s
- `heartrate`: Heart rate in BPM
- `cadence`: Steps/min (running) or RPM (cycling)
- `watts`: Power in watts
- `temp`: Temperature in Celsius
- `moving`: Boolean - was athlete moving
- `grade_smooth`: Gradient/slope percentage

**Example**:
```json
{
  "id": 123456789,
  "keys": ["time", "heartrate", "velocity_smooth", "altitude"]
}
```

**Response**: Array of stream objects, each containing:
- `type`: Stream type
- `data`: Array of values
- `series_type`: "time" or "distance"
- `original_size`: Number of data points
- `resolution`: "low", "medium", or "high"

{: .tip }
> Use streams for deep performance analysis - pacing, heart rate zones, elevation impact, etc.

---

## Clubs

### get_club_activities

Get recent activities from club members.

**Parameters**:
- `id` (number, required): Club ID
- `page` (number, optional): Page number (default: 1)
- `per_page` (number, optional): Results per page, max 200 (default: 30)

**Example**:
```json
{
  "id": 987654,
  "per_page": 20
}
```

**Response**: Array of club activity summaries.

---

## Uploads

### create_upload

Upload an activity file (FIT, TCX, or GPX).

**Parameters**:
- `file` (string, required): Base64 encoded file content
- `name` (string, optional): Activity name
- `description` (string, optional): Activity description
- `trainer` (boolean, optional): Indoor trainer activity
- `commute` (boolean, optional): Mark as commute
- `data_type` (string, required): File type - "fit", "tcx", or "gpx"
- `external_id` (string, optional): External identifier

**Example**:
```json
{
  "file": "base64_encoded_file_content_here",
  "data_type": "fit",
  "name": "Bike Ride",
  "description": "Uploaded from Garmin"
}
```

**Response**: Upload object with id and status.

---

### get_upload

Check the status of a file upload.

**Parameters**:
- `id` (number, required): Upload ID (from create_upload)

**Example**:
```json
{
  "id": 123456789
}
```

**Response**: Upload status object:
- `id`: Upload ID
- `external_id`: External identifier
- `error`: Error message if failed
- `status`: Processing status
- `activity_id`: Created activity ID (when complete)

---

## Sport Types

Valid `sport_type` values for activities:

### Running
- `Run`
- `TrailRun`
- `VirtualRun`

### Cycling
- `Ride`
- `MountainBikeRide`
- `GravelRide`
- `EBikeRide`
- `VirtualRide`
- `Velomobile`

### Water
- `Swim`
- `Kayaking`
- `Canoeing`
- `Rowing`
- `StandUpPaddling`
- `Surfing`
- `Kitesurf`
- `Windsurf`

### Winter
- `AlpineSki`
- `BackcountrySki`
- `NordicSki`
- `Snowboard`
- `Snowshoe`
- `IceSkate`

### Other
- `Walk`
- `Hike`
- `RockClimbing`
- `Crossfit`
- `Workout`
- `WeightTraining`
- `Yoga`
- `Pilates`
- `Golf`
- `Tennis`
- `Soccer`
- `Basketball`
- `Wheelchair`
- `Handcycle`

---

## Rate Limits

Strava enforces API rate limits:
- **100 requests per 15 minutes**
- **1,000 requests per day**

The MCP server doesn't implement rate limiting - clients should handle this appropriately.

{: .warning }
> Exceeding rate limits returns HTTP 429 errors. Space out requests when performing bulk operations.

---

## Error Handling

All tools return errors in this format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Invalid activity ID"
    }
  ],
  "isError": true
}
```

Common error scenarios:
- **401 Unauthorized**: OAuth token expired (server auto-refreshes)
- **404 Not Found**: Activity/club/upload doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Error**: Strava API issue

---

Next: [Examples](examples) - See these tools in action
