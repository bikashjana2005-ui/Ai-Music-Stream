import { Track, SubscribedChannel } from '../types';

export const DEFAULT_CHANNELS: SubscribedChannel[] = [
  {
    id: "UCcrazyxyz_001",
    name: "Crazy XYZ",
    handle: "@CrazyXYZ",
    avatar: "https://unavatar.io/youtube/CrazyXYZ",
    subscribers: "28.5M subscribers"
  },
  {
    id: "UCdangaltv_002",
    name: "Dangal TV",
    handle: "@DangalTVChannel",
    avatar: "https://unavatar.io/youtube/DangalTVChannel",
    subscribers: "22.1M subscribers"
  },
  {
    id: "UCtrakintech_003",
    name: "Trakin Tech",
    handle: "@trakintech",
    avatar: "https://unavatar.io/youtube/trakintech",
    subscribers: "14.2M subscribers"
  },
  {
    id: "UCtechnoruhez_004",
    name: "Techno Ruhez",
    handle: "@technoruhez",
    avatar: "https://unavatar.io/youtube/technoruhez",
    subscribers: "3.8M subscribers"
  },
  {
    id: "UCstarjalsha_123",
    name: "Star Jalsha",
    handle: "@starjalsha",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Star_Jalsha_2019.png/512px-Star_Jalsha_2019.png",
    subscribers: "18.5M subscribers"
  },
  {
    id: "UCq-Fj5jknLsUf-MWSy4_brA",
    name: "T-Series",
    handle: "@TSeries",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/T-Series_logo.svg/512px-T-Series_logo.svg.png",
    subscribers: "272M subscribers"
  },
  {
    id: "UCJ93-4jO6834R_U2xM6wIew",
    name: "Sony Music India",
    handle: "@SonyMusicIndia",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Sony_Music_logo.svg/512px-Sony_Music_logo.svg.png",
    subscribers: "61M subscribers"
  },
  {
    id: "UCzeebangla_456",
    name: "Zee Bangla",
    handle: "@zeebangla",
    avatar: "https://unavatar.io/youtube/zeebangla",
    subscribers: "12.4M subscribers"
  }
];

export const DEFAULT_TRACKS: Track[] = [
  {
    id: "BddP6PYo2gs",
    title: "Census | जनगणनाय उत्तर दिते हवे 33टि प्रश्नेर? कौन कौन প্রশ্ন? कौन कौन নথি?",
    channel: "Kolkata TV",
    views: "32K views",
    duration: "3:05",
    publishedTime: "5 minutes ago",
    aiMoodTags: "News • Live • Info",
    genre: "News"
  },
  {
    id: "fG246bTq7pM",
    title: "Who's More Self-Obsessed? | Ft. Nancy & Dev | Interview Part 01",
    channel: "Directors Kut Productions",
    views: "96K views",
    duration: "20:33",
    publishedTime: "2 days ago",
    aiMoodTags: "Interview • Talk Show",
    genre: "Podcasts"
  },
  {
    id: "ElZfdU54Cp8",
    title: "'Dola Re' पर Shreya और Kavita Ji का Iconic Duet | Indian Idol S14 Grand Finale",
    channel: "SET India",
    views: "803K views",
    duration: "12:12",
    publishedTime: "8 months ago",
    aiMoodTags: "Music • Duet • Idol",
    genre: "Hindi"
  },
  {
    id: "H7Z-64y9418",
    title: "Man Sundar || 6 August || Badi Nani Poonam ka asli chahera aagaya samne",
    channel: "Khtti Mithi Takraar",
    views: "74K views",
    duration: "1:56",
    publishedTime: "5 hours ago",
    aiMoodTags: "Promo • Drama",
    genre: "News"
  },
  {
    id: "VAdGW7QDJiU",
    title: "Kesariya - Brahmāstra | Arijit Singh, Pritam | Ranbir Kapoor, Alia Bhatt",
    channel: "Sony Music India",
    views: "520M views",
    duration: "4:28",
    publishedTime: "1 year ago",
    aiMoodTags: "Hindi • Romantic • Melody",
    genre: "Hindi"
  },
  {
    id: "22Rk5t5oQ1g",
    title: "Mon Majhi Re - Boss | Jeet, Subhashree | Arijit Singh Hits",
    channel: "SVF Bangla",
    views: "85M views",
    duration: "4:15",
    publishedTime: "2 years ago",
    aiMoodTags: "Bengali • Romantic • Soulful",
    genre: "Bengali"
  },
  {
    id: "g6fnFALEseE",
    title: "Apna Bana Le - Bhediya | Varun Dhawan, Kriti Sanon | Arijit Singh, Sachin-Jigar",
    channel: "Zee Music Company",
    views: "430M views",
    duration: "4:21",
    publishedTime: "1 year ago",
    aiMoodTags: "Hindi • Heartfelt • Acoustic",
    genre: "Hindi"
  },
  {
    id: "WcOqJtWfW9I",
    title: "Chaleya - Jawan | Shah Rukh Khan, Nayanthara | Arijit Singh, Shilpa Rao",
    channel: "T-Series",
    views: "380M views",
    duration: "3:20",
    publishedTime: "6 months ago",
    aiMoodTags: "Hindi • Groovy • Romantic",
    genre: "Hindi"
  },
  {
    id: "RLzC55ai0eo",
    title: "FINALLY MY LAST DAY VLOG is here 🥳🥳🥳 #main #vlog",
    channel: "Nancy Roy",
    views: "48K views",
    duration: "8:45",
    publishedTime: "7 hours ago",
    aiMoodTags: "Vlog • Daily",
    genre: "Podcasts"
  }
];

export const MOOD_CATEGORIES = [
  { id: 'all', name: '✨ All Indian Languages', moodPrompt: 'Top Trending Songs Hindi Bengali Punjabi Tamil Telugu Hits' },
  { id: 'hindi-hits', name: '🇮🇳 Hindi Chartbusters', moodPrompt: 'Top Trending Hindi Bollywood Romantic Hits Arijit Singh' },
  { id: 'bengali-hits', name: '🇧🇩/🇮🇳 Bengali Hits', moodPrompt: 'Popular Bengali Hits Romantic Songs and Rabindra Sangeet Arijit Singh Anupam Roy' },
  { id: 'punjabi-hits', name: '🌾 Punjabi Beats', moodPrompt: 'Top Punjabi Songs Bhangra Beats Karan Aujla Diljit' },
  { id: 'south-hits', name: '🎸 Tamil & Telugu Hits', moodPrompt: 'Top Tamil Telugu Songs Anirudh AR Rahman Sid Sriram' },
  { id: 'lofi-desi', name: '☕ Desi Lofi Chill', moodPrompt: 'Hindi Bengali Lofi Chill Beats Slowed Reverb' },
  { id: 'workout', name: '⚡ High Energy Hits', moodPrompt: 'Energetic Indian Dance Beats Gym Hits Punjabi Bollywood' }
];
