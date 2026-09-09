import React, { useRef, useEffect, useCallback } from 'react';
import { drawTurntable } from '../../audio/VisualizerEngine';

export const Turntable = ({
  deckId,
  isPlaying,
  playbackRate,
  primaryColor,
  onScratchStart,
  onScratchMove,
  onScratchEnd
}) => {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const isScratchingRef = useRef(false);
  const lastAngleRef = useRef(0);

  const getAngle = (clientX, clientY, rect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    isScratchingRef.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    lastAngleRef.current = getAngle(clientX, clientY, rect);
    onScratchStart();
  };

  const handlePointerMove = useCallback((e) => {
    if (!isScratchingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const currentAngle = getAngle(clientX, clientY, rect);

    let deltaAngle = currentAngle - lastAngleRef.current;
    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    lastAngleRef.current = currentAngle;
    rotationRef.current = (rotationRef.current + deltaAngle) % (2 * Math.PI);
    onScratchMove(deltaAngle);
  }, [onScratchMove]);

  const handlePointerUp = useCallback(() => {
    if (isScratchingRef.current) {
      isScratchingRef.current = false;
      onScratchEnd();
    }
  }, [onScratchEnd]);

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // 60FPS Turntable Platter Animation
  useEffect(() => {
    let animId;
    const render = () => {
      const now = performance.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && !isScratchingRef.current) {
        const rotSpeed = 3.49 * (playbackRate || 1.0);
        rotationRef.current = (rotationRef.current + rotSpeed * deltaSec) % (2 * Math.PI);
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawTurntable(ctx, canvasRef.current.width, rotationRef.current, isPlaying, primaryColor, deckId);
        }
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackRate, primaryColor, deckId]);

  return (
    <div
      className="turntable-outer"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      title="Click & Drag to Scratch Platter"
    >
      <canvas ref={canvasRef} width={540} height={540} />
      <span className="scratch-hint">DRAG TO SCRATCH</span>
    </div>
  );
};
