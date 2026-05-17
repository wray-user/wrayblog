import { useEffect, useRef, useState } from 'react';
import styles from './MusicPlayer.module.css';

const tracks = [
  { title: 'Sample One', artist: 'FileSamples', src: '/audio/sample1.mp3' },
  { title: 'Sample Three', artist: 'FileSamples', src: '/audio/sample3.mp3' },
  { title: 'Sample Four', artist: 'FileSamples', src: '/audio/sample4.mp3' },
];

const EDGE_COLLAPSE_DISTANCE = 48;

const formatTime = (time = 0) => {
  if (!Number.isFinite(time)) {
    return '0:00';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const PlayIcon = ({ isPlaying }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {isPlaying ? (
      <>
        <path d="M8 6v12" />
        <path d="M16 6v12" />
      </>
    ) : (
      <path d="m9 7 8 5-8 5z" />
    )}
  </svg>
);

const SkipIcon = ({ direction = 'next' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {direction === 'previous' ? (
      <>
        <path d="M19 6v12" />
        <path d="m15 7-8 5 8 5z" />
      </>
    ) : (
      <>
        <path d="M5 6v12" />
        <path d="m9 7 8 5-8 5z" />
      </>
    )}
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18V5l10-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="16" cy="16" r="3" />
  </svg>
);

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const dragRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [dockSide, setDockSide] = useState('right');
  const [top, setTop] = useState(118);
  const [dragPosition, setDragPosition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const activeTrack = tracks[activeIndex];

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }

    return undefined;
  }, [activeIndex, isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const clampOnResize = () => {
      setTop((value) => {
        const height = playerRef.current?.offsetHeight || 96;
        return Math.min(Math.max(72, value), window.innerHeight - height - 16);
      });
    };

    window.addEventListener('resize', clampOnResize);
    return () => window.removeEventListener('resize', clampOnResize);
  }, []);

  const clampTop = (value) => {
    const height = playerRef.current?.offsetHeight || 96;
    return Math.min(Math.max(72, value), window.innerHeight - height - 16);
  };

  const clampLeft = (value) => {
    const width = playerRef.current?.offsetWidth || 322;
    return Math.min(Math.max(10, value), window.innerWidth - width - 10);
  };

  const startDrag = (event) => {
    if (event.target.closest('button, input')) {
      return;
    }

    const rect = playerRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      didMove: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.didMove = true;
    }

    const nextTop = clampTop(event.clientY - dragRef.current.offsetY);
    const nextLeft = clampLeft(event.clientX - dragRef.current.offsetX);

    setTop(nextTop);
    setDragPosition({
      left: nextLeft,
      top: nextTop,
    });
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (dragRef.current.didMove) {
      const nextDockSide = event.clientX < window.innerWidth / 2 ? 'left' : 'right';
      const shouldCollapse =
        event.clientX <= EDGE_COLLAPSE_DISTANCE ||
        event.clientX >= window.innerWidth - EDGE_COLLAPSE_DISTANCE;

      setDockSide(nextDockSide);
      setIsCollapsed(shouldCollapse);
    }

    setDragPosition(null);
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const playPrevious = () => {
    setActiveIndex((index) => (index - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const playNext = () => {
    setActiveIndex((index) => (index + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value);
    const audio = audioRef.current;

    setProgress(nextTime);
    if (audio) {
      audio.currentTime = nextTime;
    }
  };

  return (
    <div
      ref={playerRef}
      className={[
        styles.player,
        styles[dockSide],
        dragPosition ? styles.dragging : '',
        isCollapsed ? styles.collapsed : '',
      ].join(' ')}
      style={
        dragPosition
          ? { top: dragPosition.top, left: dragPosition.left, right: 'auto' }
          : { top }
      }
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <audio
        ref={audioRef}
        src={activeTrack.src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onEnded={playNext}
      />

      {isCollapsed ? (
        <button
          className={styles.edgeTab}
          type="button"
          aria-label="Show music player"
          onClick={() => setIsCollapsed(false)}
        >
          <MusicIcon />
        </button>
      ) : (
        <>
          <button
            className={styles.cover}
            type="button"
            aria-label="Hide music player"
            onClick={() => setIsCollapsed(true)}
          >
            <img src="/icon/cat.png" alt="" />
          </button>

          <div className={styles.info}>
            <h3>{activeTrack.title}</h3>
            <p>{activeTrack.artist}</p>
            <div className={styles.progressRow}>
              <span>{formatTime(progress)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="1"
                value={Math.min(progress, duration || 0)}
                onChange={handleSeek}
                aria-label="Track progress"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.controls}>
            <button type="button" onClick={playPrevious} aria-label="Previous track">
              <SkipIcon direction="previous" />
            </button>
            <button
              className={styles.playButton}
              type="button"
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <PlayIcon isPlaying={isPlaying} />
            </button>
            <button type="button" onClick={playNext} aria-label="Next track">
              <SkipIcon />
            </button>
          </div>

          <div className={styles.footerTools}>
            <span className={styles.volumeLabel}>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Volume"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MusicPlayer;
