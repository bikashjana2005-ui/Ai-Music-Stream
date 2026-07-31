import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// --- Fallback Real Music Tracks ---
const FALLBACK_TRACKS = [
  {
    id: "BddP6PYo2gs",
    title: "Kesariya - Brahmāstra",
    channel: "Sony Music India • Arijit Singh, Pritam",
    views: "520M",
    duration: "4:28",
    aiMoodTags: "Hindi • Romantic • Melody",
    genre: "Hindi"
  },
  {
    id: "fG246bTq7pM",
    title: "Mon Majhi Re - Boss",
    channel: "Grassroot Entertainment • Arijit Singh",
    views: "85M",
    duration: "4:15",
    aiMoodTags: "Bengali • Romantic • Soulful",
    genre: "Bengali"
  },
  {
    id: "ElZfdU54Cp8",
    title: "Apna Bana Le - Bhediya",
    channel: "Zee Music Company • Arijit Singh, Sachin-Jigar",
    views: "430M",
    duration: "4:21",
    aiMoodTags: "Hindi • Heartfelt • Acoustic",
    genre: "Hindi"
  },
  {
    id: "H7Z-64y9418",
    title: "Tomake Chai - Gangster",
    channel: "SVF • Arijit Singh",
    views: "62M",
    duration: "4:02",
    aiMoodTags: "Bengali • Love • Melodious",
    genre: "Bengali"
  },
  {
    id: "VAdGW7QDJiU",
    title: "Chaleya - Jawan",
    channel: "T-Series • Arijit Singh, Shilpa Rao",
    views: "380M",
    duration: "3:20",
    aiMoodTags: "Hindi • Groovy • Romantic",
    genre: "Hindi"
  },
  {
    id: "22Rk5t5oQ1g",
    title: "Egiye De - Shudhu Tomari Jonyo",
    channel: "SVF • Arijit Singh, Madhubanti Bagchi",
    views: "48M",
    duration: "4:35",
    aiMoodTags: "Bengali • Sweet • Acoustic",
    genre: "Bengali"
  },
  {
    id: "g6fnFALEseE",
    title: "Raataan Lambiyan - Shershaah",
    channel: "Sony Music India • Jubin Nautiyal, Asees Kaur",
    views: "890M",
    duration: "3:50",
    aiMoodTags: "Hindi • Soulful • Love",
    genre: "Hindi"
  },
  {
    id: "WcOqJtWfW9I",
    title: "Tumi Jake Bhalobasho - Praktan",
    channel: "Windows Music • Iman Chakraborty",
    views: "35M",
    duration: "4:50",
    aiMoodTags: "Bengali • Classic • Emotional",
    genre: "Bengali"
  },
  {
    id: "RLzC55ai0eo",
    title: "Heeriye - Jasleen Royal ft. Arijit Singh",
    channel: "Jasleen Royal • Arijit Singh",
    views: "310M",
    duration: "3:14",
    aiMoodTags: "Hindi • Indie • Vibe",
    genre: "Hindi"
  },
  {
    id: "X808pS_t2A4",
    title: "Bhalobashar Morshum - X=Prem",
    channel: "SVF • Shreya Ghoshal, Arijit Singh",
    views: "28M",
    duration: "3:42",
    aiMoodTags: "Bengali • Rain Vibe • Melody",
    genre: "Bengali"
  },
  {
    id: "UNq8K87_E3Q",
    title: "Tum Hi Ho - Aashiqui 2",
    channel: "T-Series • Arijit Singh",
    views: "780M",
    duration: "4:22",
    aiMoodTags: "Hindi • Evergreen • Passionate",
    genre: "Hindi"
  },
  {
    id: "Q9T3zP92k8k",
    title: "Bojhena Shey Bojhena Title Track",
    channel: "SVF • Arijit Singh",
    views: "92M",
    duration: "4:40",
    aiMoodTags: "Bengali • Nostalgia • Hits",
    genre: "Bengali"
  }
];

