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

export const DEFAULT_LIKED_TRACKS: Track[] = [
  {
    id: "dKjR8zF8a4I",
    title: "We Opened 1000 GEMS Balls | 1000 GEMS Magic Pool",
    channel: "Crazy XYZ",
    views: "1.5M views",
    duration: "23:19",
    publishedTime: "2 days ago",
    aiMoodTags: "Experiment • Fun • Gems",
    genre: "Entertainment",
    thumbnail: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop"
  },
  {
    id: "fG246bTq7pM_snake",
    title: "Bablu Got Bitten By Snake 😭 | बबलू को सांप ने काटा",
    channel: "Crazy XYZ",
    views: "2.9M views",
    duration: "31:48",
    publishedTime: "4 days ago",
    aiMoodTags: "Challenge • Vlog",
    genre: "Entertainment"
  },
  {
    id: "kite_2026_xyz",
    title: "2026 New Kite Flying Challenge | Kite Stash",
    channel: "Crazy XYZ",
    views: "1.8M views",
    duration: "18:24",
    publishedTime: "1 week ago",
    aiMoodTags: "Kite • Festival • Fun",
    genre: "Entertainment"
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
  }
];

export const DEFAULT_HISTORY_TRACKS: Track[] = [
  {
    id: "crazy_prank_bablu",
    title: "Crazy Prank On Bablu Gifting E-Rickshaw 🤣 | OL...",
    channel: "Crazy XYZ",
    views: "369K views",
    duration: "25:57",
    publishedTime: "Today",
    aiMoodTags: "Prank • Funny • Vlog",
    genre: "Entertainment",
    thumbnail: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop"
  },
  {
    id: "apk_phone_build_ai",
    title: "Build Android App in Google AI Studio Using Just Your Ph...",
    channel: "N-Educate",
    views: "11K views",
    duration: "10:59",
    publishedTime: "Today",
    aiMoodTags: "Tutorial • Android • AI",
    genre: "Technology",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop"
  },
  {
    id: "promo_man_sundar",
    title: "Aakhir Do Din Baad Kiski Shaadi Hone...",
    channel: "मन सुंदर",
    views: "89K views",
    duration: "0:20",
    publishedTime: "Yesterday",
    aiMoodTags: "Promo • Drama • Shorts",
    genre: "Shorts",
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop"
  },
  {
    id: "anger_then_lost",
    title: "Anger - Then Lost | Full Episode Story",
    channel: "Crazy XYZ",
    views: "1.2M views",
    duration: "15:40",
    publishedTime: "Yesterday",
    aiMoodTags: "Story • Episode",
    genre: "Entertainment"
  },
  {
    id: "VAdGW7QDJiU",
    title: "Kesariya - Brahmāstra | Arijit Singh, Pritam",
    channel: "Sony Music India",
    views: "520M views",
    duration: "4:28",
    publishedTime: "Yesterday",
    aiMoodTags: "Hindi • Romantic",
    genre: "Hindi"
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

export const YOUTUBE_SEARCH_CATEGORIES = [
  { id: 'all', label: 'All Results', icon: 'Sparkles', count: 70 },
  { id: 'trending', label: '🔥 Trending YouTube', icon: 'Flame', count: 12 },
  { id: 'bollywood', label: '🎬 Bollywood Hits', icon: 'Music2', count: 14 },
  { id: 'bengali', label: '🇧🇩 Bengali Melodies', icon: 'Heart', count: 10 },
  { id: 'punjabi', label: '🌾 Punjabi Beats', icon: 'Zap', count: 10 },
  { id: 'south', label: '🎸 South Cinema', icon: 'Disc', count: 8 },
  { id: 'lofi', label: '☕ Desi Lo-Fi & Chill', icon: 'Coffee', count: 8 },
  { id: 'devotional', label: '🪈 Devotional & Bhajans', icon: 'Sun', count: 8 },
  { id: 'creators', label: '🧪 Viral Creators & Tech', icon: 'Video', count: 8 },
  { id: 'classics', label: '📻 90s Golden Classics', icon: 'Radio', count: 7 },
  { id: 'global', label: '🌍 Global Pop Hits', icon: 'Globe', count: 8 }
];

export const POPULAR_SEARCH_QUERIES = [
  { term: 'hindi song', category: 'bollywood', tag: 'Trending' },
  { term: 'hanuman chalisa', category: 'devotional', tag: 'Spiritual' },
  { term: 'haryanvi song', category: 'regional', tag: 'Viral' },
  { term: 'hindi movie', category: 'movies', tag: 'Cinema' },
  { term: 'hindi gana', category: 'bollywood', tag: 'Music' },
  { term: 'horror movie', category: 'movies', tag: 'Popular' },
  { term: 'happy birthday song', category: 'general', tag: 'Hits' },
  { term: 'hare krishna bhajan', category: 'devotional', tag: 'Janmashtami' },
  { term: 'Arijit Singh Best Romantic Songs', category: 'bollywood', tag: 'Trending' },
  { term: 'Chaleya Jawan Shah Rukh Khan', category: 'bollywood', tag: 'Hot' },
  { term: 'Tauba Tauba Karan Aujla', category: 'punjabi', tag: 'Viral' },
  { term: 'Crazy XYZ Experiment', category: 'creators', tag: 'Popular' },
  { term: 'Achyutam Keshavam Krishna Bhajan', category: 'devotional', tag: 'Festival' },
  { term: 'Radhe Radhe Barsane Wali', category: 'devotional', tag: 'Devotional' },
  { term: 'Coke Studio Bangla Season Hits', category: 'bengali', tag: 'Music' },
  { term: 'Desi Lo-Fi Midnight Chill Beats', category: 'lofi', tag: 'Chill' },
  { term: 'Starboy The Weeknd', category: 'global', tag: 'Global' }
];

export const YOUTUBE_SEARCH_DATA: Track[] = [
  // --- 1. Trending Indian YouTube & Bollywood Blockbusters ---
  {
    id: "VAdGW7QDJiU",
    title: "Chaleya - Jawan | Shah Rukh Khan, Nayanthara | Arijit Singh, Shilpa Rao",
    channel: "T-Series • Anirudh Ravichander",
    views: "385M views",
    duration: "3:20",
    publishedTime: "1 year ago",
    aiMoodTags: "Hindi • Groovy • Romantic",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "xWrtv-vM5iQ",
    title: "Tauba Tauba | Bad Newz | Vicky Kaushal, Triptii Dimri | Karan Aujla",
    channel: "Saregama Music • Karan Aujla",
    views: "290M views",
    duration: "3:28",
    publishedTime: "2 months ago",
    aiMoodTags: "Punjabi • Dance • Viral",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "BddP6PYo2gs",
    title: "Kesariya - Brahmāstra | Ranbir Kapoor, Alia Bhatt | Arijit Singh, Pritam",
    channel: "Sony Music India • Pritam",
    views: "530M views",
    duration: "4:28",
    publishedTime: "2 years ago",
    aiMoodTags: "Hindi • Romantic • Soulful",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "ElZfdU54Cp8",
    title: "Apna Bana Le - Bhediya | Varun Dhawan, Kriti Sanon | Arijit Singh, Sachin-Jigar",
    channel: "Zee Music Company • Sachin-Jigar",
    views: "440M views",
    duration: "4:21",
    publishedTime: "1 year ago",
    aiMoodTags: "Hindi • Heartfelt • Acoustic",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "g6fnFALEseE",
    title: "Raataan Lambiyan - Shershaah | Sidharth, Kiara | Jubin Nautiyal, Asees Kaur",
    channel: "Sony Music India • Tanishk Bagchi",
    views: "920M views",
    duration: "3:50",
    publishedTime: "3 years ago",
    aiMoodTags: "Hindi • Soulful • Love",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "RLzC55ai0eo",
    title: "Heeriye - Jasleen Royal ft. Arijit Singh | Dulquer Salmaan",
    channel: "Jasleen Royal • Arijit Singh",
    views: "330M views",
    duration: "3:14",
    publishedTime: "1 year ago",
    aiMoodTags: "Hindi • Indie Pop • Romantic",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "UNq8K87_E3Q",
    title: "Tum Hi Ho - Aashiqui 2 | Aditya Roy Kapur, Shraddha Kapoor | Arijit Singh",
    channel: "T-Series • Mithoon",
    views: "795M views",
    duration: "4:22",
    publishedTime: "11 years ago",
    aiMoodTags: "Hindi • Evergreen • Passionate",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "KUpwupYjef8",
    title: "Tere Hawaale - Laal Singh Chaddha | Aamir Khan, Kareena Kapoor | Arijit, Shilpa",
    channel: "T-Series • Pritam, Amitabh Bhattacharya",
    views: "185M views",
    duration: "5:46",
    publishedTime: "2 years ago",
    aiMoodTags: "Hindi • Spiritual Love • Melodious",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "q8qD840q5vI",
    title: "O Maahi - Dunki | Shah Rukh Khan, Taapsee Pannu | Arijit Singh, Pritam",
    channel: "T-Series • Pritam",
    views: "170M views",
    duration: "3:53",
    publishedTime: "8 months ago",
    aiMoodTags: "Hindi • Soulful • Romantic",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "gvyUuxdRdR4",
    title: "Husn - Anuv Jain | Official Music Video",
    channel: "Anuv Jain • Indie Music",
    views: "165M views",
    duration: "3:38",
    publishedTime: "8 months ago",
    aiMoodTags: "Hindi • Indie • Heartbreak",
    genre: "Lo-Fi",
    isOfficial: true
  },
  {
    id: "5Eqb_-j3FDA",
    title: "Pasoori | Ali Sethi x Shae Gill | Coke Studio Season 14",
    channel: "Coke Studio • Xulfi",
    views: "720M views",
    duration: "3:44",
    publishedTime: "2 years ago",
    aiMoodTags: "Fusion • Folk Pop • Infectious",
    genre: "Bollywood",
    isOfficial: true
  },
  {
    id: "_XBVWlI8TsQ",
    title: "Kahani Suno 2.0 - Kaifi Khalil | Official Video",
    channel: "Kaifi Khalil Official",
    views: "430M views",
    duration: "3:02",
    publishedTime: "2 years ago",
    aiMoodTags: "Urdu • Soulful • Melancholic",
    genre: "Bollywood",
    isOfficial: true
  },

  // --- 2. Bengali Hits & Evergreen Melodies ---
  {
    id: "fG246bTq7pM",
    title: "Mon Majhi Re - Boss | Jeet, Subhashree | Arijit Singh Hits",
    channel: "SVF Bangla • Jeet Gannguli",
    views: "88M views",
    duration: "4:15",
    publishedTime: "10 years ago",
    aiMoodTags: "Bengali • Romantic • Soulful",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "H7Z-64y9418",
    title: "Tomake Chai - Gangster | Yash, Mimi Chakraborty | Arijit Singh",
    channel: "SVF • Jeet Gannguli",
    views: "64M views",
    duration: "4:02",
    publishedTime: "7 years ago",
    aiMoodTags: "Bengali • Love • Melodious",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "WcOqJtWfW9I",
    title: "Tumi Jake Bhalobasho - Praktan | Rituparna, Prosenjit | Iman Chakraborty",
    channel: "Windows Music • Anupam Roy",
    views: "36M views",
    duration: "4:50",
    publishedTime: "8 years ago",
    aiMoodTags: "Bengali • National Award • Emotional",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "X808pS_t2A4",
    title: "Bhalobashar Morshum - X=Prem | Shreya Ghoshal, Arijit Singh | Saptak",
    channel: "SVF • Srijit Mukherji",
    views: "30M views",
    duration: "3:42",
    publishedTime: "2 years ago",
    aiMoodTags: "Bengali • Monsoon Love • Acoustic",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "Q9T3zP92k8k",
    title: "Bojhena Shey Bojhena Title Track | Soham, Mimi | Arijit Singh",
    channel: "SVF • Indraadip Dasgupta",
    views: "95M views",
    duration: "4:40",
    publishedTime: "11 years ago",
    aiMoodTags: "Bengali • Nostalgia • Heartbreak",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "22Rk5t5oQ1g",
    title: "Egiye De - Shudhu Tomari Jonyo | Dev, Subhashree | Arijit Singh, Madhubanti",
    channel: "SVF • Arindom Chatterjee",
    views: "50M views",
    duration: "4:35",
    publishedTime: "8 years ago",
    aiMoodTags: "Bengali • Sweet Romance • Acoustic",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "z0mQ6l_bH0g",
    title: "Amar Mawte - Fossils | Rupam Islam Rock Classic",
    channel: "Fossils Music • Rupam Islam",
    views: "18M views",
    duration: "5:12",
    publishedTime: "9 years ago",
    aiMoodTags: "Bengali Rock • Energetic • Anthem",
    genre: "Bengali",
    isOfficial: true
  },
  {
    id: "bg_bengali_anupam",
    title: "Amake Amar Moto Thakte Dao - Autograph | Anupam Roy",
    channel: "SVF • Anupam Roy Official",
    views: "42M views",
    duration: "4:48",
    publishedTime: "13 years ago",
    aiMoodTags: "Bengali • Philosophy • Iconic",
    genre: "Bengali",
    isOfficial: true
  },

  // --- 3. Punjabi Bangers & Urban Hits ---
  {
    id: "goat_diljit_punjabi",
    title: "G.O.A.T. - Diljit Dosanjh | Official Music Video | Famous",
    channel: "Diljit Dosanjh • Punjabi Hits",
    views: "320M views",
    duration: "3:44",
    publishedTime: "4 years ago",
    aiMoodTags: "Punjabi • Swag • Urban Hip Hop",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "lover_diljit_moon",
    title: "Lover - Diljit Dosanjh | MoonChild Era | Intense",
    channel: "Diljit Dosanjh • Pop Punjabi",
    views: "190M views",
    duration: "3:10",
    publishedTime: "3 years ago",
    aiMoodTags: "Punjabi • Synth Pop • Love",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "295_sidhu_moosewala",
    title: "295 - Sidhu Moose Wala | The Kidd | Moosetape",
    channel: "Sidhu Moose Wala • Punjabi Legend",
    views: "780M views",
    duration: "4:30",
    publishedTime: "3 years ago",
    aiMoodTags: "Punjabi • Powerful • Hip Hop",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "brown_munde_ap",
    title: "Brown Munde - AP Dhillon, Gurinder Gill, Shinda Kahlon | Gminxr",
    channel: "Run-Up Records • AP Dhillon",
    views: "640M views",
    duration: "4:07",
    publishedTime: "3 years ago",
    aiMoodTags: "Punjabi • Hip Hop • Global Anthem",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "excuses_ap_dhillon",
    title: "Excuses - AP Dhillon, Gurinder Gill | Intense",
    channel: "Run-Up Records • AP Dhillon",
    views: "410M views",
    duration: "2:56",
    publishedTime: "2 years ago",
    aiMoodTags: "Punjabi • Chill Trap • Melodic",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "softly_karan_aujla",
    title: "Softly - Karan Aujla | Ikky | Making Memories",
    channel: "Karan Aujla • Ikky",
    views: "210M views",
    duration: "2:36",
    publishedTime: "1 year ago",
    aiMoodTags: "Punjabi • Smooth • Groovy",
    genre: "Punjabi",
    isOfficial: true
  },
  {
    id: "winning_speech_aujla",
    title: "Winning Speech - Karan Aujla | Mxrci | Street Anthem",
    channel: "Karan Aujla • Punjabi Rap",
    views: "140M views",
    duration: "3:32",
    publishedTime: "7 months ago",
    aiMoodTags: "Punjabi • High Energy • Motivation",
    genre: "Punjabi",
    isOfficial: true
  },

  // --- 4. South Indian Blockbusters (Tamil / Telugu / Malayalam) ---
  {
    id: "OsU0CGZoV8E",
    title: "Naatu Naatu - RRR | Ram Charan, Jr NTR | MM Keeravaani | Oscar Winner",
    channel: "Lahari Music • T-Series",
    views: "480M views",
    duration: "4:35",
    publishedTime: "2 years ago",
    aiMoodTags: "Telugu • High Energy • Oscar Winner",
    genre: "South Cinema",
    isOfficial: true
  },
  {
    id: "tOM-nWPcR4U",
    title: "Illuminati | Aavesham | Fahadh Faasil | Jithu Madhavan | Sushin Shyam",
    channel: "Think Music India • Sushin Shyam",
    views: "195M views",
    duration: "3:12",
    publishedTime: "4 months ago",
    aiMoodTags: "Malayalam • Viral • Party Groove",
    genre: "South Cinema",
    isOfficial: true
  },
  {
    id: "eYq7WapuDLU",
    title: "Enjoy Enjaami - Dhee ft. Arivu | Santhosh Narayanan | maajja",
    channel: "maajja • Tamil Independent",
    views: "490M views",
    duration: "4:56",
    publishedTime: "3 years ago",
    aiMoodTags: "Tamil • Folk Fusion • Earthy",
    genre: "South Cinema",
    isOfficial: true
  },
  {
    id: "hukum_jailer_anirudh",
    title: "Hukum - Thalaivar Alappara | Jailer | Rajinikanth | Anirudh Ravichander",
    channel: "Sun TV • Anirudh",
    views: "210M views",
    duration: "3:27",
    publishedTime: "1 year ago",
    aiMoodTags: "Tamil • Mass • Heavy Beats",
    genre: "South Cinema",
    isOfficial: true
  },
  {
    id: "arabic_kuthu_beast",
    title: "Arabic Kuthu - Halamithi Habibo | Beast | Thalapathy Vijay | Anirudh",
    channel: "Sun TV • Anirudh Ravichander",
    views: "470M views",
    duration: "4:39",
    publishedTime: "2 years ago",
    aiMoodTags: "Tamil • Dance • Chartbuster",
    genre: "South Cinema",
    isOfficial: true
  },
  {
    id: "butta_bomma_telugu",
    title: "Butta Bomma - Ala Vaikunthapurramuloo | Allu Arjun, Pooja Hegde | Thaman S",
    channel: "Aditya Music • Armaan Malik",
    views: "850M views",
    duration: "3:18",
    publishedTime: "4 years ago",
    aiMoodTags: "Telugu • Sweet • Dance Hits",
    genre: "South Cinema",
    isOfficial: true
  },

  // --- 5. Devotional & Spiritual Collection ---
  {
    id: "iP2qE2H98i8",
    title: "Achyutam Keshavam Krishna Damodaram | Soulful Krishna Bhajan",
    channel: "Art of Living • Vikram Hazra",
    views: "185M views",
    duration: "6:24",
    publishedTime: "5 years ago",
    aiMoodTags: "Devotional • Krishna Bhajan • Peace",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "0Kz6U1uT8uI",
    title: "Radhe Radhe Barsane Wali Radhe | Shri Gaurav Krishna Goswami Ji",
    channel: "Bhakti Sangeet • Gaurav Krishna Goswami",
    views: "120M views",
    duration: "9:45",
    publishedTime: "3 years ago",
    aiMoodTags: "Devotional • Radhe Bhajan • Blissful",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "j_sPqG9N628",
    title: "Shri Krishna Govind Hare Murari | Simran Sehgal Devotional",
    channel: "T-Series Bhakti Sagar",
    views: "95M views",
    duration: "5:38",
    publishedTime: "4 years ago",
    aiMoodTags: "Devotional • Krishna Kirtan • Calming",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "K3hX3uU_yE8",
    title: "Hare Krishna Hare Rama Mahamantra | ISKCON Kirtan Meditation",
    channel: "ISKCON Desire Tree",
    views: "82M views",
    duration: "11:15",
    publishedTime: "2 years ago",
    aiMoodTags: "Devotional • Mantra Meditation • Sacred",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "gD8xVfS4t1U",
    title: "Woh Kisna Hai - Kisna | Sukhwinder Singh, Ismail Darbar, Vivek Oberoi",
    channel: "Sony Music India • Ismail Darbar",
    views: "140M views",
    duration: "5:26",
    publishedTime: "9 years ago",
    aiMoodTags: "Devotional • High Spirit • Flute Fusion",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "AETFv498624",
    title: "Shri Hanuman Chalisa - Hariharan | Gulshan Kumar | T-Series",
    channel: "T-Series Bhakti Sagar • Hariharan",
    views: "3.8B views",
    duration: "9:48",
    publishedTime: "11 years ago",
    aiMoodTags: "Devotional • Hanuman Chalisa • Most Viewed",
    genre: "Devotional",
    isOfficial: true
  },
  {
    id: "hMBKmQgkMnE",
    title: "Shiv Tandav Stotram | Shankar Mahadevan | Times Music Spiritual",
    channel: "Times Music Spiritual • Shankar Mahadevan",
    views: "210M views",
    duration: "9:14",
    publishedTime: "8 years ago",
    aiMoodTags: "Devotional • Shiva Anthem • Powerful",
    genre: "Devotional",
    isOfficial: true
  },

  // --- 6. Desi Lo-Fi, Midnight Acoustic & Chill ---
  {
    id: "8ofk_4A1u_A",
    title: "Baarishein - Anuv Jain | Acoustic Live Sessions",
    channel: "Anuv Jain • Indie Acoustic",
    views: "95M views",
    duration: "3:27",
    publishedTime: "5 years ago",
    aiMoodTags: "Hindi • Rain Acoustic • Heartfelt",
    genre: "Lo-Fi",
    isOfficial: true
  },
  {
    id: "choo_lo_local_train",
    title: "Choo Lo - The Local Train | Aalas Ka Pedh",
    channel: "The Local Train • Indian Indie Rock",
    views: "220M views",
    duration: "3:53",
    publishedTime: "8 years ago",
    aiMoodTags: "Indie Rock • Melancholy • Acoustic",
    genre: "Lo-Fi",
    isOfficial: true
  },
  {
    id: "kun_faya_kun_rockstar",
    title: "Kun Faya Kun - Rockstar | Ranbir Kapoor | A.R. Rahman, Mohit Chauhan, Javed Ali",
    channel: "T-Series • A.R. Rahman",
    views: "480M views",
    duration: "7:53",
    publishedTime: "12 years ago",
    aiMoodTags: "Sufi • Spiritual • Masterpiece",
    genre: "Lo-Fi",
    isOfficial: true
  },
  {
    id: "iktara_lofi_flip",
    title: "Iktara - Wake Up Sid | Lofi Chill Flip | Kavita Seth, Amit Trivedi",
    channel: "Sony Music India • Lofi Mixes",
    views: "48M views",
    duration: "4:12",
    publishedTime: "2 years ago",
    aiMoodTags: "Lo-Fi • Slowed & Reverb • Aesthetic",
    genre: "Lo-Fi",
    isOfficial: true
  },
  {
    id: "desi_midnight_lofi_mix",
    title: "Midnight Indian Lofi Chill Beats | 1 Hour Nonstop Study / Sleep Session",
    channel: "Chill Desi Beats • Lofi Station",
    views: "34M views",
    duration: "58:40",
    publishedTime: "1 year ago",
    aiMoodTags: "Lo-Fi • Instrumental • Study Vibe",
    genre: "Lo-Fi",
    isOfficial: true
  },

  // --- 7. Viral YouTube Entertainment & Tech Creators ---
  {
    id: "dKjR8zF8a4I",
    title: "We Opened 1000 GEMS Balls | 1000 GEMS Magic Pool Experiment",
    channel: "Crazy XYZ",
    views: "1.5M views",
    duration: "23:19",
    publishedTime: "2 days ago",
    aiMoodTags: "Experiment • Fun • Gems",
    genre: "Entertainment",
    isOfficial: true
  },
  {
    id: "p0mR9xF1234",
    title: "Super Heavy JCB Stunts Experiment | JCB Vs Crazy Car Challenge",
    channel: "Crazy XYZ",
    views: "3.2M views",
    duration: "28:15",
    publishedTime: "1 week ago",
    aiMoodTags: "Challenge • JCB Stunts • Viral",
    genre: "Entertainment",
    isOfficial: true
  },
  {
    id: "trakin_top5_tech",
    title: "Top 5 Best Smartphones in India (2026 Edition) - Don't Buy Before This!",
    channel: "Trakin Tech • Tech Reviews",
    views: "1.2M views",
    duration: "14:22",
    publishedTime: "3 days ago",
    aiMoodTags: "Technology • Smartphone Guide",
    genre: "Technology",
    isOfficial: true
  },
  {
    id: "tech_guruji_ai",
    title: "AI Revolution 2026: Everything Changing in India!",
    channel: "Technical Guruji",
    views: "890K views",
    duration: "11:50",
    publishedTime: "4 days ago",
    aiMoodTags: "Tech News • AI • Explainer",
    genre: "Technology",
    isOfficial: true
  },
  {
    id: "dola_re_idol_grand",
    title: "'Dola Re' पर Shreya और Kavita Ji का Iconic Duet | Indian Idol S14 Grand Finale",
    channel: "SET India • Indian Idol",
    views: "810K views",
    duration: "12:12",
    publishedTime: "8 months ago",
    aiMoodTags: "Music Show • Grand Finale • Iconic",
    genre: "Entertainment",
    isOfficial: true
  },

  // --- 8. 90s & 2000s Nostalgic Classics ---
  {
    id: "cNV5hLKh98s",
    title: "Tujhe Dekha Toh Yeh Jaana Sanam - DDLJ | Shah Rukh Khan, Kajol | Kumar Sanu",
    channel: "YRF • Jatin-Lalit",
    views: "860M views",
    duration: "5:04",
    publishedTime: "14 years ago",
    aiMoodTags: "90s Nostalgia • Romantic Anthem • SRK",
    genre: "Classics",
    isOfficial: true
  },
  {
    id: "g0eO74UmRBs",
    title: "Kal Ho Naa Ho - Title Track | Shah Rukh Khan, Preity Zinta | Sonu Nigam",
    channel: "Sony Music India • Shankar-Ehsaan-Loy",
    views: "640M views",
    duration: "5:22",
    publishedTime: "12 years ago",
    aiMoodTags: "2000s Nostalgia • Emotional • Masterpiece",
    genre: "Classics",
    isOfficial: true
  },
  {
    id: "hB80sF_j54E",
    title: "Chura Ke Dil Mera - Main Khiladi Tu Anari | Akshay Kumar, Shilpa Shetty",
    channel: "Venus Movies • Anu Malik",
    views: "420M views",
    duration: "7:54",
    publishedTime: "11 years ago",
    aiMoodTags: "90s Dance • Groovy • Evergreen",
    genre: "Classics",
    isOfficial: true
  },
  {
    id: "fWj-WbV2Y14",
    title: "Tip Tip Barsa Paani - Mohra | Akshay Kumar, Raveena Tandon | Udit Narayan",
    channel: "Venus Movies • Viju Shah",
    views: "390M views",
    duration: "5:58",
    publishedTime: "10 years ago",
    aiMoodTags: "90s Rain Song • Sensational • Hits",
    genre: "Classics",
    isOfficial: true
  },
  {
    id: "chaiyya_chaiyya_dilse",
    title: "Chaiyya Chaiyya - Dil Se | Shah Rukh Khan, Malaika Arora | A.R. Rahman",
    channel: "Venus • A.R. Rahman, Sukhwinder",
    views: "380M views",
    duration: "6:54",
    publishedTime: "13 years ago",
    aiMoodTags: "Train Dance • High Energy • A.R. Rahman",
    genre: "Classics",
    isOfficial: true
  },

  // --- 9. Global International Pop Hits ---
  {
    id: "34Na4j8AVgA",
    title: "Starboy - The Weeknd ft. Daft Punk | Official Music Video",
    channel: "The Weeknd • Universal Music",
    views: "2.4B views",
    duration: "3:50",
    publishedTime: "7 years ago",
    aiMoodTags: "Global Pop • Electro R&B • Diamond",
    genre: "Global",
    isOfficial: true
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You - Ed Sheeran | Official Music Video",
    channel: "Ed Sheeran • Atlantic Records",
    views: "6.2B views",
    duration: "4:23",
    publishedTime: "7 years ago",
    aiMoodTags: "Global Pop • Catchy • Record Breaker",
    genre: "Global",
    isOfficial: true
  },
  {
    id: "7wtfhZwyrcc",
    title: "Believer - Imagine Dragons | Official Music Video",
    channel: "Imagine Dragons • Interscope",
    views: "2.6B views",
    duration: "3:36",
    publishedTime: "7 years ago",
    aiMoodTags: "Alternative Rock • High Energy • Workout",
    genre: "Global",
    isOfficial: true
  },
  {
    id: "60ItHLz5WEA",
    title: "Faded - Alan Walker | Official Music Video",
    channel: "Alan Walker • MER Musikk",
    views: "3.6B views",
    duration: "3:32",
    publishedTime: "8 years ago",
    aiMoodTags: "EDM • Melodic • Nostalgic",
    genre: "Global",
    isOfficial: true
  },
  {
    id: "blinding_lights_weeknd",
    title: "Blinding Lights - The Weeknd | After Hours",
    channel: "The Weeknd • Synthwave",
    views: "1.1B views",
    duration: "3:20",
    publishedTime: "4 years ago",
    aiMoodTags: "Synthwave • Retro 80s • Global Hit",
    genre: "Global",
    isOfficial: true
  }
];
