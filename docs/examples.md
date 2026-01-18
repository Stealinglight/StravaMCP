---
layout: default
title: Examples
nav_order: 5
---

# Examples
{: .no_toc }

Common use cases and example conversations with Claude using Strava MCP.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Activity Enrichment

### Enrich Today's Workouts

**You**: "Update my activities from today"

**Claude**:
1. Uses `get_activities` with `after` = today's timestamp
2. Finds 2 activities: "Morning Run" and "Afternoon Ride"
3. Asks about each workout
4. Uses `update_activity` to add meaningful titles and descriptions

**Example Update**:

**Before**:
```
Name: Morning Run
Description: (empty)
```

**After**:
```
Name: Progressive Long Run - 10K
Description: Perfect weather at 55°F. Started easy in Zone 2,
building to threshold pace in final 3K. HR stayed controlled
throughout (avg 152 bpm). Felt strong and recovered well.
Great prep for upcoming half marathon.
```

{: .tip }
> This transforms generic activity logs into valuable training history!

---

### Batch Enrich Last Week

**You**: "Enrich all my activities from last week with better titles and descriptions"

**Claude**:
1. Calculates last week's timestamp range
2. Uses `get_activities` with `after` and `before` parameters
3. For each activity:
   - Analyzes distance, pace, heart rate
   - Asks you about the workout
   - Updates with descriptive title and rich description

---

## Performance Analysis

### Analyze a Race

**You**: "Analyze my half marathon from yesterday"

**Claude**:
1. Uses `get_activities` to find the race
2. Uses `get_activity_by_id` for full details
3. Uses `get_activity_streams` to get:
   - Heart rate data
   - Pace/velocity data
   - Elevation profile
4. Analyzes:
   - Pacing strategy (splits analysis)
   - Heart rate zones and cardiac drift
   - Elevation impact on pace
   - Comparison to goal pace

**Example Analysis**:
```
I analyzed your half marathon - congrats on the 1:42:35!

Pacing Strategy:
- 0-5K: 4:45/km (10 sec/km too fast)
- 5-15K: 4:52/km (perfect)
- 15-21K: 5:05/km (13 sec/km slower - fade)

Heart Rate:
- Started at 165 bpm, climbed to 178 by km 15
- Never settled below 170 - indicates you went out too hard

Recommendation:
Start 5-10 sec/km slower next time. Let HR settle
below 170 in first 5K. Negative split potential: 1:40:00!
```

---

### Compare Training Weeks

**You**: "Compare my training from this week vs last week"

**Claude**:
1. Uses `get_activities` for both weeks
2. Compares:
   - Total distance
   - Number of activities
   - Elevation gain
   - Time spent training
3. Identifies trends

**Example Output**:
```
This Week vs Last Week:

Distance: 65km → 72km (+11%)
Activities: 5 → 6 (+1 run)
Elevation: 450m → 680m (+51%)
Time: 5h 20m → 6h 10m (+15%)

Trend: Training load increasing nicely! The extra
elevation shows you're incorporating more hills.
Watch for fatigue - consider an easy week soon.
```

---

## Training Insights

### Check Monthly Progress

**You**: "How's my running going this month?"

**Claude**:
1. Uses `get_athlete_stats`
2. Analyzes recent (4 weeks) vs YTD stats
3. Identifies trends and milestones

**Example Response**:
```
January Training Summary:

Recent (4 weeks):
- 12 runs, 180km
- 12h 45m moving time
- 1,240m elevation gain

Year-to-Date:
- 15 runs, 210km (on pace for 2,520km/year!)

Insights:
✅ Consistent 4-5 runs/week
✅ 24% increase from December
✅ Averaging 15km per run
⚠️  Consider adding speed work for variety
```

---

### Get Zone Distribution

**You**: "What zones was I in during yesterday's run?"

**Claude**:
1. Finds the run with `get_activities`
2. Uses `get_activity_zones`
3. Analyzes time in each HR zone

**Example Analysis**:
```
Heart Rate Zone Distribution:

Zone 1 (<130 bpm):  5% - Warm up
Zone 2 (130-145):  68% - Base building ✅
Zone 3 (145-160):  22% - Tempo efforts
Zone 4 (160-175):   4% - Brief pushes
Zone 5 (>175):      1% - Max effort

This was a perfect Zone 2 aerobic run!
You stayed in the sweet spot for
base building 68% of the time.
```

---

## Activity Creation

### Log a Gym Session

**You**: "Log my gym workout from this morning - 45 minutes of strength training"

**Claude**:
1. Uses `create_activity` with:
   - `name`: "Strength Training"
   - `sport_type`: "WeightTraining"
   - `start_date_local`: This morning's time
   - `elapsed_time`: 2700 (45 minutes)
   - `description`: Details from conversation

**Created Activity**:
```json
{
  "name": "Upper Body Strength",
  "sport_type": "WeightTraining",
  "start_date_local": "2026-01-17T09:00:00Z",
  "elapsed_time": 2700,
  "description": "Bench press 3x8, Pull-ups 3x10,
                  Shoulder press 3x8. Felt strong!"
}
```

