# Full Video Player Screenshot Redesign & Last-Played Mini Video Player

Redesign the full video player (`YouTubeStandardWebPlayer`) to match the exact layout, typography, single-row channel/action bar, compact comments card, and edge-to-edge recommendation feed shown in the reference screenshot, while updating the mini video player to strictly display only real user-played videos without falling back to a default track on startup.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and behavioral decisions incorporate your confirmed preferences from the clarification step:

- **Confirmed Decision — Mini Video Player Last-Played Persistence**: The mini video player will never load a hardcoded default fallback (`DEFAULT_TRACKS[0]`). It will initialize strictly from the user's actual last-played video stored in `localStorage` (`aura_ai_last_played_track`). If no video has been played yet, no default dummy video is shown; once any video is played, the mini video player always remembers and displays that last-played video whenever the full player is minimized or closed.
- **Confirmed Decision — Single-Row Channel & Icon Action Bar**: Below the title and `@handle` metadata line, the channel avatar and Subscribe/Bell pill sit on the left, while the 5 icon-only actions (**Like**, **Dislike**, **Share**, **4-Point Star Highlights/Festive Sheet**, and **More Options `•••`**) sit aligned on the right of the exact same horizontal row.
- **Confirmed Decision — Visual Styling**: Pure dark `#0f0f0f` canvas with crisp white outline icons matching the screenshot, plus subtle optional Laxmi Puja access via the 4-point star / action menu.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Transforms the full video player into the streamlined dark layout from the reference screenshot: edge-to-edge 16:9 video stage at the top, compact title + `@handle · likes · views · timeAgo · #tags ...more` line, unified single-row channel & icon bar, dark rounded `Comments` preview card with inline `"Comment..."` pill input, and full-width edge-to-edge recommended video cards below.
  2. Updates state initialization and persistence so the mini video player exclusively displays the user's real last-played video (persisted across reloads) rather than a default pre-populated track.
- **Target Audience / Persona**: Mobile-first and desktop music/video streamers who want an authentic, distraction-free YouTube dark watch experience.
- **Key Value**: Eliminates visual clutter below the video player, places all primary engagement actions within natural one-handed thumb reach on a single row, and ensures the mini player accurately reflects actual watch history.

---

## 2. User Experience & Visual Design

### Reference Screenshot Alignment
![Reference Screenshot](/public/assets/aistudio/IMG-20261018-WA0002_947e4ddd.jpg)

- **Key User Flows**:
  1. **Watching a Video in Full Player**:
     - The 16:9 video plays flush at the top of the viewport with a thin bottom progress bar.
     - Directly below the video, the title appears in bold white typography, followed by a single metadata row (`@channelhandle  87 likes  3.1K views  2h ago  #tag  more`). Tapping `more` toggles the full description drawer.
     - On the next row, the user sees the channel avatar + bell notification pill (`🔔 ⌄`) on the left, and 5 crisp outline icons on the right: **Thumbs Up**, **Thumbs Down**, **Share Arrow**, **4-Point Star (`✦`)**, and **More (`•••`)**.
     - Below the action row sits a rounded dark gray **Comments Card** (`Comments 3` with carousel indicator on top, user initial badge `B` + `"Comment..."` pill input below). Tapping or typing allows instant commenting or expanding all comments.
     - Scrolling down reveals **Edge-to-Edge Recommended Video Cards** (`16:9` full-width thumbnail, bottom-right duration badge `39:45`, bottom progress hairline, and below it the channel avatar, 2-line title, `•••` button, and `Channel Name  ▷ 5.1M  3d ago` metadata).
  2. **Mini Video Player (Last Played Video Only)**:
     - On initial app launch with no prior watch history, the mini player remains hidden instead of showing a default fallback track.
     - As soon as the user plays a video (or if `aura_ai_last_played_track` exists from a previous session), that exact video is stored as `lastPlayedVideo` and shown in the mini video player whenever the full player is minimized or closed.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Authentic dark media player (`#0f0f0f` primary canvas, `#1f1f1f` elevated card surfaces, `#2c2c2c` input pills).
  - *Color Palette & Mood*:
    - Primary Canvas: `#0f0f0f`
    - Card Surface (Comments & Pills): `#1f1f1f` / `#272727`
    - Primary Text: `#ffffff`
    - Secondary Metadata Text: `#aaaaaa` (`text-zinc-400`)
    - User Badge Accent: `#c2185b` (deep magenta/rose matching the `B` badge in screenshot)
  - *Typography & Hierarchy*:
    - Video Title: `17px–18px` bold white (`font-bold text-white leading-snug`).
    - Metadata Line: `12px` muted gray (`text-zinc-400`) with bold white `more` trigger.
    - Recommended Video Title: `15px` regular/medium white (`line-clamp-2 leading-snug`).
  - *Touch Targets*: All 5 icon buttons on the single-row action bar use a minimum `40px × 40px` touch target for effortless thumb reach.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single-Row Channel + Icon-Only Action Bar**
  - *Chosen Approach*: Consolidate the channel avatar, Subscribe/Bell pill, and the 5 action icons (Like, Dislike, Share, 4-Point Star, More `•••`) onto one horizontal flex row with `justify-between`. Secondary actions (Download, Save to Playlist, Loop, Quality) are accessible via the `•••` More menu sheet.
  - *Why*: Matches the uploaded screenshot pixel-for-pixel and prevents horizontal pill overflow or multi-row stacking on mobile screens.
  - *Alternatives Considered*: Keeping separate rows for Channel and text-labeled Action Pills, which takes up extra vertical space and diverges from the screenshot.

