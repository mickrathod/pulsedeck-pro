import React, { useRef, useEffect } from 'react';
import { RotaryKnob } from '../Common/RotaryKnob';

export const Header = ({
  masterVolume,
  onMasterVolumeChange,
  isRecording,
  recordingTime,
  onRecordToggle,
  onOpenShortcuts,
  onResetDemos,
  masterAnalyser
}) => {
  const canvasRef = useRef(null);

  // 60FPS Master Spectrum Visualizer
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas || !masterAnalyser) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const bufferLength = masterAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      masterAnalyser.getByteFrequencyData(dataArray);

      const barCount = 48;
      const barWidth = (width / barCount) - 1.5;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(Math.pow(i / barCount, 1.6) * (bufferLength / 2));
        const val = dataArray[dataIndex] / 255.0;
        const barHeight = Math.max(2, val * height);
        const x = i * (barWidth + 1.5);
        const y = height - barHeight;

        const ratio = i / barCount;
        ctx.fillStyle = ratio < 0.5 ? '#00f0ff' : '#ff007f';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [masterAnalyser]);

  const formatRecTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `REC ${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="top-bar">
      <div className="brand-section">
        <div className="brand-logo">DJ</div>
        <div>
          <h1 className="brand-title">DJ STUDIO PRO</h1>
        </div>
        <span className="brand-badge">REACT EDITION</span>
      </div>

      <div className="master-spectrum-wrap" title="Master Frequency Spectrum">
        <canvas ref={canvasRef} width={280} height={28} />
      </div>

      <div className="master-controls">
        <div className="knob-control" style={{ flexDirection: 'row', gap: '8px' }}>
          <span className="knob-title">MASTER</span>
          <RotaryKnob
            value={masterVolume}
            min={0}
            max={1.2}
            defaultValue={0.9}
            onChange={onMasterVolumeChange}
            size={38}
            deckColor="#ffb800"
          />
        </div>

        <button
          className={`rec-btn ${isRecording ? 'recording' : ''}`}
          onClick={onRecordToggle}
          title="Record Live Mix"
        >
          <span className="rec-dot" />
          <span>{isRecording ? formatRecTime(recordingTime) : 'REC MIX'}</span>
        </button>

        <button className="top-action-btn" onClick={onOpenShortcuts} title="Keyboard Shortcuts">
          <span>⌨</span> Shortcuts
        </button>

        <button className="top-action-btn" onClick={onResetDemos} title="Reset Built-in Demo Tracks">
          <span>↺</span> Reset Tracks
        </button>
      </div>
    </header>
  );
};