// --- In-Memory Response Cache to prevent Gemini Rate Limits ---
const apiCache = new Map<string, { data: any; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached(key: string, data: any, ttlMs: number = 30 * 60 * 1000) {
  apiCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// --- Direct YouTube Search Results Scraper for 100% Real Playable Video IDs ---
async function searchYouTubeScrape(query: string, sortByDate?: boolean): Promise<any[]> {
  try {
    const searchQuery = query.trim();
    const url = sortByDate
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=CAI%253D`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || 
                      html.match(/window\["ytInitialData"\] = ({.*?});/s);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents || !Array.isArray(contents)) return [];

    const tracks: any[] = [];
    const seenIds = new Set<string>();

    for (const section of contents) {
      const itemSection = section?.itemSectionRenderer?.contents;
      if (itemSection && Array.isArray(itemSection)) {
        for (const item of itemSection) {
          const video = item?.videoRenderer;
          if (video && video.videoId && video.title) {
            const videoId = video.videoId;
            if (seenIds.has(videoId)) continue;
            seenIds.add(videoId);

            const title = video.title?.runs?.[0]?.text || video.title?.simpleText || "Unknown Title";
            const channel = video.ownerText?.runs?.[0]?.text || "YouTube Creator";
            const duration = video.lengthText?.simpleText || "3:45";
            const views = video.viewCountText?.simpleText || "Verified Stream";
            const publishedTime = video.publishedTimeText?.simpleText || video.publishedTimeText?.runs?.[0]?.text || "";

            // Exclude YouTube Shorts (< 0:50)
            if (duration && duration.startsWith("0:") && parseInt(duration.split(":")[1] || "0") < 50) {
              continue;
            }

            tracks.push({
              id: videoId,
              title,
              channel,
              views,
              duration,
              publishedTime,
              aiMoodTags: publishedTime ? `Uploaded ${publishedTime}` : "Full Audio Track",
              genre: "YouTube"
            });
            if (tracks.length >= 16) break;
          }
        }
      }
      if (tracks.length >= 16) break;
    }
    return tracks;
  } catch (e) {
    console.error("YouTube HTML scrape error:", e);
    return [];
  }
}

// --- YouTube Channels Search Scraper ---
async function searchYouTubeChannels(query: string): Promise<any[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!response.ok) return [];
    const html = await response.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || 
                      html.match(/window\["ytInitialData"\] = ({.*?});/s);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents || !Array.isArray(contents)) return [];

    const channels: any[] = [];
    const seen = new Set<string>();

    for (const section of contents) {
      const itemSection = section?.itemSectionRenderer?.contents;
      if (itemSection && Array.isArray(itemSection)) {
        for (const item of itemSection) {
          const ch = item?.channelRenderer;
          if (ch && ch.channelId) {
            const channelId = ch.channelId;
            if (seen.has(channelId)) continue;
            seen.add(channelId);

            const title = ch.title?.simpleText || ch.title?.runs?.[0]?.text || "YouTube Channel";
            const subsText = ch.subscriberCountText?.simpleText || "Official Creator Channel";
            const avatarRaw = ch.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || "";
            const avatar = avatarRaw.startsWith("//") ? `https:${avatarRaw}` : avatarRaw;

            channels.push({
              id: channelId,
              name: title,
              handle: ch.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl || `@${title.replace(/\s+/g, '')}`,
              avatar: avatar || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop`,
              subscribers: subsText
            });
            if (channels.length >= 8) break;
          }
        }
      }
      if (channels.length >= 8) break;
    }
    return channels;
  } catch (e) {
    console.error("YouTube channels scrape error:", e);
    return [];
  }
}

// --- API Endpoints ---

// Channel Search Endpoint
app.post("/api/channels/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) return res.json({ channels: [] });

    const cacheKey = `ch_search_${query.toLowerCase().trim()}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return res.json(cached);

    const scrapedChannels = await searchYouTubeChannels(query);
    const result = { channels: scrapedChannels };
    setCached(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (e) {
    console.error("Error searching channels:", e);
    res.json({ channels: [] });
  }
});

// Channel Latest Songs/Streams Endpoint
app.post("/api/channels/tracks", async (req, res) => {
  try {
    const { channelName, sortBy } = req.body;
    if (!channelName) return res.json({ tracks: [] });

    const isRecent = sortBy === 'recent' || sortBy === 'latest';
    const cacheKey = `ch_tracks_${channelName.toLowerCase().trim()}_${isRecent ? 'recent' : 'pop'}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return res.json(cached);

    const query = isRecent ? `${channelName}` : `${channelName} official audio full song`;
    const scrapedTracks = await searchYouTubeScrape(query, isRecent);
    const result = { tracks: scrapedTracks };
    setCached(cacheKey, result, 15 * 60 * 1000);
    res.json(result);
  } catch (e) {
    res.json({ tracks: [] });
  }
});