- **Decision 2: Strict Real Last-Played Video in Mini Player**
  - *Chosen Approach*: Initialize `currentTrack` and `lastPlayedVideo` strictly from `localStorage.getItem('aura_ai_last_played_track')` with `null` fallback instead of `DEFAULT_TRACKS[0]`. Also render the mini player automatically whenever `!isFullVideoPlayerOpen && lastPlayedVideo` is truthy.
  - *Why*: Directly fulfills *"In mini video player always show last played video not by default"*, ensuring no arbitrary default song appears until the user has actually played a video.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              App State                                  │
│  • lastPlayedVideo: Track | null (strictly from aura_ai_last_played_track│
│    in localStorage — NO DEFAULT_TRACKS[0] fallback)                     │
│  • currentTrack: Track | null                                           │
│  • isFullVideoPlayerOpen: boolean                                       │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
      (When Full Player Open)           (When Full Player Closed &
                    │                    lastPlayedVideo !== null)
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│       YouTubeStandardWebPlayer        │ │        VideoMiniPlayer        │
│ ┌───────────────────────────────────┐ │ │ • Always displays the user's  │
│ │ 1. Edge-to-Edge 16:9 Video Stage  │ │ │   real lastPlayedVideo        │
│ │    + Bottom Progress Hairline     │ │ │ • Play/Pause, Next, Expand    │
│ └───────────────────────────────────┘ │ └───────────────────────────────┘
│ ┌───────────────────────────────────┐ │
│ │ 2. Title & @handle Metadata Line  │ │
│ │    "@handle · likes · views · 2h" │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ 3. Single-Row Channel & Actions   │ │
│ │  [Avatar] [🔔 ⌄]   👍 👎 ↪ ✦ ••• │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ 4. Rounded Comments Card (#1f1f1f)│ │
│ │  "Comments 3"               [▬ •] │ │
│ │  [B] [ Comment...               ] │ │
│ └───────────────────────────────────┘ │
│ ┌───────────────────────────────────┐ │
│ │ 5. Edge-to-Edge Up Next Feed      │ │
│ │  Full-bleed 16:9 Thumb + Duration │ │
│ │  [Avatar] Title + ••• + Views/Age │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Interactive Component & State Mapping
1. **Last-Played Video State Initialization**:
   - Remove `DEFAULT_TRACKS[0]` fallback from `currentTrack` and `lastPlayedVideo` state initializers.
   - Only read `aura_ai_last_played_track` from `localStorage`. When a user plays a video, save it to `aura_ai_last_played_track` and set `lastPlayedVideo`.
   - Keep `isMiniPlayerDismissed` defaulting to `false` whenever a track is played or minimized so the mini player always stays visible with the last played video.
2. **Full Video Player Redesign**:
   - **Title & Metadata**: Render bold title + single-line `@handle  {likes} likes  {views}  {timeAgo}  #দুর্গাপূজা  more` with click-to-expand description sheet.
   - **Single-Row Channel & Action Icons**:
     - Left: Channel avatar + Subscribe button (`Subscribe` when unsubscribed; `🔔 ⌄` dark pill `#272727` when subscribed).
     - Right: Outline icon buttons for Like (`ThumbsUp`), Dislike (`ThumbsDown`), Share (`Share2`), 4-Point Star (`Sparkles` — opens AI/Video Highlights & Festive sheet), and More (`MoreHorizontal` — opens action drawer for Download, Save to Playlist, Quality, and Loop).
   - **Comments Preview Card**:
     - Dark `#1f1f1f` rounded-2xl container with `Comments {count}` header, carousel indicator `[▬ •]`, user avatar badge `B`, and `"Comment..."` pill input (`#2c2c2c`) that expands/submits inline comments.
   - **Edge-to-Edge Up Next Feed**:
     - Full-width `aspect-video` thumbnail with bottom-right duration badge (`39:45`) and bottom progress hairline, followed by channel avatar, 2-line title, `▷ {views}  {timeAgo}` subtitle, and `•••` menu trigger.
