import React from 'react';
import { HeartIcon, EyeIcon } from './icons';

export interface MemePost {
  id: string;
  imageUrl: string;
  likes: number;
  views: number;
  timestamp: number;
  isLiked?: boolean;
}

interface MemeFeedProps {
  posts: MemePost[];
  onLike: (id: string) => void;
}

export const MemeFeed: React.FC<MemeFeedProps> = ({ posts, onLike }) => {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return '1d+ ago';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
          Community Feed
        </span>
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 transition-transform hover:-translate-y-1">
            <div className="aspect-auto w-full bg-gray-900 relative group">
              <img 
                src={post.imageUrl} 
                alt="Community Meme" 
                className="w-full h-full object-contain max-h-96" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                 <span className="text-xs text-white/80">{formatTime(post.timestamp)}</span>
              </div>
            </div>
            
            <div className="p-4 flex items-center justify-between bg-gray-800">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    post.isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
                  }`}
                >
                  <HeartIcon filled={post.isLiked} />
                  <span>{post.likes}</span>
                </button>
                
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-400" title="Views">
                  <EyeIcon />
                  <span>{post.views.toLocaleString()}</span>
                </div>
              </div>
              
              <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                Share
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
           <p className="text-xl">No memes yet. Be the first to post!</p>
        </div>
      )}
    </div>
  );
};