// Real-time YouTube Account Subscriptions Sync Endpoint
app.post("/api/youtube/sync-subscriptions", async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "Access token required" });
    }

    const ytRes = await fetch(
      "https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    if (!ytRes.ok) {
      const errText = await ytRes.text();
      console.error("YouTube API subscriptions error:", errText);
      return res.status(ytRes.status).json({ error: "Failed to fetch YouTube subscriptions from Google API" });
    }

    const data = await ytRes.json();
    const channels = (data.items || []).map((item: any) => {
      const snippet = item.snippet || {};
      const channelId = snippet.resourceId?.channelId || item.id;
      const name = snippet.title || "YouTube Channel";
      const avatar = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "";
      return {
        id: channelId,
        name: name,
        handle: `@${name.replace(/\s+/g, '')}`,
        avatar: avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop",
        subscribers: "Synced from YouTube Account"
      };
    });

    res.json({ channels });
  } catch (e: any) {
    console.error("Error syncing YouTube subscriptions:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
});

// Recommendations Endpoint
app.post("/api/music/recommendations", async (req, res) => {
  try {
    const { mood = "General Trending", genre } = req.body;
    const cacheKey = `rec_${mood}_${genre || ''}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Direct YouTube Search for 100% Real, Playable Tracks matching the mood
    const searchQuery = `${mood} ${genre || ''} official audio full song`.trim();
    const scrapedTracks = await searchYouTubeScrape(searchQuery);

    if (scrapedTracks && scrapedTracks.length > 0) {
      const result = { tracks: scrapedTracks, isFallback: false };
      setCached(cacheKey, result);
      return res.json(result);
    }

    return res.json({ tracks: FALLBACK_TRACKS, isFallback: true });
  } catch (error: any) {
    console.error("Error fetching recommendations:", error?.message || error);
    res.json({ tracks: FALLBACK_TRACKS, isFallback: true });
  }
});

// Real-time YouTube Autocomplete Suggestions Endpoint
app.get("/api/music/autocomplete", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) return res.json({ suggestions: [] });
    
    const cacheKey = `ac_${q.toLowerCase().trim()}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return res.json(cached);

    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q.trim())}`
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        const result = { suggestions: data[1].slice(0, 8) };
        setCached(cacheKey, result, 60 * 60 * 1000); // 1 hour cache
        return res.json(result);
      }
    }
    res.json({ suggestions: [] });
  } catch (e) {
    res.json({ suggestions: [] });
  }
});

// Search Endpoint
app.post("/api/music/search", async (req, res) => {
  try {
    const { query, youtubeApiKey } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    const cacheKey = `search_${query.toLowerCase().trim()}_${youtubeApiKey ? 'yt' : 'noyt'}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const ytKey = youtubeApiKey || process.env.YOUTUBE_API_KEY;

    // 1. Direct YouTube Data API Search if Key Provided
    if (ytKey && ytKey.trim().length > 10) {
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(query)}&key=${ytKey.trim()}`
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          if (ytData.items && ytData.items.length > 0) {
            const tracks = ytData.items.map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              views: "Verified Stream",
              duration: "Full Track",
              aiMoodTags: "Original Audio",
              genre: "YouTube Music"
            }));
            const result = { tracks, source: "YouTube API" };
            setCached(cacheKey, result);
            return res.json(result);
          }
        }
      } catch (e) {
        console.error("YouTube API search failed, trying public search scrape:", e);
      }
    }

    // 2. Direct YouTube Public HTML Scraper (100% Real YouTube Video IDs & Audio Streams)
    let scrapedTracks = await searchYouTubeScrape(query);
    if (!scrapedTracks || scrapedTracks.length === 0) {
      // Retry with full song keywords if initial search returned empty
      scrapedTracks = await searchYouTubeScrape(`${query} official audio full song`);
    }

    if (scrapedTracks && scrapedTracks.length > 0) {
      const result = { tracks: scrapedTracks, source: "YouTube Search" };
      setCached(cacheKey, result);
      return res.json(result);
    }

    // 3. Fallback to Gemini AI if scraping returns empty
    const ai = getGeminiClient();
    if (!ai) {
      const filtered = FALLBACK_TRACKS.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.channel.toLowerCase().includes(query.toLowerCase()) ||
        t.aiMoodTags.toLowerCase().includes(query.toLowerCase())
      );
      return res.json({ tracks: filtered.length ? filtered : FALLBACK_TRACKS, source: "Fallback" });
    }

    const prompt = `Search for music matching the query: "${query}".
Provide 6 real, valid YouTube tracks with exact 11-character YouTube Video IDs, official titles, artist/channel name, view counts, duration, and mood tags.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  channel: { type: Type.STRING },
                  views: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  aiMoodTags: { type: Type.STRING },
                  genre: { type: Type.STRING }
                },
                required: ["id", "title", "channel", "views", "duration", "aiMoodTags"]
              }
            }
          },
          required: ["tracks"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const result = { tracks: parsed.tracks || FALLBACK_TRACKS, source: "Gemini AI" };
    setCached(cacheKey, result);
    return res.json(result);
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    if (isQuota) {
      console.warn("Gemini API rate limit reached on search, serving fallbacks smoothly.");
    } else {
      console.error("Error searching music:", error?.message || error);
    }
    const filtered = FALLBACK_TRACKS.filter(t => 
      t.title.toLowerCase().includes(req.body?.query?.toLowerCase() || '') || 
      t.channel.toLowerCase().includes(req.body?.query?.toLowerCase() || '')
    );
    res.json({ tracks: filtered.length ? filtered : FALLBACK_TRACKS, source: "Fallback" });
  }
});