---

### Create a Manual Run

**You**: "I ran 5K this morning but forgot my watch. Can you log it?"

**Claude** asks:
- What time did you start?
- How long did it take?
- How did it feel?

Then uses `create_activity`:
```json
{
  "name": "Morning Recovery Run",
  "sport_type": "Run",
  "start_date_local": "2026-01-17T07:30:00Z",
  "elapsed_time": 1800,
  "distance": 5000,
  "description": "Easy run, no watch. Felt relaxed and
                  conversational throughout. Recovery day."
}
```

---

## Club Monitoring

### Check Team Activity

**You**: "What's my running club been up to this week?"

**Claude**:
1. Uses `get_club_activities` with your club ID
2. Summarizes recent team activities
3. Highlights notable efforts

**Example Summary**:
```
Running Club Activity (Last 7 Days):

Most Active:
- Sarah: 5 runs, 68km
- Mike: 4 runs, 52km, 840m elevation
- You: 4 runs, 45km

Longest Run: Sarah - 22km trail run
Biggest Climb: Mike - 450m hill workout

The team logged 380km combined!
Marathon training is in full swing!
```

---

## Advanced Workflows

### Pre-Race Analysis

**You**: "I have a 10K race tomorrow. Analyze my training and give me a race plan."

**Claude**:
1. Uses `get_athlete_stats` for recent volume
2. Uses `get_activities` for last 2-3 weeks
3. Finds recent tempo runs and uses `get_activity_streams`
4. Analyzes:
   - Current fitness level
   - Recent pacing at race effort
   - Heart rate at threshold

**Race Plan Example**:
```
10K Race Plan (Based on Your Training):

Target Time: 45:00 (4:30/km pace)

Splits:
- 0-2K: 4:35/km (start conservatively, HR <165)
- 2-7K: 4:30/km (settle into rhythm, HR 165-175)
- 7-10K: 4:20/km (push hard, HR can reach 180+)

Rationale:
Your recent tempo runs show you're comfortable
at 4:30/km for 6-7K with HR ~170. Starting slower
leaves energy for a strong finish.

Good luck! 🏃‍♂️
```

---

### Training Log Summary

**You**: "Create a summary of my January training"

**Claude**:
1. Uses `get_activities` for January
2. Calculates totals and averages
3. Identifies best efforts and patterns
4. Generates markdown summary

**Summary Output**:
```markdown
# January 2026 Training Summary

## Overview
- 🏃 Activities: 22
- 📏 Total Distance: 245 km
- ⏱️  Total Time: 18h 45m
- ⛰️  Total Elevation: 2,840m

## By Sport Type
- Run: 18 activities, 220km
- Ride: 3 activities, 85km
- Strength: 1 activity

## Notable Achievements
🏆 Longest Run: 22km on Jan 14
⛰️  Biggest Climb: 680m on Jan 20
⚡ Fastest 5K: 22:15 on Jan 25

## Weekly Breakdown
Week 1: 45km (3 runs)
Week 2: 62km (5 runs)
Week 3: 58km (4 runs)
Week 4: 75km (6 runs) - Biggest week!

## Trend
Consistent build throughout the month with
excellent progression. Ready for February!
```

---

## Tips for Best Results

### 1. Be Specific with Dates

Instead of "yesterday," calculate exact timestamps:
```javascript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);
const afterTimestamp = Math.floor(yesterday.getTime() / 1000);
```

### 2. Ask for Context

Claude performs better when you provide context:
- "It was hot and humid" → better description
- "First run after rest day" → explains freshness
- "Building for marathon" → frames training purpose

### 3. Batch Updates

Update multiple activities in one conversation:
```
"Enrich all my runs from this week. I'll tell
you about each one."
```

### 4. Request Analysis

Don't just ask for data - ask for insights:
- ❌ "Show my stats"
- ✅ "Analyze my progress and suggest improvements"

### 5. Use Streams for Deep Analysis

For race analysis, always request streams:
```
"Analyze my race. Look at pacing, heart rate,
and elevation impact."
```

---

## Real Conversation Example

**Full enrichment workflow**:

**You**: "Update my morning run"

**Claude**: "I found your run from this morning - 10.2km in 51:23 (5:02/km pace) with 145 avg HR. How did it feel?"

**You**: "Legs were tired from yesterday but I finished strong"

**Claude**: "I've updated your activity:

**Title**: Easy Recovery Run - 10K

**Description**: Legs felt heavy coming off yesterday's workout - classic recovery day feeling. Goal was easy aerobic pace and mission accomplished at 5:02/km with HR 145 (solid Zone 2). Sometimes the 'tired legs' runs are the most valuable for adaptation. Focused on just getting the miles in rather than pace. This is exactly what recovery runs should feel like. Building aerobic base and allowing muscles to recover while maintaining volume.

I've saved this to your Strava. These detailed logs will help you identify recovery patterns over time!"

**You**: "Thanks! That's perfect."

---

Need more examples? Check the [GitHub repository](https://github.com/Stealinglight/StravaMCP) or [open an issue](https://github.com/Stealinglight/StravaMCP/issues) with your use case!
