/**
 * Utility to provide real, authentic channel logos for YouTube channels and record labels.
 */

const KNOWN_OFFICIAL_LOGOS: Record<string, string> = {
  // Major Indian Record Labels & TV Networks
  'sony music': 'https://unavatar.io/youtube/sonymusicindia',
  'sonymusic': 'https://unavatar.io/youtube/sonymusicindia',
  't-series': 'https://unavatar.io/youtube/tseries',
  'tseries': 'https://unavatar.io/youtube/tseries',
  'zee music': 'https://unavatar.io/youtube/zeemusiccompany',
  'zeemusic': 'https://unavatar.io/youtube/zeemusiccompany',
  'svf': 'https://unavatar.io/youtube/SVFBangla',
  'yrf': 'https://unavatar.io/youtube/yrf',
  'yash raj': 'https://unavatar.io/youtube/yrf',
  'saregama': 'https://unavatar.io/youtube/saregamamusic',
  'star jalsha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Star_Jalsha_2019.png/512px-Star_Jalsha_2019.png',
  'starjalsha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Star_Jalsha_2019.png/512px-Star_Jalsha_2019.png',
  'zee bangla': 'https://unavatar.io/youtube/zeebangla',
  'zeebangla': 'https://unavatar.io/youtube/zeebangla',
  'techscrew': 'https://unavatar.io/youtube/TechScrew',
  'tech screw': 'https://unavatar.io/youtube/TechScrew',
  'star plus': 'https://unavatar.io/youtube/starplus',
  'starplus': 'https://unavatar.io/youtube/starplus',
  'colors tv': 'https://unavatar.io/youtube/colorstv',
  'colorstv': 'https://unavatar.io/youtube/colorstv',
  'speed records': 'https://unavatar.io/youtube/speedrecords',
  'aditya music': 'https://unavatar.io/youtube/adityamusic',
  'lahari music': 'https://unavatar.io/youtube/laharimusic',
  'tips': 'https://unavatar.io/youtube/tipsofficial',
  'geet mp3': 'https://unavatar.io/youtube/geetmp3',
  'white hill': 'https://unavatar.io/youtube/whitehillmusic',
  'wave music': 'https://unavatar.io/youtube/wavemusic',
  'think music': 'https://unavatar.io/youtube/thinkmusicindia',
  'sun tv': 'https://unavatar.io/youtube/suntv',
  'sun music': 'https://unavatar.io/youtube/sunmusic',
  'sun pictures': 'https://unavatar.io/youtube/sunpictures',
  'vyrl': 'https://unavatar.io/youtube/vyrloriginals',
  'mass appeal': 'https://unavatar.io/youtube/massappealindia',
  'coke studio bangla': 'https://unavatar.io/youtube/CokeStudioBangla',
  'coke studio': 'https://unavatar.io/youtube/CokeStudio',
  'set india': 'https://unavatar.io/youtube/setindia',

  // News Channels
  'aaj tak': 'https://unavatar.io/youtube/aajtak',
  'abp ananda': 'https://unavatar.io/youtube/abpanandatv',
  'ndtv': 'https://unavatar.io/youtube/ndtv',
  'india today': 'https://unavatar.io/youtube/indiatoday',
  'bbc news hindi': 'https://unavatar.io/youtube/bbcnewshindi',
  'republic world': 'https://unavatar.io/youtube/republicworld',
  'kolkata tv': 'https://unavatar.io/youtube/KolkataTV',

  // Top Creators & Global Artists
  'lofi girl': 'https://unavatar.io/youtube/LofiGirl',
  'vevo': 'https://unavatar.io/youtube/vevo',
  'arijit singh': 'https://unavatar.io/youtube/ArijitSingh',
  'taylor swift': 'https://unavatar.io/youtube/TaylorSwift',
  'pritam': 'https://unavatar.io/youtube/PritamOfficial',
  'anirudh': 'https://unavatar.io/youtube/AnirudhRavichander',
  'shreya ghoshal': 'https://unavatar.io/youtube/ShreyaGhoshalOfficial',
  'bruno mars': 'https://unavatar.io/youtube/BrunoMars'
};

export const getChannelAvatar = (channelName: string): string => {
  if (!channelName) {
    return 'https://ui-avatars.com/api/?name=YT&background=e11d48&color=ffffff&bold=true';
  }

  const cleanName = channelName.split('•')[0].split('|')[0].trim();
  const lower = cleanName.toLowerCase();

  // Check known map
  for (const [key, logoUrl] of Object.entries(KNOWN_OFFICIAL_LOGOS)) {
    if (lower.includes(key)) {
      return logoUrl;
    }
  }

  // Handle name formatting
  const sanitized = cleanName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  // Try unavatar for real youtube avatar if valid string
  if (sanitized.length > 2) {
    const handle = sanitized.replace(/\s+/g, '');
    return `https://unavatar.io/youtube/${handle}`;
  }

  // UI Avatar as fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=e11d48&color=ffffff&bold=true`;
};

export const getFallbackChannelAvatar = (channelName: string): string => {
  const cleanName = (channelName || 'Music').split('•')[0].trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=e11d48&color=ffffff&bold=true`;
};
