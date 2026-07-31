import { Track, SubscribedChannel } from '../types';

export const DEFAULT_CHANNELS: SubscribedChannel[] = [
  {
    id: "UCq-Fj5jknLsUf-MWSy4_brA",
    name: "T-Series",
    handle: "@TSeries",
    avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop",
    subscribers: "272M subscribers"
  },
  {
    id: "UCJ93-4jO6834R_U2xM6wIew",
    name: "Sony Music India",
    handle: "@SonyMusicIndia",
    avatar: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop",
    subscribers: "61M subscribers"
  },
  {
    id: "UC82T_D4Mrm2C_c47-kUe2vA",
    name: "SVF",
    handle: "@SVFBangla",
    avatar: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop",
    subscribers: "11M subscribers"
  },
  {
    id: "UCsJ8lToR0nQ6G9T1gR-6k4A",
    name: "Coke Studio Bangla",
    handle: "@CokeStudioBangla",
    avatar: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&auto=format&fit=crop",
    subscribers: "2.8M subscribers"
  },
  {
    id: "UCFFbwnve3yF6KulMgV0P57A",
    name: "Zee Music Company",
    handle: "@zeemusiccompany",
    avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop",
    subscribers: "108M subscribers"
  },
  {
    id: "UCSJ4gkVC6NrvII8umztf0OW",
    name: "Lofi Girl",
    handle: "@LofiGirl",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop",
    subscribers: "14M subscribers"
  }
];

export const DEFAULT_TRACKS: Track[] = [
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

export const MOOD_CATEGORIES = [
  { id: 'all', name: '✨ All Trending', moodPrompt: 'Top Trending Hindi and Bengali Hits' },
  { id: 'hindi-hits', name: '🇮🇳 Hindi Chartbusters', moodPrompt: 'Top Trending Hindi Bollywood Romantic Hits Arijit Singh' },
  { id: 'bengali-hits', name: '🇧🇩/🇮🇳 Bengali Hits', moodPrompt: 'Popular Bengali Hits Romantic Songs and Rabindra Sangeet Arijit Singh Anupam Roy' },
  { id: 'romantic', name: '💖 Hindi & Bengali Love', moodPrompt: 'Top Romantic Hindi and Bengali Love Melodies' },
  { id: 'lofi-desi', name: '☕ Desi Lofi Chill', moodPrompt: 'Hindi and Bengali Lofi Chill Beats Slowed Reverb' },
  { id: 'workout', name: '⚡ High Energy Hits', moodPrompt: 'Energetic Hindi and Bengali Dance Beats Gym Hits' },
  { id: 'classical', name: '🎹 Rabindra Sangeet & Classical', moodPrompt: 'Peaceful Rabindra Sangeet Classical Flute Sitar Acoustic' }
];
