/**
 * DJ Studio Pro - Canvas Rendering & Visualizer Helpers
 */

export function precalculatePeaks(buffer) {
  if (!buffer) return null;
  const sampleRate = buffer.sampleRate;
  const leftData = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(sampleRate / 80));
  const totalPoints = Math.floor(leftData.length / step);

  const peaks = {
    bass: new Float32Array(totalPoints),
    mid: new Float32Array(totalPoints),
    high: new Float32Array(totalPoints),
    overall: new Float32Array(totalPoints)
  };

  for (let i = 0; i < totalPoints; i++) {
    const start = i * step;
    let maxOverall = 0;
    let maxBass = 0;
    let maxMid = 0;
    let maxHigh = 0;

    for (let j = 0; j < step && start + j < leftData.length; j++) {
      const val = Math.abs(leftData[start + j]);
      if (val > maxOverall) maxOverall = val;
      if (j % 4 === 0 && val > maxBass) maxBass = val;
      if (j % 2 === 0 && val > maxMid) maxMid = val;
      if (val > maxHigh) maxHigh = val;
    }

    peaks.overall[i] = Math.min(1.0, maxOverall);
    peaks.bass[i] = Math.min(1.0, maxBass * 1.1);
    peaks.mid[i] = Math.min(1.0, maxMid * 0.9);
    peaks.high[i] = Math.min(1.0, maxHigh * 0.7);
  }

  return peaks;
}

