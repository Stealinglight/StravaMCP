---
name: strava-coaching
description: >
  Strava activity enrichment and fitness coaching workflows. Guides agents through
  finding, formatting, and updating Strava activities from workout notes, photos,
  and voice descriptions. Encodes formatting rules, title conventions, and safety
  protocols for the activity update flow.
user-invocable: true
---

# Strava Coaching Workflow

You have access to 11 Strava tools. This skill guides you through the most common
workflow: updating an Apple Watch auto-created activity with structured workout details.

## Activity Update Workflow

### 1. Find the Activity

- Call `strava_get_activities` with `per_page: 10` to get recent activities
- Default: update the most recent activity
- Prefer the latest activity from today or the last 18 hours
- Match sport type to user keywords:
  - "gym", "crossfit", "lifting", "workout" -> Workout or WeightTraining
  - "run" -> Run
  - "ride", "bike" -> Ride
- If multiple activities match, show a short list: start time, current title, distance, sport type
- Let the user pick

### 2. Check Before Updating

- Call `strava_get_activity_by_id` on the chosen activity
- Check if it already has a description (don't overwrite blindly)
- Note the current name, sport_type, and any existing content

### 3. Handle User Input

Accept whatever the user provides: text, photos of whiteboards, voice transcriptions, class names, scores.

Rules:
- Handle partial or messy inputs. Make a best guess and label unclear data as "approx"
- Only ask a follow-up question if a missing detail prevents a meaningful update
- Preserve units EXACTLY as provided (lb, kg, meters, cals, km). Mixed units are normal. Do not normalize.

### 4. Format the Description

Use these section headers (include only relevant ones):
- **Warm-up** (optional)
- **Strength**
- **Metcon** (or WOD, AMRAP, EMOM, For Time, etc.)
- **Accessory** (or Core/Finisher)
- **Score/Notes**

Formatting rules:
- Bullets or compact line breaks
- Do NOT use em dashes
- Call out Rx vs scaled and any substitutions
- For partner/team workouts, state the format (teams of 2, I go you go, one works one rests, etc.)
- Score near the end in a Score line
- For F3 backblasts: summarize flow and key stations, include AO/Q/PAX count

### 5. Generate the Title

Title patterns by gym:
- `Felix Athletics | [Focus]`
- `CrossFit Ballard | [Workout Type]`
- `The Office (Shanghai) | [Class Name]`
- `F3 {AO} | [Theme/Workout Name]`

Title rules:
- Titles are creative suggestions, not final. Expect the user to iterate.
- User feeling and context can inspire titles ("cable was really hard" -> "Shoulders to Failure")
- Keep titles concise but descriptive

### 6. Choose Sport Type

- Running with distance/time -> `Run`
- CrossFit, lifting + metcon, F3 bootcamp -> `Workout`
- Pure lifting only -> `WeightTraining` if the workout is primarily barbell/dumbbell work
- Default to `Workout` if unsure

### 7. Confirm Before Updating

Before calling `strava_update_activity`, ALWAYS show:
- The activity being updated (date/time, current title, sport type, distance)
- The proposed new title
- The proposed new description
- Ask: "Apply this update?"

Recognize short approvals as confirmation: "yes", "looks good", "push it", "do it", "send it"

### 8. Apply the Update

Call `strava_update_activity` with only:
- `id` (required)
- `name` (the title)
- `description` (the formatted description)
- `sport_type` (if it needs changing)

Do NOT change distance or elapsed time unless explicitly requested.

## Update Rules

- Default: replace existing description with structured version
- If user says "append": keep existing text and add a "Details" section after it
- Only update name, description, sport_type by default

## Safety

- NEVER invent weights, reps, or scores
- Mark unreadable or uncertain data as "unclear" or "approx"
- Format everything else even if some data points are uncertain
- Always confirm before calling strava_update_activity

## Other Capabilities

Beyond activity updates, you can also:
- Pull training statistics with `strava_get_athlete_stats`
- Analyze HR zones and effort with `strava_get_activity_zones` and `strava_get_activity_streams`
- Review club activities with `strava_get_club_activities`
- Upload FIT/TCX/GPX files with `strava_create_upload`
