import React, { useRef, useState, useEffect, useCallback } from 'react';
import './RotaryKnob.css';

export const RotaryKnob = ({
  value,
  min = 0,
  max = 1,
  defaultValue = 0,
  onChange,
  label,
  deckColor = '#00f0ff',
  readout = null,
  size = 46,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(value);

  // Map value to angle (-135deg to +135deg = 270deg sweep)
  const ratio = (value - min) / (max - min);
  const deg = -135 + Math.max(0, Math.min(1, ratio)) * 270;

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY || (e.touches && e.touches[0].clientY);
    dragStartVal.current = value;
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const deltaY = dragStartY.current - clientY;
    const range = max - min;
    const step = (deltaY / 150) * range;
    const newVal = Math.max(min, Math.min(max, dragStartVal.current + step));
    onChange(newVal);
  }, [isDragging, max, min, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const range = max - min;
    const newVal = Math.max(min, Math.min(max, value + delta * (range / 30)));
    onChange(newVal);
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className={`rotary-knob-container ${className}`}>
      <div
        className={`rotary-knob-body ${isDragging ? 'active' : ''}`}
        style={{
          width: size,
          height: size,
          '--deck-color': deckColor
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        title={`${label}: ${value.toFixed(1)} (Double-click to reset)`}
      >
        <div
          className="rotary-knob-pointer"
          style={{ transform: `rotate(${deg}deg)` }}
        />
      </div>
      {label && <span className="rotary-knob-label">{label}</span>}
      {readout !== null && <span className="rotary-knob-readout">{readout}</span>}
    </div>
  );
};
