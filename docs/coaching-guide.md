---
layout: default
title: Coaching Guide
nav_order: 6
---

# Coaching Guide
{: .no_toc }

Learn how to use the Strava MCP Server like a performance coach to maximize value from your training data.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The Strava MCP Server transforms Claude into your personal performance coach, helping you derive maximum value from your Strava data through:

1. **Activity Enrichment** - Transform generic workout titles into detailed training logs
2. **Performance Analysis** - Analyze telemetry data for insights on pacing, heart rate, and power
3. **Progress Tracking** - Monitor training volume, intensity, and consistency
4. **Personalized Guidance** - Evidence-based training recommendations

---

## Activity Enrichment

Many athletes sync workouts from devices like Apple Watch with generic names ("Morning Run", "Afternoon Ride") and no descriptions. The MCP server helps transform these into rich training logs.

### Standard Enrichment Process

1. **Discover** → "Show me today's activities"
2. **Analyze** → Claude reviews distance, pace, heart rate, elevation
3. **Gather Context** → Claude asks how it felt, what the goal was
4. **Enrich** → Claude updates activity with meaningful title and rich description
5. **Coach** → Claude provides performance insights and training guidance

### Example Transformation

**Before:**
```
Name: Morning Run
Description: (empty)
```

**After:**
```
Name: Progressive Long Run - 10K Base Building

Description: Perfect conditions at 55°F, overcast. Goal was easy
Zone 2 aerobic work and nailed it - HR stayed 135-145 for 93% of
the run. Started at 5:15/km pace, built naturally to 4:50/km in
final 2K without forcing. Legs felt surprisingly fresh after
yesterday's tempo session. This is exactly what recovery runs should
feel like - conversational effort throughout, building aerobic base
while allowing active recovery. Form felt relaxed and efficient.
```

---

## Conversation Patterns

### Pattern 1: Morning Check-In

**You**: "How did I do today?"

**Claude**:
1. Calculates today's timestamp
2. Finds today's activities with `get_activities`
3. Reviews each activity
4. Asks about workouts with generic names
5. Updates activities with rich context
6. Provides summary and encouragement

### Pattern 2: Activity Enrichment

**You**: "Update my morning run"

**Claude**:
1. Finds the run with `get_activities` (recent)
2. Reviews distance, pace, heart rate
3. Asks: "How did it feel? What was the goal?"
4. Listens to your response
5. Updates with `update_activity`:
   - Meaningful title
   - Rich description with your feedback
   - Coaching observations
6. Confirms update and offers insights

### Pattern 3: Race Analysis

**You**: "Analyze my half marathon from yesterday"

**Claude**:
1. Finds the race with `get_activities`
2. Gets full details with `get_activity_by_id`
3. Gets telemetry with `get_activity_streams`
4. Analyzes:
   - Pacing strategy (splits)
   - Heart rate response
   - Elevation impact
   - Comparison to goal pace
5. Provides detailed feedback with data
6. Updates activity with analysis in description
7. Offers recommendations for next race

### Pattern 4: Progress Review

**You**: "How's my training going this month?"

**Claude**:
1. Gets stats with `get_athlete_stats`
2. Gets activities with date range
3. Analyzes:
   - Consistency (activities/week)
   - Volume (distance, time)
   - Intensity (pace trends)
   - Variety (sport types)
4. Compares to previous periods
5. Celebrates progress
6. Identifies improvement areas
7. Sets next goals

### Pattern 5: Weekly Summary

**You**: "Summarize my week"

**Claude**:
1. Calculates week timestamps
2. Gets activities for the week
3. Compiles statistics
4. Identifies best efforts
5. Notes patterns (recovery, hard days)
6. Provides markdown summary
7. Offers next week's focus

---

## Best Practices

### Title Writing

**Poor titles:**
- ❌ "Morning Run"
- ❌ "Afternoon Ride"
- ❌ "Workout"

