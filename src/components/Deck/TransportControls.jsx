import React, { useRef } from 'react';

export const TransportControls = ({
  isPlaying,
  onPlayToggle,
  onCueDown,
  onCueUp
}) => {
  const isCueHeldRef = useRef(false);

  const handleCueDown = (e) => {
    e.preventDefault();
    isCueHeldRef.current = true;
    onCueDown();
  };

  const handleCueUp = (e) => {
    if (isCueHeldRef.current) {
      isCueHeldRef.current = false;
      onCueUp();
    }
  };

  return (
    <div className="transport-buttons">
      <button
        className="pioneer-btn cue-btn"
        onMouseDown={handleCueDown}
        onMouseUp={handleCueUp}
        onTouchStart={handleCueDown}
        onTouchEnd={handleCueUp}
        title="CUE Button"
      >
        <span className="btn-icon">⏺</span>
        <span className="btn-text">CUE</span>
      </button>

      <button
        className={`pioneer-btn play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={onPlayToggle}
        title="PLAY / PAUSE"
      >
        <span className="btn-icon">▶⏸</span>
        <span className="btn-text">PLAY</span>
      </button>
    </div>
  );
};
