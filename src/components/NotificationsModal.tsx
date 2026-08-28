import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Youtube, Play, Sparkles, Radio } from 'lucide-react';
import { Track } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack?: (track: Track) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface NotificationItem {
  id: string;
  channelName: string;
  channelAvatar: string;
  title: string;
  thumbnail: string;
  timeAgo: string;
  isUnread: boolean;
  type: 'upload' | 'live' | 'premiere';
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    channelName: 'Crazy XYZ',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop',
    title: '2 JCB vs CAR🔥 | Ripping Off a Car With Two JCB',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop',
    timeAgo: '31 minutes ago',
    isUnread: true,
    type: 'upload'
  },
  {
    id: 'notif-2',
    channelName: 'Star Jalsha',
    channelAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop',
    title: '28 আগস্ট - 1 সেপ্টেম্বর 7:00 PM | কুমকুম - কুমকুমের চ্যালেঞ্জ',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop',
    timeAgo: '16 hours ago',
    isUnread: true,
    type: 'premiere'
  },
  {
    id: 'notif-3',
    channelName: 'Arijit Singh Official',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop',
    title: 'Live Acoustic Concert 2026 - Mumbai Arena',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop',
    timeAgo: '1 day ago',
    isUnread: false,
    type: 'live'
  },
  {
    id: 'notif-4',
    channelName: 'T-Series',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop',
    title: 'New Bollywood Chartbuster Out Now!',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop',
    timeAgo: '2 days ago',
    isUnread: false,
    type: 'upload'
  }
];

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onShowToast
}) => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
    if (onShowToast) onShowToast('All notifications marked as read', 'info');
  };

  const handleItemClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? ({ ...n, isUnread: false }) : n));
    if (onPlayTrack) {
      onPlayTrack({
        id: notif.id,
        title: notif.title,
        channel: notif.channelName,
        duration: '15:20',
        views: '120K views',
        aiMoodTags: 'New Upload'
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="w-full max-w-md bg-[#212121] text-white rounded-b-3xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] mt-0 sm:mt-12"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <Bell size={16} className="fill-white" />
                </div>
                <h3 className="text-base font-bold text-white">Notifications</h3>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-red-600/30 text-red-400 rounded-full border border-red-500/30">
                  {notifications.filter(n => n.isUnread).length} New
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Mark read
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer relative ${
                    n.isUnread ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  {n.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 left-1.5" />
                  )}

                  {/* Channel Avatar */}
                  <img
                    src={n.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                    alt={n.channelName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ml-1 border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';
                    }}
                  />

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                      <span className="font-bold text-gray-200">{n.channelName}</span>: {n.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                      {n.type === 'live' && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-bold uppercase flex items-center gap-0.5">
                          <Radio size={9} /> LIVE
                        </span>
                      )}
                      <span>{n.timeAgo}</span>
                    </div>
                  </div>

                  {/* Video Thumbnail */}
                  <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                    <img
                      src={n.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop'}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play size={12} className="fill-white text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#181818] border-t border-white/5 text-center text-xs text-gray-400">
              Real-time updates from your subscribed channels
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
