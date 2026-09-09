import React from 'react';

export const Crossfader = ({
  position,
  curve,
  onPositionChange,
  onCurveChange
}) => {
  return (
    <div className="crossfader-section">
      <div className="crossfader-header">
        <span className="crossfader-title">CROSSFADER</span>
        <div className="curve-selector">
          {['smooth', 'linear', 'scratch'].map((c) => (
            <button
              key={c}
              className={`curve-btn ${curve === c ? 'active' : ''}`}
              onClick={() => onCurveChange(c)}
              title={`${c.toUpperCase()} Curve`}
            >
              {c === 'smooth' ? 'SMOOTH' : c === 'linear' ? 'LIN' : 'CUT'}
            </button>
          ))}
        </div>
      </div>

      <div className="crossfader-track-wrap">
        <input
          type="range"
          className="horizontal-crossfader"
          min="0"
          max="1"
          step="0.01"
          value={position}
          onChange={(e) => onPositionChange(parseFloat(e.target.value))}
          title="Crossfader (Left/Right arrow keys)"
        />
      </div>

      <div className="crossfader-labels">
        <span className="cf-a">◄ DECK A</span>
        <span className="cf-center">CENTER</span>
        <span className="cf-b">DECK B ►</span>
      </div>
    </div>
  );
};
