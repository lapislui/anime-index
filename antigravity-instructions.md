# Instructions for Antigravity — Build a Site from My Nexus Stats

**You are Antigravity, an AI coding assistant. Read this whole file before doing
anything. It tells you exactly what to build and how to read my data file.**

I am **not a programmer**. Do not ask me to write or edit code. Make all the
technical decisions yourself, build the whole thing, and when you're done, give
me **simple, click-by-click instructions** for how to open and use it.

---

## 1. What I'm giving you

A JSON file exported from a game launcher called **Nexus**. It contains my video
game play statistics (total hours, top games, completion progress, etc.). The
file is named something like `nexus-stats-all-time.json` and is in this project.

If you can't find the file, ask me to drag it into the project, then continue.

---

## 2. What I want you to build

Build a **single-page website** (one HTML file with its styling and scripts)
that reads my JSON file and displays my stats beautifully. It must:

1. **Load the JSON file automatically** (don't make me paste data anywhere).
2. **Work by just opening it in a web browser** — no servers, no installing
   tools, no command line. If that's truly impossible, give me the simplest
   possible alternative and explain it in plain words.
3. Look **modern and clean** with a **dark theme**.
4. Show, at minimum:
   - **Total hours played** (see the unit rules below — the data is in seconds).
   - **Number of games played** and **number completed**.
   - **My top games** (name + hours).
   - **A list of every game I played**, each with a **progress bar** based on
     `completionPercent`, sorted with the most "in progress" near the top and
     finished games (100%) at the bottom.
   - **A genre breakdown** as a simple bar chart using the `percent` values.
5. **Handle missing data gracefully.** Many fields can be `null`. Never show
   "null", "undefined", or "NaN" — just hide that piece instead.

After building, **explain in plain English**: which file to open, how to open it,
and how I can ask you for changes later (e.g. "make it blue", "add a pie chart").

---

## 3. CRITICAL rules for reading the data

Get these wrong and every number on the page will be wrong:

- **Any field ending in `S` is in SECONDS** (e.g. `totalPlayTimeS`, `durationS`,
  `playTimeS`). To display **hours, divide by 3600**. To display **minutes,
  divide by 60**. Example: `totalPlayTimeS: 99360` → `99360 / 3600` ≈ **27.6 hours**.
- **Any field ending in `Percent` / `percent` is already 0–100.** Do not multiply
  by 100 again.
- **`completionPercent`**: `100` = finished, `45` = ~45% done, **`null` = unknown**
  (no progress tracked — show "—" or hide the bar, don't show 0%).
- **Dates** are text. Some are full timestamps (`2026-06-15T10:24:00.000Z`), some
  are just a day (`2026-06-15`). Format them nicely for a human.
- **`null` means "no data."** Always allow for it everywhere.

---

## 4. The exact data structure

The file is one JSON object shaped like this (values trimmed):

```json
{
  "schemaVersion": 2,
  "generatedAt": "2026-06-15T10:24:00.000Z",
  "app": { "name": "Nexus", "version": "0.4.1" },
  "hardware": { "cpu": "AMD Ryzen 7 7800X3D", "gpu": "NVIDIA GeForce RTX 4070" },
  "period": {
    "type": "all",
    "startDate": "1970-01-01",
    "endDate": "2026-06-15",
    "label": "All Time"
  },

  "report": {
    "totalPlayTimeS": 99360,
    "totalSessions": 210,
    "totalGamesPlayed": 48,
    "totalGamesInLibrary": 132,
    "newGamesAdded": 9,
    "mostPlayedGame": {
      "id": "abc123",
      "name": "Crimson Desert",
      "source": "steam",
      "coverUrl": "https://.../cover.jpg",
      "heroUrl": null,
      "logoUrl": null,
      "playTimeS": 99360,
      "sessionCount": 9
    },
    "mostPlayedGenre": "RPG",
    "topGames": [ { "id": "...", "name": "...", "source": "steam", "playTimeS": 12345, "sessionCount": 6, "coverUrl": null } ],
    "genreBreakdown":   [ { "name": "RPG",   "playTimeS": 50000, "percent": 50 } ],
    "platformBreakdown":[ { "source": "steam", "playTimeS": 80000, "percent": 80 } ],
    "longestSession": { "gameName": "Crimson Desert", "durationS": 14400, "startedAt": "2026-05-02T19:00:00.000Z" },
    "longestStreakDays": 14,
    "busiestDay": "2026-05-02",
    "busiestDayPlayTimeS": 21600,
    "playTimeByMonth":     [ { "month": 1, "playTimeS": 1000 } ],
    "playTimeByDayOfWeek": [ { "day": 0, "playTimeS": 1000 } ],
    "playTimeByHourOfDay": [ { "hour": 20, "playTimeS": 1000 } ],
    "funFacts": [ { "kind": "night_owl", "value": 70, "label": "70% of play after 9pm" } ],
    "moodTagline": "Always chasing the next great story",
    "hiddenGem": { "name": "Tunic", "playTimeS": 7200, "rating": 9, "tagline": "A tiny adventure you loved" },
    "trivia": [ "You played 48 different games this period." ]
  },

  "completed": {
    "count": 12,
    "games": [
      {
        "id": "abc123",
        "name": "Hades",
        "source": "steam",
        "coverUrl": "https://.../cover.jpg",
        "heroUrl": null,
        "totalPlayTimeS": 86400,
        "playCount": 40,
        "lastPlayed": "2026-04-10T22:00:00.000Z",
        "rating": 9,
        "status": "completed",
        "addedAt": "2025-12-01T10:00:00.000Z"
      }
    ]
  },

  "playedGames": {
    "count": 48,
    "games": [
      {
        "id": "def456",
        "name": "Elden Ring",
        "source": "steam",
        "totalPlayTimeS": 180000,
        "playCount": 30,
        "lastPlayed": "2026-06-01T20:00:00.000Z",
        "status": "playing",
        "rating": 10,
        "completionPercent": 65
      }
    ]
  }
}
```

### Notes on specific fields

- `playTimeByDayOfWeek[].day`: **0 = Monday … 6 = Sunday**.
- `playTimeByMonth[].month`: **1 = January … 12 = December**.
- `playTimeByHourOfDay[].hour`: **0–23** (24-hour clock).
- `source`: the store the game is from, e.g. `steam`, `epic`, `gog`, `battlenet`,
  `amazon`, `xbox`, `standalone`. You may capitalize it for display.
- `rating`: my personal score (scale up to 10), or `null` if I haven't rated it.
- Artwork URLs (`coverUrl`, `heroUrl`, `logoUrl`) may be `null` or may point to the
  web or a local file. If an image fails to load, fall back to a colored tile with
  the game's first letter — never show a broken-image icon.

---

## 5. Quality checklist before you say you're done

- [ ] Hours are computed as `seconds / 3600` (spot-check: total looks realistic).
- [ ] No "null", "undefined", or "NaN" appears anywhere on the page.
- [ ] Progress bars use `completionPercent` directly (0–100); `null` shows "—".
- [ ] The page opens correctly by double-clicking it in a file browser (or you
      clearly explained the one simple step needed).
- [ ] You finished with plain-English instructions for me, including how to ask
      for changes.

---

## 6. If I ask for changes later

I'll describe things in everyday language ("add a pie chart of platforms", "make
the top games bigger", "only show finished games"). Take care of all the code
yourself and just confirm what you changed. Never ask me to edit files.
