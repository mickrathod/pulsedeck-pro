import React, { useRef, useEffect, useCallback } from 'react';
import { drawScrollingWaveform, drawOverviewWaveform } from '../../audio/VisualizerEngine';

export const WaveformView = ({
  deckId,
  currentTime,
  duration,
  bpm,
  peaks,
  primaryColor,
  hotCues = [],
  loopInfo = null,
  onSeek
}) => {
  const scrollCanvasRef = useRef(null);
  const overviewCanvasRef = useRef(null);
  const isSeekingRef = useRef(false);

  // Render scrolling waveform
  useEffect(() => {
    if (!scrollCanvasRef.current) return;
    const ctx = scrollCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawScrollingWaveform(
      ctx,
      scrollCanvasRef.current.width,
      scrollCanvasRef.current.height,
      currentTime,
      duration,
      bpm,
      peaks,
      primaryColor
    );
  }, [currentTime, duration, bpm, peaks, primaryColor]);

  // Render overview waveform
  useEffect(() => {
    if (!overviewCanvasRef.current) return;
    const ctx = overviewCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawOverviewWaveform(
      ctx,
      overviewCanvasRef.current.width,
      overviewCanvasRef.current.height,
      currentTime,
      duration,
      peaks,
      primaryColor,
      hotCues,
      loopInfo
    );
  }, [currentTime, duration, peaks, primaryColor, hotCues, loopInfo]);

  const handleSeekEvent = useCallback((e) => {
    if (!overviewCanvasRef.current || !duration) return;
    const rect = overviewCanvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const handlePointerDown = (e) => {
    isSeekingRef.current = true;
    handleSeekEvent(e);
  };

  const handlePointerMove = useCallback((e) => {
    if (isSeekingRef.current) {
      handleSeekEvent(e);
    }
  }, [handleSeekEvent]);

  const handlePointerUp = useCallback(() => {
    isSeekingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="waveform-container">
      <div className="scrolling-wave-wrap" title="Scrolling RGB Dynamic Waveform">
        <canvas ref={scrollCanvasRef} width={800} height={180} />
      </div>
      <div
        className="overview-wave-wrap"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        title="Click or Drag to Needle Drop / Seek"
      >
        <canvas ref={overviewCanvasRef} width={800} height={72} />
        <span className="needle-drop-hint">NEEDLE DROP</span>
      </div>
    </div>
  );
};