export function drawScrollingWaveform(ctx, width, height, currentTime, duration, bpm, peaks, primaryColor) {
  const midY = height / 2;
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, width, height);

  // Background horizontal grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let y = 10; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (!peaks) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO TRACK LOADED - CLICK LOAD OR PLAY', width / 2, midY + 4);
    return;
  }

  const viewSeconds = 6.0;
  const pixelsPerSecond = width / viewSeconds;
  const centerX = width / 2;

  // Beat grid
  const beatSec = 60 / (bpm || 128);
  const firstVisibleBeat = Math.floor((currentTime - (viewSeconds / 2)) / beatSec);
  const lastVisibleBeat = Math.ceil((currentTime + (viewSeconds / 2)) / beatSec);

  for (let b = firstVisibleBeat; b <= lastVisibleBeat; b++) {
    const beatTime = b * beatSec;
    const beatX = centerX + (beatTime - currentTime) * pixelsPerSecond;
    const isBar = b % 4 === 0;

    ctx.strokeStyle = isBar ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isBar ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(beatX, isBar ? 4 : 12);
    ctx.lineTo(beatX, isBar ? height - 4 : height - 12);
    ctx.stroke();

    if (isBar && beatX > 15 && beatX < width - 15) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText(`${Math.floor(b / 4) + 1}`, beatX + 3, 13);
    }
  }

  // Waveform bars
  const totalPoints = peaks.overall.length;
  const pointsPerSecond = totalPoints / duration;
  const startPoint = Math.floor((currentTime - viewSeconds / 2) * pointsPerSecond);
  const endPoint = Math.ceil((currentTime + viewSeconds / 2) * pointsPerSecond);
  const barPixelWidth = Math.max(1.8, width / (viewSeconds * pointsPerSecond));

  for (let p = startPoint; p <= endPoint; p++) {
    if (p < 0 || p >= totalPoints) continue;

    const pointTime = p / pointsPerSecond;
    const x = centerX + (pointTime - currentTime) * pixelsPerSecond;
    if (x < -5 || x > width + 5) continue;

    const amp = peaks.overall[p];
    const bass = peaks.bass[p];
    const high = peaks.high[p];

    const barHeight = Math.max(2, amp * (midY - 6));
    const bassHeight = Math.max(1, bass * (midY - 14));

    // High/Mid layer
    ctx.fillStyle = primaryColor;
    ctx.fillRect(x, midY - barHeight, barPixelWidth, barHeight * 2);

    // Bass Core layer
    if (bass > 0.35) {
      ctx.fillStyle = 'rgba(255, 75, 43, 0.85)';
      ctx.fillRect(x, midY - bassHeight, barPixelWidth, bassHeight * 2);
    }

    // High transients
    if (high > 0.75) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, midY - 2, barPixelWidth, 4);
    }
  }

  // Center Playhead
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();

  // Playhead triangles
  ctx.fillStyle = '#ff0055';
  ctx.beginPath();
  ctx.moveTo(centerX - 6, 0);
  ctx.lineTo(centerX + 6, 0);
  ctx.lineTo(centerX, 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX - 6, height);
  ctx.lineTo(centerX + 6, height);
  ctx.lineTo(centerX, height - 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function drawOverviewWaveform(ctx, width, height, currentTime, duration, peaks, primaryColor, hotCues = [], loopInfo = null) {
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  const midY = height / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  if (peaks) {
    const barWidth = width / peaks.overall.length;
    for (let i = 0; i < peaks.overall.length; i++) {
      const x = i * barWidth;
      const amp = peaks.overall[i] * (height / 2 - 2);
      const bass = peaks.bass[i];

      ctx.fillStyle = bass > 0.65 ? 'rgba(255, 80, 50, 0.85)' : primaryColor;
      ctx.fillRect(x, midY - amp, Math.max(1, barWidth - 0.2), amp * 2);
    }
  }

  if (duration > 0) {
    // Loop highlight
    if (loopInfo && loopInfo.active && loopInfo.end > loopInfo.start) {
      const loopStartX = (loopInfo.start / duration) * width;
      const loopEndX = (loopInfo.end / duration) * width;
      ctx.fillStyle = 'rgba(255, 230, 0, 0.3)';
      ctx.fillRect(loopStartX, 0, Math.max(2, loopEndX - loopStartX), height);
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(loopStartX, 0, Math.max(2, loopEndX - loopStartX), height);
    }

    // Hot Cue Triangles
    const cueColors = ['#ff3366', '#33ff88', '#ffaa00', '#00ffff'];
    hotCues.forEach((pos, idx) => {
      if (pos !== null && pos !== undefined) {
        const cueX = (pos / duration) * width;
        ctx.fillStyle = cueColors[idx % cueColors.length];
        ctx.beginPath();
        ctx.moveTo(cueX - 4, 0);
        ctx.lineTo(cueX + 4, 0);
        ctx.lineTo(cueX, 7);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = cueColors[idx % cueColors.length];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cueX, 7);
        ctx.lineTo(cueX, height);
        ctx.stroke();
      }
    });

    // Playhead Needle
    const playheadX = (currentTime / duration) * width;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(playheadX - 4, height);
    ctx.lineTo(playheadX + 4, height);
    ctx.lineTo(playheadX, height - 7);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawTurntable(ctx, size, rotation, isPlaying, primaryColor, deckId) {
  const center = size / 2;
  const radius = center - 8;

  ctx.clearRect(0, 0, size, size);

  // Outer bezel
  ctx.beginPath();
  ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#11141c';
  ctx.fill();

  // Tactile grip notches
  const numTeeth = 60;
  ctx.save();
  ctx.translate(center, center);
  for (let i = 0; i < numTeeth; i++) {
    const angle = (i / numTeeth) * 2 * Math.PI;
    ctx.fillStyle = i % 2 === 0 ? '#1f2430' : '#0e1118';
    const x = Math.cos(angle) * (radius - 2);
    const y = Math.sin(angle) * (radius - 2);
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  ctx.restore();

  // LED Halo ring
  ctx.beginPath();
  ctx.arc(center, center, radius - 6, 0, 2 * Math.PI);
  ctx.strokeStyle = isPlaying ? primaryColor : 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  if (isPlaying) {
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 12;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Vinyl Base
  const vinylRadius = radius - 10;
  const vinylGrad = ctx.createRadialGradient(center, center, 20, center, center, vinylRadius);
  vinylGrad.addColorStop(0, '#1c1f26');
  vinylGrad.addColorStop(0.6, '#0f1115');
  vinylGrad.addColorStop(1, '#050608');

  ctx.beginPath();
  ctx.arc(center, center, vinylRadius, 0, 2 * Math.PI);
  ctx.fillStyle = vinylGrad;
  ctx.fill();

  // Micro-Grooves
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let r = vinylRadius * 0.45; r < vinylRadius - 2; r += 3) {
    ctx.beginPath();
    ctx.arc(center, center, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Specular reflection cones
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation * 0.25);
  const sheenGrad = ctx.createConicGradient(0, 0, 0);
  sheenGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
  sheenGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.0)');
  sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  sheenGrad.addColorStop(0.62, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.0)');
  sheenGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.arc(0, 0, vinylRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Rotating Slipmat / Center Label
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  const labelRadius = vinylRadius * 0.40;
  const labelGrad = ctx.createLinearGradient(-labelRadius, -labelRadius, labelRadius, labelRadius);
  labelGrad.addColorStop(0, primaryColor);
  labelGrad.addColorStop(1, '#0e111a');

  ctx.beginPath();
  ctx.arc(0, 0, labelRadius, 0, 2 * Math.PI);
  ctx.fillStyle = labelGrad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Strobe lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (labelRadius * 0.35), Math.sin(angle) * (labelRadius * 0.35));
    ctx.lineTo(Math.cos(angle) * (labelRadius * 0.9), Math.sin(angle) * (labelRadius * 0.9));
    ctx.stroke();
  }

  // Deck letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`DECK ${deckId}`, 0, 0);

  // Scratch indicator dot
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(labelRadius * 0.82, 0, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Spindle
  const spindleGrad = ctx.createRadialGradient(center - 2, center - 2, 1, center, center, 10);
  spindleGrad.addColorStop(0, '#ffffff');
  spindleGrad.addColorStop(0.4, '#a0a8b4');
  spindleGrad.addColorStop(1, '#2c3240');

  ctx.beginPath();
  ctx.arc(center, center, 8, 0, 2 * Math.PI);
  ctx.fillStyle = spindleGrad;
  ctx.fill();
  ctx.strokeStyle = '#1a1f2c';
  ctx.lineWidth = 1;
  ctx.stroke();
}
