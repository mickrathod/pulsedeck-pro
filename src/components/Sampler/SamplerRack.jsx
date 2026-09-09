import React, { useState } from 'react';

const SAMPLES = [
  { id: 0, name: 'AIRHORN', icon: '🎺', key: 'Z', color: '#ff3366' },
  { id: 1, name: 'LASER', icon: '⚡', key: 'X', color: '#00f0ff' },
  { id: 2, name: 'SUB DROP', icon: '💣', key: 'C', color: '#ffaa00' },
  { id: 3, name: 'SIREN', icon: '🚨', key: 'V', color: '#ff007f' },
  { id: 4, name: 'SCRATCH', icon: '💿', key: 'B', color: '#33ff88' },
  { id: 5, name: 'YEAH!', icon: '🗣️', key: 'N', color: '#7928ca' },
  { id: 6, name: 'BIG CLAP', icon: '👏', key: 'M', color: '#0070f3' },
  { id: 7, name: 'REVERSE', icon: '🌊', key: ',', color: '#ffe600' }
];

export const SamplerRack = ({ onTriggerSample }) => {
  const [activePad, setActivePad] = useState(null);

  const handlePadClick = (id) => {
    setActivePad(id);
    onTriggerSample(id);
    setTimeout(() => {
      setActivePad((current) => (current === id ? null : current));
    }, 120);
  };

  return (
    <section className="sampler-panel">
      <div className="sampler-chassis">
        <div className="sampler-header">
          <div className="sampler-title-wrap">
            <span className="brand-badge">FX BANK</span>
            <span className="sampler-title">PERFORMANCE SAMPLE PADS</span>
          </div>
          <span style={{ fontSize: '11px', color: '#8890a6' }}>
            Shortcuts: Keys Z, X, C, V, B, N, M, ,
          </span>
        </div>

        <div className="sampler-grid">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              className={`sample-pad ${activePad === sample.id ? 'trigger' : ''}`}
              style={{ color: sample.color }}
              onClick={() => handlePadClick(sample.id)}
              title={`${sample.name} [Key: ${sample.key}]`}
            >
              <span className="pad-key">{sample.key}</span>
              <span className="pad-icon">{sample.icon}</span>
              <span className="pad-name">{sample.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
