import React from 'react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

export const DeckScreen = ({
  deckId,
  trackTitle,
  trackArtist,
  currentTime,
  bpm,
  pitchPercent,
  onFileUpload,
  onReloadDemo
}) => {
  const pitchFormatted = pitchPercent >= 0 ? `+${pitchPercent.toFixed(1)}%` : `${pitchPercent.toFixed(1)}%`;

  return (
    <div className="deck-screen">
      <div className="deck-info-row">
        <span className="deck-badge">DECK {deckId}</span>
        <div className="track-meta">
          <div className="track-title" title={trackTitle}>{trackTitle}</div>
          <div className="track-artist">{trackArtist} • {bpm.toFixed(1)} BPM</div>
        </div>
        <div className="deck-lcd">
          <div className="lcd-item">
            <span className="lcd-label">TIME</span>
            <span className="lcd-value">{formatTime(currentTime)}</span>
          </div>
          <div className="lcd-item">
            <span className="lcd-label">BPM</span>
            <span className="lcd-value">{bpm.toFixed(1)}</span>
          </div>
          <div className="lcd-item">
            <span className="lcd-label">PITCH</span>
            <span className="lcd-value">{pitchFormatted}</span>
          </div>
        </div>
      </div>

      <div className="track-load-bar">
        <label className="file-load-btn" title="Load custom audio file">
          <span>📁</span> Load Audio File
          <input
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files.length > 0) {
                onFileUpload(e.target.files[0]);
              }
            }}
          />
        </label>
        <button className="demo-track-btn" onClick={onReloadDemo} title="Reload Built-in Demo">
          Demo Track
        </button>
      </div>
    </div>
  );
};
