import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import './AudioPlayer.css';

const AudioPlayer = ({ tracks, originalFileName, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumes, setVolumes] = useState({
    vocals: 1,
    drums: 1,
    bass: 1,
    other: 1
  });
  const [mutedTracks, setMutedTracks] = useState({
    vocals: false,
    drums: false,
    bass: false,
    other: false
  });

  const audioRefs = useRef({});
  const progressRef = useRef(null);

  const trackInfo = {
    vocals: { name: 'Vocals', color: '#e74c3c', icon: '🎤' },
    drums: { name: 'Drums', color: '#f39c12', icon: '🥁' },
    bass: { name: 'Bass', color: '#9b59b6', icon: '🎸' },
    other: { name: 'Other', color: '#2ecc71', icon: '🎹' }
  };

  useEffect(() => {
    const eventListeners = [];
    
    // Use a small delay to ensure audio elements are rendered
    const setupAudio = () => {
      Object.keys(tracks).forEach(trackType => {
        const audio = audioRefs.current[trackType];
        if (audio) {
          const handleLoadedMetadata = () => {
            if (audioRefs.current[trackType]) {
              setDuration(audioRefs.current[trackType].duration);
            }
          };
          
          const handleTimeUpdate = () => {
            if (audioRefs.current[trackType]) {
              setCurrentTime(audioRefs.current[trackType].currentTime);
            }
          };
          
          // Remove any existing listeners first
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          
          // Add new listeners
          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('timeupdate', handleTimeUpdate);
          
          // Store references for cleanup
          eventListeners.push({
            audio,
            events: [
              { type: 'loadedmetadata', handler: handleLoadedMetadata },
              { type: 'timeupdate', handler: handleTimeUpdate }
            ]
          });
          
          // If metadata is already loaded, set duration immediately
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
          }
        }
      });
    };

    // Setup audio with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupAudio, 100);

    return () => {
      clearTimeout(timeoutId);
      
      // Clean up event listeners
      eventListeners.forEach(({ audio, events }) => {
        if (audio) {
          events.forEach(({ type, handler }) => {
            audio.removeEventListener(type, handler);
          });
        }
      });
      
      // Pause and clean up audio elements
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, [tracks]);

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        if (newIsPlaying) {
          audio.play().catch(console.error);
        } else {
          audio.pause();
        }
      }
    });
  };

  const handleProgressClick = (e) => {
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          try {
            audio.currentTime = newTime;
          } catch (error) {
            console.warn('Could not set currentTime:', error);
          }
        }
      });
    }
  };

  const handleVolumeChange = (trackType, volume) => {
    setVolumes(prev => ({ ...prev, [trackType]: volume }));
    const audio = audioRefs.current[trackType];
    if (audio) {
      audio.volume = mutedTracks[trackType] ? 0 : volume;
    }
  };

  const toggleMute = (trackType) => {
    const newMuted = !mutedTracks[trackType];
    setMutedTracks(prev => ({ ...prev, [trackType]: newMuted }));
    
    const audio = audioRefs.current[trackType];
    if (audio) {
      audio.volume = newMuted ? 0 : volumes[trackType];
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadTrack = (trackType) => {
    const link = document.createElement('a');
    link.href = tracks[trackType];
    link.download = `${originalFileName}_${trackType}.wav`;
    link.click();
  };

  return (
    <div className="player-container">
      <div className="player-header">
        <h2>Separated Tracks</h2>
        <p>Your music has been successfully separated into individual stems</p>
        <button onClick={onReset} className="reset-button">
          <RotateCcw size={16} />
          Process Another Song
        </button>
      </div>

      <div className="main-controls">
        <button onClick={togglePlayPause} className="play-button">
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div 
            ref={progressRef}
            className="progress-bar"
            onClick={handleProgressClick}
          >
            <div 
              className="progress-fill"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            ></div>
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="tracks-grid">
        {Object.entries(tracks).map(([trackType, trackUrl]) => (
          <div key={trackType} className="track-card">
            <audio
              ref={el => audioRefs.current[trackType] = el}
              src={trackUrl}
              preload="metadata"
            />
            
            <div className="track-header">
              <div className="track-info">
                <span className="track-icon">{trackInfo[trackType].icon}</span>
                <h3 style={{ color: trackInfo[trackType].color }}>
                  {trackInfo[trackType].name}
                </h3>
              </div>
              
              <div className="track-actions">
                <button
                  onClick={() => toggleMute(trackType)}
                  className={`mute-button ${mutedTracks[trackType] ? 'muted' : ''}`}
                >
                  {mutedTracks[trackType] ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                
                <button
                  onClick={() => downloadTrack(trackType)}
                  className="download-button"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volumes[trackType]}
                onChange={(e) => handleVolumeChange(trackType, parseFloat(e.target.value))}
                className="volume-slider"
                style={{ 
                  background: `linear-gradient(to right, ${trackInfo[trackType].color} 0%, ${trackInfo[trackType].color} ${volumes[trackType] * 100}%, #ddd ${volumes[trackType] * 100}%, #ddd 100%)`
                }}
              />
              <span className="volume-label">{Math.round(volumes[trackType] * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="download-all">
        <button 
          onClick={() => Object.keys(tracks).forEach(downloadTrack)}
          className="download-all-button"
        >
          <Download size={20} />
          Download All Tracks
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;