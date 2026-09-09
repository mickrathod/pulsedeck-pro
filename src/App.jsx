import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DJAudioEngine } from './audio/AudioEngine';
import { precalculatePeaks } from './audio/VisualizerEngine';
import { Header } from './components/Header/Header';
import { Deck } from './components/Deck/Deck';
import { Mixer } from './components/Mixer/Mixer';
import { SamplerRack } from './components/Sampler/SamplerRack';
import { ShortcutsModal } from './components/Common/ShortcutsModal';
import './App.css';

export function App() {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new DJAudioEngine();
  }
  const engine = engineRef.current;

  // Waveform Peaks Cache
  const [peaksA, setPeaksA] = useState(null);
  const [peaksB, setPeaksB] = useState(null);

  // Deck States
  const [deckAState, setDeckAState] = useState({
    trackTitle: 'Cyberpulse (Tech House)',
    trackArtist: 'DJ Studio Pro',
    currentTime: 0,
    duration: 61.9,
    currentBpm: 124,
    pitchPercent: 0,
    playbackRate: 1.0,
    isPlaying: false,
    hotCues: [null, null, null, null],
    loopActive: false,
    loopStart: 0,
    loopEnd: 0,
    loopBeats: 4,
    isSynced: false
  });

  const [deckBState, setDeckBState] = useState({
    trackTitle: 'Neon Drift (Electro Club)',
    trackArtist: 'DJ Studio Pro',
    currentTime: 0,
    duration: 60.0,
    currentBpm: 128,
    pitchPercent: 0,
    playbackRate: 1.0,
    isPlaying: false,
    hotCues: [null, null, null, null],
    loopActive: false,
    loopStart: 0,
    loopEnd: 0,
    loopBeats: 4,
    isSynced: false
  });

  // Mixer State
  const [mixerState, setMixerState] = useState({
    deckA: {
      gain: 1.0,
      eqHigh: 0,
      eqMid: 0,
      eqLow: 0,
      filter: 0,
      volume: 0.9,
      vuLevel: 0,
      killedBands: { high: false, mid: false, low: false }
    },
    deckB: {
      gain: 1.0,
      eqHigh: 0,
      eqMid: 0,
      eqLow: 0,
      filter: 0,
      volume: 0.9,
      vuLevel: 0,
      killedBands: { high: false, mid: false, low: false }
    },
    crossfaderPos: 0.5,
    crossfaderCurve: 'smooth',
    fxEcho: false,
    fxReverb: false
  });

  // Master & Recording State
  const [masterVolume, setMasterVolume] = useState(0.9);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Initialize Demo Tracks
  const loadDemoTracks = useCallback(() => {
    engine.generateDemoTracks();
    const pA = precalculatePeaks(engine.deckA.buffer);
    const pB = precalculatePeaks(engine.deckB.buffer);
    setPeaksA(pA);
    setPeaksB(pB);

    setDeckAState((prev) => ({
      ...prev,
      trackTitle: engine.deckA.trackTitle,
      trackArtist: `${engine.deckA.trackArtist} • ${engine.deckA.originalBpm}.0 BPM`,
      duration: engine.deckA.duration,
      currentBpm: engine.deckA.currentBpm
    }));

    setDeckBState((prev) => ({
      ...prev,
      trackTitle: engine.deckB.trackTitle,
      trackArtist: `${engine.deckB.trackArtist} • ${engine.deckB.originalBpm}.0 BPM`,
      duration: engine.deckB.duration,
      currentBpm: engine.deckB.currentBpm
    }));
  }, [engine]);

  useEffect(() => {
    loadDemoTracks();
  }, [loadDemoTracks]);

  // High Frequency Playhead & VU Meter Poller
  useEffect(() => {
    let animId;
    let peakAVal = 0;
    let peakBVal = 0;

    const tick = () => {
      const timeA = engine.getDeckCurrentTime('A');
      const timeB = engine.getDeckCurrentTime('B');

      // VU meter levels from analysers
      let targetA = 0;
      if (engine.deckA.isPlaying && engine.deckA.analyser) {
        const data = new Uint8Array(engine.deckA.analyser.frequencyBinCount);
        engine.deckA.analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += data[i];
        targetA = (sum / 32) / 255;
      }

      let targetB = 0;
      if (engine.deckB.isPlaying && engine.deckB.analyser) {
        const data = new Uint8Array(engine.deckB.analyser.frequencyBinCount);
        engine.deckB.analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += data[i];
        targetB = (sum / 32) / 255;
      }

      peakAVal = peakAVal * 0.85 + targetA * 0.15;
      peakBVal = peakBVal * 0.85 + targetB * 0.15;

      setDeckAState((prev) => ({
        ...prev,
        currentTime: timeA,
        isPlaying: engine.deckA.isPlaying,
        playbackRate: engine.deckA.playbackRate
      }));

      setDeckBState((prev) => ({
        ...prev,
        currentTime: timeB,
        isPlaying: engine.deckB.isPlaying,
        playbackRate: engine.deckB.playbackRate
      }));

      setMixerState((prev) => ({
        ...prev,
        deckA: { ...prev.deckA, vuLevel: peakAVal },
        deckB: { ...prev.deckB, vuLevel: peakBVal }
      }));

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Recording Timer
  useEffect(() => {
    let timer = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // ==========================================================================
  // Deck Handlers
  // ==========================================================================
  const handlePlayToggle = (deckId) => {
    const deck = deckId === 'A' ? engine.deckA : engine.deckB;
    if (deck.isPlaying) {
      engine.pause(deckId, true);
    } else {
      engine.play(deckId);
    }
  };

  const handleCueDown = (deckId) => {
    engine.cue(deckId);
  };

  const handleCueUp = (deckId) => {
    engine.cueRelease(deckId);
  };

  const handleSeek = (deckId, time) => {
    engine.seek(deckId, time);
  };

  const handleScratchStart = (deckId) => {
    engine.startScratch(deckId);
  };

  const handleScratchMove = (deckId, deltaAngle) => {
    engine.scratchMove(deckId, deltaAngle);
  };

  const handleScratchEnd = (deckId) => {
    engine.stopScratch(deckId);
  };

  const handlePitchChange = (deckId, percent) => {
    engine.setPitch(deckId, percent);
    const deck = deckId === 'A' ? engine.deckA : engine.deckB;
    const setter = deckId === 'A' ? setDeckAState : setDeckBState;
    setter((prev) => ({
      ...prev,
      pitchPercent: percent,
      currentBpm: deck.currentBpm
    }));
  };

  const handlePitchBend = (deckId, delta) => {
    engine.pitchBend(deckId, delta);
  };

  const handlePitchReset = (deckId) => {
    handlePitchChange(deckId, 0);
  };

  const handleSync = (deckId) => {
    const newPitch = engine.syncDeck(deckId);
    if (newPitch !== undefined) {
      const deck = deckId === 'A' ? engine.deckA : engine.deckB;
      const setter = deckId === 'A' ? setDeckAState : setDeckBState;
      setter((prev) => ({
        ...prev,
        pitchPercent: newPitch,
        currentBpm: deck.currentBpm,
        isSynced: true
      }));
      setTimeout(() => {
        setter((prev) => ({ ...prev, isSynced: false }));
      }, 600);
    }
  };

  const handleLoopToggle = (deckId) => {
    const active = engine.toggleLoop(deckId);
    const deck = deckId === 'A' ? engine.deckA : engine.deckB;
    const setter = deckId === 'A' ? setDeckAState : setDeckBState;
    setter((prev) => ({
      ...prev,
      loopActive: active,
      loopStart: deck.loopStart,
      loopEnd: deck.loopEnd
    }));
  };

  const handleLoopBeatsChange = (deckId, beats) => {
    engine.setLoopBeats(deckId, beats);
    const setter = deckId === 'A' ? setDeckAState : setDeckBState;
    setter((prev) => ({ ...prev, loopBeats: beats }));
  };

  const handleHotCueTrigger = (deckId, index) => {
    const cuePos = engine.jumpHotCue(deckId, index);
    const deck = deckId === 'A' ? engine.deckA : engine.deckB;
    const setter = deckId === 'A' ? setDeckAState : setDeckBState;
    setter((prev) => ({
      ...prev,
      hotCues: [...deck.hotCues]
    }));
  };

  const handleFileUpload = async (deckId, file) => {
    try {
      const updatedDeck = await engine.loadAudioFile(deckId, file);
      const peaks = precalculatePeaks(updatedDeck.buffer);
      if (deckId === 'A') {
        setPeaksA(peaks);
        setDeckAState((prev) => ({
          ...prev,
          trackTitle: updatedDeck.trackTitle,
          trackArtist: updatedDeck.trackArtist,
          duration: updatedDeck.duration,
          currentBpm: updatedDeck.currentBpm,
          pitchPercent: 0,
          hotCues: [null, null, null, null]
        }));
      } else {
        setPeaksB(peaks);
        setDeckBState((prev) => ({
          ...prev,
          trackTitle: updatedDeck.trackTitle,
          trackArtist: updatedDeck.trackArtist,
          duration: updatedDeck.duration,
          currentBpm: updatedDeck.currentBpm,
          pitchPercent: 0,
          hotCues: [null, null, null, null]
        }));
      }
    } catch (err) {
      console.error('Failed to load custom audio file:', err);
      alert('Could not decode audio file.');
    }
  };

  // ==========================================================================
  // Mixer Handlers
  // ==========================================================================
  const handleGainChange = (deckId, val) => {
    engine.setVolume(deckId, val);
    setMixerState((prev) => ({
      ...prev,
      [deckId === 'A' ? 'deckA' : 'deckB']: {
        ...prev[deckId === 'A' ? 'deckA' : 'deckB'],
        gain: val
      }
    }));
  };

  const handleEQChange = (deckId, band, val) => {
    engine.setEQ(deckId, band, val);
    const key = deckId === 'A' ? 'deckA' : 'deckB';
    const param = band === 'high' ? 'eqHigh' : band === 'mid' ? 'eqMid' : 'eqLow';
    setMixerState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [param]: val
      }
    }));
  };

  const handleKillToggle = (deckId, band) => {
    const key = deckId === 'A' ? 'deckA' : 'deckB';
    const currentlyKilled = mixerState[key].killedBands[band];
    const willKill = !currentlyKilled;

    if (willKill) {
      engine.setEQ(deckId, band, -70);
    } else {
      const param = band === 'high' ? 'eqHigh' : band === 'mid' ? 'eqMid' : 'eqLow';
      engine.setEQ(deckId, band, mixerState[key][param]);
    }

    setMixerState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        killedBands: {
          ...prev[key].killedBands,
          [band]: willKill
        }
      }
    }));
  };

  const handleFilterChange = (deckId, val) => {
    engine.setFilter(deckId, val);
    const key = deckId === 'A' ? 'deckA' : 'deckB';
    setMixerState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        filter: val
      }
    }));
  };

  const handleVolumeChange = (deckId, val) => {
    engine.setVolume(deckId, val);
    const key = deckId === 'A' ? 'deckA' : 'deckB';
    setMixerState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        volume: val
      }
    }));
  };

  const handleCrossfaderChange = (pos) => {
    engine.updateCrossfader(pos);
    setMixerState((prev) => ({ ...prev, crossfaderPos: pos }));
  };

  const handleCrossfaderCurveChange = (curve) => {
    engine.crossfaderCurve = curve;
    engine.updateCrossfader(mixerState.crossfaderPos);
    setMixerState((prev) => ({ ...prev, crossfaderCurve: curve }));
  };

  const handleFXToggle = (fxType) => {
    const now = engine.ctx.currentTime;
    if (fxType === 'echo') {
      const next = !mixerState.fxEcho;
      engine.delayDryWet.gain.cancelScheduledValues(now);
      engine.delayDryWet.gain.setTargetAtTime(next ? 0.35 : 0.0, now, 0.05);
      setMixerState((prev) => ({ ...prev, fxEcho: next }));
    } else if (fxType === 'reverb') {
      const next = !mixerState.fxReverb;
      engine.reverbDryWet.gain.cancelScheduledValues(now);
      engine.reverbDryWet.gain.setTargetAtTime(next ? 0.4 : 0.0, now, 0.05);
      setMixerState((prev) => ({ ...prev, fxReverb: next }));
    }
  };

  const handleMasterVolumeChange = (val) => {
    engine.setMasterVolume(val);
    setMasterVolume(val);
  };

  const handleRecordToggle = async () => {
    if (!isRecording) {
      const ok = engine.startRecording();
      if (ok) setIsRecording(true);
    } else {
      const blob = await engine.stopRecording();
      setIsRecording(false);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `dj-studio-pro-react-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    }
  };

  const handleTriggerSample = (sampleId) => {
    engine.playSample(sampleId);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toUpperCase();

      // Deck A
      if (key === 'Q') handlePlayToggle('A');
      else if (key === 'A') handleCueDown('A');
      else if (key === 'S') handleSync('A');
      else if (key === 'W') handleLoopToggle('A');
      else if (['1', '2', '3', '4'].includes(key)) handleHotCueTrigger('A', parseInt(key, 10) - 1);
      else if (key === 'E') handlePitchBend('A', -0.06);
      else if (key === 'R') handlePitchBend('A', 0.06);

      // Deck B
      else if (key === 'P') handlePlayToggle('B');
      else if (key === 'L') handleCueDown('B');
      else if (key === 'K') handleSync('B');
      else if (key === 'O') handleLoopToggle('B');
      else if (['7', '8', '9', '0'].includes(key)) {
        const map = { '7': 0, '8': 1, '9': 2, '0': 3 };
        handleHotCueTrigger('B', map[key]);
      } else if (key === 'I') handlePitchBend('B', -0.06);
      else if (key === 'U') handlePitchBend('B', 0.06);

      // Crossfader
      else if (e.key === 'ArrowLeft') {
        const next = Math.max(0, mixerState.crossfaderPos - 0.1);
        handleCrossfaderChange(next);
      } else if (e.key === 'ArrowRight') {
        const next = Math.min(1, mixerState.crossfaderPos + 0.1);
        handleCrossfaderChange(next);
      } else if (e.key === 'ArrowDown') {
        handleCrossfaderChange(0.5);
      }

      // Sampler
      const sampleKeys = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ','];
      const sampleIndex = sampleKeys.indexOf(key);
      if (sampleIndex !== -1) {
        handleTriggerSample(sampleIndex);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'A') handleCueUp('A');
      else if (key === 'L') handleCueUp('B');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mixerState.crossfaderPos]);

  return (
    <div className="dj-app-root">
      <Header
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
        isRecording={isRecording}
        recordingTime={recordingTime}
        onRecordToggle={handleRecordToggle}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onResetDemos={loadDemoTracks}
        masterAnalyser={engine.masterAnalyser}
      />

      <main className="dj-console">
        <Deck
          deckId="A"
          themeColor="#00f0ff"
          deckState={deckAState}
          peaks={peaksA}
          onPlayToggle={() => handlePlayToggle('A')}
          onCueDown={() => handleCueDown('A')}
          onCueUp={() => handleCueUp('A')}
          onSeek={(time) => handleSeek('A', time)}
          onScratchStart={() => handleScratchStart('A')}
          onScratchMove={(delta) => handleScratchMove('A', delta)}
          onScratchEnd={() => handleScratchEnd('A')}
          onPitchChange={(val) => handlePitchChange('A', val)}
          onPitchBend={(delta) => handlePitchBend('A', delta)}
          onPitchReset={() => handlePitchReset('A')}
          onSync={() => handleSync('A')}
          onLoopToggle={() => handleLoopToggle('A')}
          onLoopBeatsChange={(beats) => handleLoopBeatsChange('A', beats)}
          onHotCueTrigger={(idx) => handleHotCueTrigger('A', idx)}
          onFileUpload={(file) => handleFileUpload('A', file)}
          onReloadDemo={loadDemoTracks}
        />

        <Mixer
          mixerState={mixerState}
          onGainChange={handleGainChange}
          onEQChange={handleEQChange}
          onKillToggle={handleKillToggle}
          onFilterChange={handleFilterChange}
          onVolumeChange={handleVolumeChange}
          onCrossfaderChange={handleCrossfaderChange}
          onCrossfaderCurveChange={handleCrossfaderCurveChange}
          onFXToggle={handleFXToggle}
        />

        <Deck
          deckId="B"
          themeColor="#ff007f"
          deckState={deckBState}
          peaks={peaksB}
          onPlayToggle={() => handlePlayToggle('B')}
          onCueDown={() => handleCueDown('B')}
          onCueUp={() => handleCueUp('B')}
          onSeek={(time) => handleSeek('B', time)}
          onScratchStart={() => handleScratchStart('B')}
          onScratchMove={(delta) => handleScratchMove('B', delta)}
          onScratchEnd={() => handleScratchEnd('B')}
          onPitchChange={(val) => handlePitchChange('B', val)}
          onPitchBend={(delta) => handlePitchBend('B', delta)}
          onPitchReset={() => handlePitchReset('B')}
          onSync={() => handleSync('B')}
          onLoopToggle={() => handleLoopToggle('B')}
          onLoopBeatsChange={(beats) => handleLoopBeatsChange('B', beats)}
          onHotCueTrigger={(idx) => handleHotCueTrigger('B', idx)}
          onFileUpload={(file) => handleFileUpload('B', file)}
          onReloadDemo={loadDemoTracks}
        />
      </main>

      <SamplerRack onTriggerSample={handleTriggerSample} />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