**Good titles:**
- ✅ "Tempo Run - 5K @ Marathon Pace"
- ✅ "Recovery Run - Easy Zone 2"
- ✅ "Hill Repeats - 8x400m"
- ✅ "Progressive Long Run - 10K Build"

### Description Template

```
[Weather/Conditions] [Goal/Purpose] [Execution/Performance]
[How it Felt] [Notable Observations] [Training Context]
```

### Example Descriptions

**Example 1:**
```
Perfect fall weather, 62°F with light breeze. Goal was controlled
tempo effort at marathon pace. Executed well - hit 4:30/km for the
middle 5K with HR steady at 168-172. Felt strong and sustainable.
Slight fatigue in final 2K but maintained form. Confidence builder
for upcoming race. Recovery tomorrow.
```

**Example 2:**
```
Brutal hill workout! 10 repeats of the neighborhood hill (~300m,
8% grade). 2-3 min up hard, jog down recovery. HR spiked to 180+
on each rep but recovered well. Legs were burning by rep 7 but
pushed through. These are getting easier - last month I could
barely finish 6 reps. Clear progress! Ice bath after.
```

---

## Technical Tips

### Working with Timestamps

Claude can calculate timestamps for you, but if you need to:

```javascript
// Get current timestamp
const now = Math.floor(Date.now() / 1000);

// Today at midnight (local time)
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayEpoch = Math.floor(today.getTime() / 1000);

// Specific date
const specificDate = new Date('2026-01-17T00:00:00');
const specificEpoch = Math.floor(specificDate.getTime() / 1000);
```

### Rate Limits

Strava enforces API limits:
- 100 requests per 15 minutes
- 1,000 requests per day

**Best Practices:**
- Don't repeatedly fetch the same data
- Use date filtering to reduce results
- Space out bulk operations

---

## Advanced Usage

### Telemetry Analysis

Ask Claude to analyze your race with streams:

**You**: "Analyze my race pacing using the telemetry data"

**Claude** will:
1. Get activity streams (time, distance, velocity, heartrate)
2. Calculate splits and pacing
3. Analyze heart rate zones
4. Check for cardiac drift
5. Provide detailed insights

### Training Volume Trends

**You**: "Compare my training this month vs last month"

**Claude** will:
1. Get athlete stats for recent period
2. Get activities for both months
3. Compare volume, consistency, intensity
4. Identify trends and patterns
5. Provide recommendations

---

## Common Questions

### "How do I give context for better descriptions?"

Be specific when Claude asks:
- Mention weather conditions
- Explain the workout goal
- Describe how you felt
- Note any challenges
- Reference recent training context

### "Can Claude update multiple activities at once?"

Yes! Say: "Enrich all my runs from this week. I'll tell you about each one."

### "What if my activity doesn't have heart rate data?"

Claude can still enrich with:
- Pace analysis
- Elevation impact
- Training context
- How you felt
- Route details

### "How detailed should descriptions be?"

Aim for 3-5 sentences covering:
1. Conditions and goal
2. Execution and performance
3. How it felt
4. Notable observations
5. Training context

---

## Privacy Considerations

When creating descriptions:
- Focus on performance, not personal details
- Avoid sharing specific locations in public activities
- Keep descriptions about training, not personal life
- Remember descriptions may be visible to followers

---

## Getting Started

**Simple workflow to start:**

1. **Morning after workout**: "Show me today's activities"
2. **Pick one to enrich**: "Update my morning run"
3. **Answer Claude's questions** about how it felt
4. **Review the enriched activity** in Strava
5. **Repeat daily** to build detailed training history

Over time, these enriched descriptions become invaluable for:
- Understanding what training works for you
- Identifying patterns in performance
- Planning future training cycles
- Learning from past successes and mistakes

---

## Need More Help?

- See [Examples](examples) for specific use cases
- Check [API Reference](api) for tool details
- Visit [GitHub](https://github.com/Stealinglight/StravaMCP) for support

---

Happy training! 🏃‍♂️🚴‍♀️💪
