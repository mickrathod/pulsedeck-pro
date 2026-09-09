import React from 'react';

export const DJGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="shortcuts-modal dj-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎓</span>
            <h3 style={{ margin: 0, color: '#00f0ff' }}>Can You Learn Real DJing Here? Yes!</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="dj-guide-content">
          {/* Quick Verdict */}
          <div className="guide-callout-box">
            <h4 style={{ color: '#00f0ff', marginBottom: '6px' }}>⚡ 100% Real DJ Workflow & Architecture</h4>
            <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#cbd5e1', margin: 0 }}>
              <strong>PulseDeck Pro</strong> is modeled <strong>1-to-1</strong> on club-standard Pioneer DJ consoles (Pioneer DDJ-FLX4, DDJ-1000 & CDJ-3000). Every single knob, slider, and concept here is what professional club and festival DJs use every night.
            </p>
          </div>

          {/* 1:1 Gear Comparison Table */}
          <h4 style={{ color: '#ff007f', marginTop: '16px', marginBottom: '8px' }}>
            🎛️ How PulseDeck Compares to Real Pioneer Club Gear
          </h4>
          <div className="gear-compare-table-wrap">
            <table className="gear-compare-table">
              <thead>
                <tr>
                  <th>On PulseDeck Pro</th>
                  <th>On Real Pioneer Gear</th>
                  <th>Real Skill You Learn</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pitch Sliders</strong> (±8% Tempo)</td>
                  <td>Pioneer Tempo Fader</td>
                  <td><strong>Beatmatching</strong>: Matching BPM between two different tracks</td>
                </tr>
                <tr>
                  <td><strong>Jog Wheels</strong> (Vinyl / Bend)</td>
                  <td>Mechanical Jog Wheels</td>
                  <td><strong>Nudging & Scratching</strong>: Aligning transient drum kicks</td>
                </tr>
                <tr>
                  <td><strong>3-Band Isolator EQ</strong> (Hi/Mid/Low)</td>
                  <td>Pioneer DJM Channel EQs</td>
                  <td><strong>Bass Swapping</strong>: The #1 secret of seamless club transitions</td>
                </tr>
                <tr>
                  <td><strong>Crossfader & Volume Faders</strong></td>
                  <td>Magvel Crossfader</td>
                  <td><strong>Dynamic Level Blending</strong> without clipping the audio</td>
                </tr>
                <tr>
                  <td><strong>Hot Cues (1–4) & Beat Loops</strong></td>
                  <td>8 RGB Performance Pads</td>
                  <td><strong>Phrase Dropping</strong>: Triggering drops on Beat 1</td>
                </tr>
                <tr>
                  <td><strong>Drag & Drop MP3s</strong></td>
                  <td>Rekordbox USB Drive</td>
                  <td><strong>Track Selection</strong>: Mix your own music library</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tutorial: The Secret Bass Swap Transition */}
          <h4 style={{ color: '#00f0ff', marginTop: '18px', marginBottom: '8px' }}>
            🎧 Master the "Bass Swap" Transition (Try This Now!):
          </h4>
          <div className="tutorial-steps-grid">
            <div className="tut-step">
              <span className="step-num">Step 1</span>
              <h5>Start Deck A</h5>
              <p>Hit <strong>PLAY</strong> on Deck A. Leave its volume up and all EQ knobs centered (12 o'clock).</p>
            </div>
            <div className="tut-step">
              <span className="step-num">Step 2</span>
              <h5>Prep Deck B</h5>
              <p>Click <strong>SYNC</strong> on Deck B so both tracks match tempo. Turn Deck B's <strong>LOW (Bass)</strong> knob down to 0%.</p>
            </div>
            <div className="tut-step">
              <span className="step-num">Step 3</span>
              <h5>Bring in the Blend</h5>
              <p>Raise Deck B's volume fader. Only its vocals and hi-hats will enter, keeping the mix clean and clash-free!</p>
            </div>
            <div className="tut-step">
              <span className="step-num">Step 4</span>
              <h5>The Bass Swap!</h5>
              <p>On the 32nd beat (chorus change), simultaneously cut Deck A's LOW and turn Deck B's LOW to 12 o'clock!</p>
            </div>
          </div>

          {/* Real Gear Transition Advice */}
          <div className="real-gear-advice">
            <h5 style={{ color: '#ffb800', margin: '0 0 6px 0' }}>💡 Moving from this App to Physical Hardware:</h5>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
              Once you master transitions, phrase counting, and EQ blending here, stepping up to an entry-level physical controller like a <strong>Pioneer DDJ-FLX4</strong> or <strong>Traktor Kontrol</strong> will feel completely natural—because the muscle memory and audio ear principles are identical!
            </p>
          </div>
        </div>

        <div className="modal-footer-action">
          <button className="btn-close-guide" onClick={onClose}>
            🚀 Got It! Let's Mix
          </button>
        </div>
      </div>
    </div>
  );
};