// Track Story & AI Insight Endpoint
app.post("/api/music/story", async (req, res) => {
  try {
    const { title, channel } = req.body;
    const cacheKey = `story_${title}_${channel}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        story: `"${title}" by ${channel} is a standout track celebrated for its captivating melody and rhythmic structure. AI audio analysis highlights its rich production and widespread listener appeal.`
      });
    }

    const prompt = `Provide a short, fascinating 2-3 sentence musical trivia, story behind the song, or musical breakdown for "${title}" by "${channel}". Make it engaging and informative for a music lover.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const result = { story: response.text?.trim() || "Track story unavailable." };
    setCached(cacheKey, result);
    return res.json(result);
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    if (isQuota) {
      console.warn("Gemini API rate limit reached on track story.");
    } else {
      console.error("Error generating track story:", error?.message || error);
    }
    res.json({ story: `"${req.body.title || 'This track'}" by ${req.body.channel || 'artist'} is an iconic audio stream.` });
  }
});

// Smart Prompt Suggestions Endpoint
app.post("/api/music/smart-prompts", async (req, res) => {
  try {
    const { mood = "relaxing" } = req.body;
    const cacheKey = `prompts_${mood}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        suggestions: ["Acoustic sunset vibes", "Deep focus lofi hip hop", "80s synthwave drive", "Upbeat workout energy", "Rainy day jazz piano"],
        aiPrompts: ["Find me chill acoustic songs for working", "Energetic EDM tracks with heavy bass", "Calming ambient soundscapes for sleeping"]
      });
    }

    const prompt = `Generate 5 creative music vibe search suggestions and 3 conversational AI music prompts based on the current mood: "${mood}".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            aiPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions", "aiPrompts"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    setCached(cacheKey, parsed);
    return res.json(parsed);
  } catch (error: any) {
    const isQuota = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    if (isQuota) {
      console.warn("Gemini API rate limit reached on smart prompts.");
    } else {
      console.error("Error generating smart prompts:", error?.message || error);
    }
    res.json({
      suggestions: ["Acoustic sunset vibes", "Deep focus lofi hip hop", "80s synthwave drive", "Upbeat workout energy"],
      aiPrompts: ["Find me chill acoustic songs for working", "Energetic EDM tracks with heavy bass"]
    });
  }
});

// --- Vite Middleware / Static Server Setup ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
