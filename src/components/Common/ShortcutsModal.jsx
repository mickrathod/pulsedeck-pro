import React from 'react';

export const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>DJ Studio Pro Keyboard Shortcuts</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="shortcuts-grid">
          <div className="shortcut-group deck-a-group">
            <h4>Deck A Controls</h4>
            <div className="shortcut-row"><span>Play / Pause</span> <span className="key-badge">Q</span></div>
            <div className="shortcut-row"><span>Cue / Return</span> <span className="key-badge">A</span></div>
            <div className="shortcut-row"><span>Sync BPM</span> <span className="key-badge">S</span></div>
            <div className="shortcut-row"><span>Toggle Loop</span> <span className="key-badge">W</span></div>
            <div className="shortcut-row"><span>Hot Cues 1-4</span> <span className="key-badge">1 - 4</span></div>
            <div className="shortcut-row"><span>Pitch Bend - / +</span> <span className="key-badge">E / R</span></div>
          </div>

          <div className="shortcut-group deck-b-group">
            <h4>Deck B Controls</h4>
            <div className="shortcut-row"><span>Play / Pause</span> <span className="key-badge">P</span></div>
            <div className="shortcut-row"><span>Cue / Return</span> <span className="key-badge">L</span></div>
            <div className="shortcut-row"><span>Sync BPM</span> <span className="key-badge">K</span></div>
            <div className="shortcut-row"><span>Toggle Loop</span> <span className="key-badge">O</span></div>
            <div className="shortcut-row"><span>Hot Cues 1-4</span> <span className="key-badge">7 - 0</span></div>
            <div className="shortcut-row"><span>Pitch Bend - / +</span> <span className="key-badge">I / U</span></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <div className="shortcut-row"><span>Crossfader Left / Right</span> <span className="key-badge">← / →</span></div>
          <div className="shortcut-row"><span>Crossfader Center</span> <span className="key-badge">↓</span></div>
          <div className="shortcut-row"><span>Sampler FX Pads</span> <span className="key-badge">Z, X, C, V, B, N, M, ,</span></div>
        </div>
      </div>
    </div>
  );
};
