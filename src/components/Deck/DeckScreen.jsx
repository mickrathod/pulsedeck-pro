import React from 'react';
import { BUILTIN_TRACKS } from '../../audio/AudioEngine';

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
  onReloadDemo,
  onSelectTrack,
  currentTrackId
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
        <div className={`track-picker-box deck-${deckId.toLowerCase()}-picker`}>
          <span className="picker-badge">SELECT SONG:</span>
          <select
            className="builtin-track-select"
            value={currentTrackId || ''}
            onChange={(e) => onSelectTrack && onSelectTrack(e.target.value)}
            title="Click to select a song from the library"
          >
            <option value="" disabled>Choose Song from Crate...</option>
            {BUILTIN_TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                🎵 {t.title} — {t.bpm} BPM ({t.genre})
              </option>
            ))}
          </select>
        </div>

        <label className="file-load-btn" title="Load custom audio file (MP3 / WAV)">
          <span>📁</span> Or Drop MP3
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
      </div>
    </div>
  );
};
