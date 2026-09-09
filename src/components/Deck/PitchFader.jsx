import React from 'react';

export const PitchFader = ({
  pitchPercent,
  onChange,
  onBend,
  onReset
}) => {
  const formatted = pitchPercent >= 0 ? `+${pitchPercent.toFixed(1)}%` : `${pitchPercent.toFixed(1)}%`;

  return (
    <div className="pitch-strip">
      <div className="pitch-display-box">{formatted}</div>
      <div className="pitch-fader-wrap">
        <div className="pitch-scale">
          <span>+8%</span>
          <span>+4%</span>
          <span>0</span>
          <span>-4%</span>
          <span>-8%</span>
        </div>
        <input
          type="range"
          className="vertical-slider"
          min="-8"
          max="8"
          step="0.1"
          value={pitchPercent}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          title="Tempo / Pitch Fader"
        />
      </div>
      <div className="pitch-bend-row">
        <button
          className="pitch-bend-btn"
          onMouseDown={() => onBend(-0.08)}
          title="Pitch Bend -"
        >
          -
        </button>
        <button
          className="pitch-bend-btn"
          onMouseDown={() => onBend(0.08)}
          title="Pitch Bend +"
        >
          +
        </button>
      </div>
      <button className="pitch-reset-btn" onClick={onReset} title="Reset Tempo to 0%">
        RESET
      </button>
    </div>
  );
};
