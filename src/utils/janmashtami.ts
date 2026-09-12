import { Track } from '../types';

// Janmashtami Celebration Window: Active until 6th September 2026 end-of-day
export const JANMASHTAMI_END_DATE = new Date('2026-09-06T23:59:59.999');

/**
 * Checks if current time is within the Janmashtami festival period (until 6th September 2026)
 */
export function isJanmashtamiActive(): boolean {
  if (typeof window === 'undefined') return true;

  // Check if manually disabled by user preference
  const userDisabled = localStorage.getItem('aura_janmashtami_enabled');
  if (userDisabled === 'false') {
    return false;
  }

  // Active check against 6th September 2026
  const now = new Date();
  return now <= JANMASHTAMI_END_DATE;
}

/**
 * Curated list of classic, spiritually uplifting Krishna Janmashtami Bhajans & Tracks
 */
export const JANMASHTAMI_SPECIAL_TRACKS: Track[] = [
  {
    id: 'yt-achyutam-keshavam',
    title: 'Achyutam Keshavam Rama Narayanam | अच्युतम केशवम | Divine Krishna Bhajan',
    channel: 'Spiritual Bhakti Music',
    views: '124M views',
    duration: '5:42',
    publishedTime: 'Festival Special',
    aiMoodTags: 'Devotional • Peaceful • Janmashtami',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-radhe-radhe-barsane',
    title: 'Radhe Radhe Barsane Wali Radhe | राधे राधे बरसाने वाली राधे',
    channel: 'Bhakti Sagar',
    views: '88M views',
    duration: '7:15',
    publishedTime: 'Festival Special',
    aiMoodTags: 'Devotional • Joyous • Vrindavan',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-hare-krishna-mahamantra',
    title: 'Hare Krishna Hare Rama Mahamantra | हरे कृष्ण महामंत्र | Meditative Chants',
    channel: 'ISKCON Kirtan Wave',
    views: '95M views',
    duration: '10:30',
    publishedTime: 'Festival Special',
    aiMoodTags: 'Mantra • Meditation • Janmashtami',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-shri-krishna-govind',
    title: 'Shri Krishna Govind Hare Murari | श्री कृष्ण गोविंद हरे मुरारी',
    channel: 'Divine Chants Official',
    views: '160M views',
    duration: '6:20',
    publishedTime: 'Festival Special',
    aiMoodTags: 'Peace • Soulful • Devotional',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-wo-kisna-hai',
    title: 'Woh Kisna Hai | वो किसना है | Sukhwinder Singh, S. P. Sailaja',
    channel: 'Sony Music India',
    views: '180M views',
    duration: '5:28',
    publishedTime: 'Classic Hits',
    aiMoodTags: 'Classic • Energetic • Krishna',
    genre: 'Bollywood',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-yashomati-maiya',
    title: 'Yashomati Maiya Se Bole Nandlala | यशोमति मैया से बोले नंदलाला | Lata Mangeshkar',
    channel: 'Saregama Bhakti',
    views: '210M views',
    duration: '3:45',
    publishedTime: 'Timeless Bhajan',
    aiMoodTags: 'Heartfelt • Timeless • Childhood Krishna',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-radha-kaise-na-jale',
    title: 'Radha Kaise Na Jale | राधा कैसे ना जले | Lagaan | A.R. Rahman',
    channel: 'Sony Music India',
    views: '145M views',
    duration: '5:34',
    publishedTime: 'Classic Melodies',
    aiMoodTags: 'Traditional • Dance • Krishna Leela',
    genre: 'Bollywood',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop'
  },
  {
    id: 'yt-choti-choti-gaiya',
    title: 'Chhoti Chhoti Gaiya Chhote Chhote Gwal | छोटी छोटी गैया छोटे छोटे ग्वाल',
    channel: 'Bhakti Dhara',
    views: '75M views',
    duration: '4:50',
    publishedTime: 'Festival Special',
    aiMoodTags: 'Sweet • Folk • Janmashtami',
    genre: 'Devotional',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop'
  }
];
