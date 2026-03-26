import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  MoreHorizontal,
  Volume2,
  Volume1,
  VolumeX,
  ExternalLink,
  Eye,
  BadgeCheck,
  Code2,
  Crown,
  Zap,
  Music,
  Heart,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBottomPlaying, setIsBottomPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(28);
  const [bottomProgress, setBottomProgress] = useState(0);
  const [views] = useState(1247);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if video exists
  useEffect(() => {
    const checkVideo = async () => {
      try {
        const response = await fetch('/media/background.mp4', { method: 'HEAD' });
        setHasVideo(response.ok);
      } catch {
        setHasVideo(false);
      }
    };
    checkVideo();
  }, []);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio('/media/music.mp3');
    audio.loop = true;
    audio.volume = volume / 100;
    audioRef.current = audio;
    
    audio.addEventListener('canplaythrough', () => setAudioLoaded(true));
    audio.addEventListener('error', () => setAudioLoaded(false));
    
    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', () => setAudioLoaded(true));
    };
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle bottom player play/pause
  const toggleBottomPlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isBottomPlaying) {
      audioRef.current.pause();
      setIsBottomPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsBottomPlaying(true);
    }
  }, [isBottomPlaying]);

  // Simulate progress for Spotify player
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 0.3));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Sync bottom progress with actual audio
  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateProgress = () => {
      if (audioRef.current) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setBottomProgress(percent || 0);
      }
    };
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    return () => audioRef.current?.removeEventListener('timeupdate', updateProgress);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeClick = () => {
    setVolume(v => v === 0 ? 70 : 0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('python.enthusiast');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badges = [
    { id: 'verified', icon: BadgeCheck, color: '#FFD700', name: 'Verified', glow: '0 0 20px rgba(255, 215, 0, 0.6)' },
    { id: 'developer', icon: Code2, color: '#8B5CF6', name: 'Developer', glow: '0 0 20px rgba(139, 92, 246, 0.6)' },
    { id: 'premium', icon: Crown, color: '#EC4899', name: 'Premium', glow: '0 0 20px rgba(236, 72, 153, 0.6)' },
    { id: 'booster', icon: Zap, color: '#F43F5E', name: 'Server Booster', glow: '0 0 20px rgba(244, 63, 94, 0.6)' },
  ];

  // Get current audio time
  const getCurrentTime = () => {
    if (!audioRef.current || !audioRef.current.duration) return '00:00';
    return formatTime(audioRef.current.currentTime);
  };

  const getDuration = () => {
    if (!audioRef.current || !audioRef.current.duration) return '03:45';
    return formatTime(audioRef.current.duration);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background Video or Image */}
      <div className="fixed inset-0 z-0">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover scale-110"
          >
            <source src="/media/background.mp4" type="video/mp4" />
          </video>
        ) : (
          <img 
            src="/images/background.jpg" 
            alt="Background" 
            className="w-full h-full object-cover scale-110 animate-slow-zoom"
          />
        )}
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div 
          ref={cardRef}
          className="w-full max-w-md glass-card animate-scale-in animate-glow-pulse"
        >
          {/* Banner */}
          <div className="relative h-32 w-full overflow-hidden">
            <img 
              src="/images/banner.jpg" 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
            
            {/* View Counter */}
            <div className="absolute top-3 right-3 view-counter">
              <Eye className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/80 font-medium">{views.toLocaleString()}</span>
            </div>

            {/* Share button */}
            <button 
              onClick={handleCopy}
              className="absolute top-3 left-3 glass-btn text-white/70 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Profile Section */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="relative -mt-14 mb-4 flex justify-center">
              <div className="animated-border">
                <div className="relative w-28 h-28 rounded-full overflow-hidden bg-black ring-4 ring-black">
                  <img 
                    src="/images/profile.jpg" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Status Dot */}
              <div className="status-dot status-dot-pulse" />
            </div>

            {/* Username & Info */}
            <div className="text-center mb-5 animate-fade-in-up stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Huskxy</h1>
              <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                <span>Discord since 2021</span>
              </div>
              <div 
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                onClick={handleCopy}
              >
                python.enthusiast
                {copied && <Check className="w-3 h-3 text-green-400" />}
              </div>
            </div>

            {/* Badges */}
            <div className="flex justify-center gap-3 mb-6 animate-fade-in-up stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div 
                    key={badge.id}
                    className="relative tooltip-trigger"
                    onMouseEnter={() => setHoveredBadge(badge.id)}
                    onMouseLeave={() => setHoveredBadge(null)}
                  >
                    <Icon 
                      className="badge-icon"
                      style={{ 
                        color: badge.color,
                        filter: hoveredBadge === badge.id ? badge.glow : 'none'
                      }}
                    />
                    {hoveredBadge === badge.id && (
                      <div className="tooltip">
                        {badge.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Discord Profile */}
            <div className="glass-subcard p-4 mb-4 hover-lift cursor-pointer animate-fade-in-up stagger-3 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src="/images/profile.jpg" 
                      alt="Discord" 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0a0a0a] shadow-lg shadow-green-500/50" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">IHusky</div>
                    <div className="text-sm text-green-400 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Online
                    </div>
                  </div>
                </div>
                <button className="glass-btn text-white/70 hover:text-white flex items-center gap-1.5">
                  Profile
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Spotify Player */}
            <div className="music-player-bar mb-4 animate-fade-in-up stagger-4 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img 
                    src="/images/album-art.jpg" 
                    alt="Album" 
                    className="w-14 h-14 rounded-lg object-cover shadow-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-black truncate">Ghost - Connect</div>
                  <div className="text-xs text-black/70 truncate">Pentagramma</div>
                  <div className="text-xs text-black/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                    Preview
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-all hover:scale-110 active:scale-95"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black ml-0.5" />
                    )}
                  </button>
                  <button 
                    onClick={() => setLiked(!liked)}
                    className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-all hover:scale-110"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'text-red-700 fill-red-700' : 'text-black'}`} />
                  </button>
                  <button className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-all hover:scale-110">
                    <MoreHorizontal className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 progress-bar bg-black/20">
                <div 
                  className="progress-bar-fill bg-black/70"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Discord Server Invite */}
            <div className="glass-subcard p-4 mb-4 hover-lift cursor-pointer animate-fade-in-up stagger-5 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src="/images/server-icon.jpg" 
                    alt="Server" 
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5"
                  />
                  <div>
                    <div className="text-base font-semibold text-white">Ghost Market</div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50" />
                        <span className="text-green-400 font-medium">2 Online</span>
                      </span>
                      <span className="text-white/30">•</span>
                      <span>124 Members</span>
                    </div>
                  </div>
                </div>
                <button className="join-btn">
                  Join
                </button>
              </div>
            </div>

            {/* Bottom Music Player - Custom MP3 */}
            <div className="glass-subcard p-4 animate-fade-in-up stagger-6 opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-4">
                {/* Audio visualizer */}
                <div className="flex items-end gap-0.5 h-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="audio-bar"
                      style={{
                        animationPlayState: isBottomPlaying ? 'running' : 'paused',
                        height: `${8 + i * 4}px`
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white truncate font-medium">
                      {audioLoaded ? 'Custom Track' : 'No audio file'}
                    </span>
                  </div>
                  <div className="progress-bar mt-2">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${bottomProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 font-mono">
                    {getCurrentTime()} / {getDuration()}
                  </span>
                  
                  <button 
                    onClick={toggleBottomPlay}
                    disabled={!audioLoaded}
                    className={`p-2.5 rounded-full transition-all ${
                      audioLoaded 
                        ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:scale-110' 
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isBottomPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  
                  <div 
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={handleVolumeClick}
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                    )}
                    <div className="volume-slider">
                      <div 
                        className="volume-slider-fill"
                        style={{ width: `${volume}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {!audioLoaded && (
                <div className="mt-2 text-xs text-white/40 text-center">
                  Place music.mp3 in /media folder
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4 z-10 flex items-center gap-3">
        <button className="glass-btn text-white/50 hover:text-white flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <span className="text-xs text-white/30">Made by Huskxy</span>
      </div>
    </div>
  );
}

export default App;
