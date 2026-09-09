/**
 * DJ Studio Pro - Web Audio Engine (React Edition)
 * Modular multi-deck audio graph with procedural dance tracks, file decoding,
 * 3-band kill EQ, resonant filter sweeps, scratch physics, sampler bank, and mix recorder.
 */

export const BUILTIN_TRACKS = [
  {
    id: 'cyberpulse',
    title: 'Cyberpulse (Tech House)',
    artist: 'DJ Studio Pro',
    genre: 'Tech House',
    bpm: 124,
    bars: 32
  },
  {
    id: 'neondrift',
    title: 'Neon Drift (Electro Club)',
    artist: 'DJ Studio Pro',
    genre: 'Electro Club',
    bpm: 128,
    bars: 32
  },
  {
    id: 'mumbainights',
    title: 'Mumbai Nights (Desi Club Drop)',
    artist: 'DJ Studio Pro',
    genre: 'Bollywood EDM',
    bpm: 126,
    bars: 32
  },
  {
    id: 'sunsetgoa',
    title: 'Sunset at Goa (Melodic Deep House)',
    artist: 'DJ Studio Pro',
    genre: 'Deep House',
    bpm: 122,
    bars: 32
  },
  {
    id: 'retrocyber',
    title: 'Midnight Arcade (80s Synthwave)',
    artist: 'DJ Studio Pro',
    genre: 'Synthwave',
    bpm: 120,
    bars: 32
  },
  {
    id: 'tokyotrap',
    title: 'Tokyo Drift (Future 808 Trap)',
    artist: 'DJ Studio Pro',
    genre: 'Future Trap',
    bpm: 130,
    bars: 32
  }
];

export class DJAudioEngine {
  constructor() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Output Chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    // Master Limiter / Compressor
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.002, this.ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime);

    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);

    // Master Analyser for global visualizer
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterLimiter.connect(this.masterAnalyser);

    // Recording Destination
    this.recordingDest = this.ctx.createMediaStreamDestination();
    this.masterLimiter.connect(this.recordingDest);
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;

    // Crossfader
    this.crossfaderCurve = 'smooth';
    this.crossfaderPosition = 0.5;

    // Decks
    this.deckA = this.createDeck('A', '#00f0ff');
    this.deckB = this.createDeck('B', '#ff007f');

    // Master FX
    this.initMasterFX();

    // Sampler bank gain
    this.samplerGain = this.ctx.createGain();
    this.samplerGain.gain.value = 0.85;
    this.samplerGain.connect(this.masterGain);

    this.updateCrossfader(0.5);
  }

  ensureContext() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createDeck(deckId, themeColor) {
    const deck = {
      id: deckId,
      color: themeColor,
      buffer: null,
      reverseBuffer: null,
      source: null,
      isPlaying: false,
      playbackRate: 1.0,
      pitchPercent: 0,
      tempoRange: 8,
      originalBpm: 124,
      currentBpm: 124,
      startTime: 0,
      pauseOffset: 0,
      duration: 0,
      trackTitle: deckId === 'A' ? 'Cyberpulse (Tech House)' : 'Neon Drift (Electro Club)',
      trackArtist: 'DJ Studio Pro',
      cuePoint: 0,
      hotCues: [null, null, null, null],
      loopActive: false,
      loopStart: 0,
      loopEnd: 0,
      loopBeats: 4,

      // DSP Nodes
      gainNode: this.ctx.createGain(),
      crossfaderGain: this.ctx.createGain(),
      eqLow: this.ctx.createBiquadFilter(),
      eqMid: this.ctx.createBiquadFilter(),
      eqHigh: this.ctx.createBiquadFilter(),
      filter: this.ctx.createBiquadFilter(),
      analyser: this.ctx.createAnalyser(),

      // Scratching state
      isScratching: false,
      scratchWasPlaying: false,
      brakeTimeout: null
    };

    // 3-Band EQ config
    deck.eqLow.type = 'lowshelf';
    deck.eqLow.frequency.value = 250;
    deck.eqLow.gain.value = 0;

    deck.eqMid.type = 'peaking';
    deck.eqMid.frequency.value = 1200;
    deck.eqMid.Q.value = 1.0;
    deck.eqMid.gain.value = 0;

    deck.eqHigh.type = 'highshelf';
    deck.eqHigh.frequency.value = 3500;
    deck.eqHigh.gain.value = 0;

    // Dual sound color filter
    deck.filter.type = 'allpass';
    deck.filter.frequency.value = 1000;
    deck.filter.Q.value = 3.0;

    // Analyser
    deck.analyser.fftSize = 512;

    // Routing
    deck.eqLow.connect(deck.eqMid);
    deck.eqMid.connect(deck.eqHigh);
    deck.eqHigh.connect(deck.filter);
    deck.filter.connect(deck.gainNode);
    deck.gainNode.connect(deck.crossfaderGain);
    deck.crossfaderGain.connect(this.masterGain);
    deck.gainNode.connect(deck.analyser);

    return deck;
  }

  initMasterFX() {
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.375;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.4;
    this.delayDryWet = this.ctx.createGain();
    this.delayDryWet.gain.value = 0.0;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayDryWet);
    this.delayDryWet.connect(this.masterGain);

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createSyntheticImpulse(2.5, 2.0);
    this.reverbDryWet = this.ctx.createGain();
    this.reverbDryWet.gain.value = 0.0;
    this.reverbNode.connect(this.reverbDryWet);
    this.reverbDryWet.connect(this.masterGain);
  }

  createSyntheticImpulse(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  updateCrossfader(pos) {
    this.crossfaderPosition = Math.max(0, Math.min(1, pos));
    const x = this.crossfaderPosition;
    let gainA = 1.0;
    let gainB = 1.0;

    if (this.crossfaderCurve === 'scratch') {
      gainA = x > 0.92 ? (1 - x) / 0.08 : 1.0;
      gainB = x < 0.08 ? x / 0.08 : 1.0;
    } else if (this.crossfaderCurve === 'linear') {
      gainA = 1 - x;
      gainB = x;
    } else {
      gainA = Math.cos(x * 0.5 * Math.PI);
      gainB = Math.sin(x * 0.5 * Math.PI);
    }

    const now = this.ctx.currentTime;
    this.deckA.crossfaderGain.gain.cancelScheduledValues(now);
    this.deckB.crossfaderGain.gain.cancelScheduledValues(now);
    this.deckA.crossfaderGain.gain.setValueAtTime(gainA, now);
    this.deckB.crossfaderGain.gain.setValueAtTime(gainB, now);
  }

  setEQ(deckId, band, value) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const gainNode = band === 'low' ? deck.eqLow : band === 'mid' ? deck.eqMid : deck.eqHigh;
    const now = this.ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(value, now, 0.02);
  }

  setFilter(deckId, value) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const now = this.ctx.currentTime;
    const val = parseFloat(value);
    deck.filter.frequency.cancelScheduledValues(now);

    if (Math.abs(val) < 3) {
      deck.filter.type = 'allpass';
      deck.filter.frequency.setValueAtTime(1000, now);
    } else if (val < 0) {
      deck.filter.type = 'lowpass';
      const normalized = (val + 100) / 100;
      const freq = 120 * Math.pow(20000 / 120, normalized);
      deck.filter.frequency.setTargetAtTime(Math.max(60, freq), now, 0.02);
      deck.filter.Q.setTargetAtTime(3.5, now, 0.02);
    } else {
      deck.filter.type = 'highpass';
      const normalized = val / 100;
      const freq = 30 * Math.pow(8500 / 30, normalized);
      deck.filter.frequency.setTargetAtTime(freq, now, 0.02);
      deck.filter.Q.setTargetAtTime(3.5, now, 0.02);
    }
  }

  setVolume(deckId, val) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const now = this.ctx.currentTime;
    deck.gainNode.gain.cancelScheduledValues(now);
    deck.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1.5, val)), now, 0.02);
  }

  setMasterVolume(val) {
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.2, val)), now, 0.02);
  }

  setPitch(deckId, percent) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.pitchPercent = percent;
    const factor = 1.0 + (percent / 100);
    deck.playbackRate = factor;
    deck.currentBpm = Math.round(deck.originalBpm * factor);

    if (deck.source && deck.isPlaying && !deck.isScratching) {
      const now = this.ctx.currentTime;
      deck.source.playbackRate.cancelScheduledValues(now);
      deck.source.playbackRate.setTargetAtTime(deck.playbackRate, now, 0.03);
    }
  }

  pitchBend(deckId, delta) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.source || !deck.isPlaying) return;
    const now = this.ctx.currentTime;
    const target = deck.playbackRate * (1.0 + delta);
    deck.source.playbackRate.cancelScheduledValues(now);
    deck.source.playbackRate.setValueAtTime(target, now);
    deck.source.playbackRate.setTargetAtTime(deck.playbackRate, now + 0.15, 0.2);
  }

  syncDeck(deckId) {
    const targetDeck = deckId === 'A' ? this.deckA : this.deckB;
    const masterDeck = deckId === 'A' ? this.deckB : this.deckA;
    if (!targetDeck.originalBpm || !masterDeck.originalBpm) return 0;

    const targetBpm = masterDeck.currentBpm;
    const requiredRate = targetBpm / targetDeck.originalBpm;
    const requiredPercent = (requiredRate - 1.0) * 100;
    targetDeck.pitchPercent = Math.max(-targetDeck.tempoRange, Math.min(targetDeck.tempoRange, requiredPercent));
    this.setPitch(deckId, targetDeck.pitchPercent);

    if (targetDeck.isPlaying && masterDeck.isPlaying) {
      const masterBeatDuration = 60 / masterDeck.currentBpm;
      const targetBeatDuration = 60 / targetDeck.currentBpm;
      const masterCurrentPos = this.getDeckCurrentTime(masterDeck.id);
      const targetCurrentPos = this.getDeckCurrentTime(targetDeck.id);

      const masterPhase = (masterCurrentPos % masterBeatDuration) / masterBeatDuration;
      const targetPhase = (targetCurrentPos % targetBeatDuration) / targetBeatDuration;
      const phaseDiff = (masterPhase - targetPhase) * targetBeatDuration;
      this.seek(deckId, targetCurrentPos + phaseDiff);
    }
    return targetDeck.pitchPercent;
  }

  getDeckCurrentTime(deckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer) return 0;
    if (!deck.isPlaying) return deck.pauseOffset;

    const elapsed = (this.ctx.currentTime - deck.startTime) * deck.playbackRate;
    let pos = (deck.pauseOffset + elapsed) % deck.duration;
    if (pos < 0) pos += deck.duration;

    if (deck.loopActive && deck.loopEnd > deck.loopStart) {
      if (pos >= deck.loopEnd) {
        pos = deck.loopStart + ((pos - deck.loopStart) % (deck.loopEnd - deck.loopStart));
      }
    }
    return pos;
  }

  play(deckId) {
    this.ensureContext();
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer || deck.isPlaying) return;

    if (deck.brakeTimeout) {
      clearTimeout(deck.brakeTimeout);
      deck.brakeTimeout = null;
    }
    this.startSourceAt(deck, deck.pauseOffset);
  }

  pause(deckId, vinylBrake = true) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.isPlaying || !deck.source) return;

    if (vinylBrake) {
      const now = this.ctx.currentTime;
      deck.source.playbackRate.cancelScheduledValues(now);
      deck.source.playbackRate.setValueAtTime(deck.playbackRate, now);
      deck.source.playbackRate.exponentialRampToValueAtTime(0.01, now + 0.45);

      deck.brakeTimeout = setTimeout(() => {
        deck.pauseOffset = this.getDeckCurrentTime(deckId);
        this.stopSource(deck);
        deck.brakeTimeout = null;
      }, 450);
    } else {
      deck.pauseOffset = this.getDeckCurrentTime(deckId);
      this.stopSource(deck);
    }
  }

  cue(deckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (deck.isPlaying) {
      this.pause(deckId, false);
      deck.pauseOffset = deck.cuePoint;
    } else {
      deck.cuePoint = deck.pauseOffset;
      this.play(deckId);
    }
  }

  cueRelease(deckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (deck.isPlaying) {
      this.stopSource(deck);
      deck.pauseOffset = deck.cuePoint;
    }
  }

  setHotCue(deckId, index) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const current = this.getDeckCurrentTime(deckId);
    deck.hotCues[index] = current;
    return current;
  }

  jumpHotCue(deckId, index) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    let cuePos = deck.hotCues[index];
    if (cuePos === null || cuePos === undefined) {
      cuePos = this.setHotCue(deckId, index);
      return cuePos;
    }
    this.seek(deckId, cuePos);
    if (!deck.isPlaying) {
      this.play(deckId);
    }
    return cuePos;
  }

  setLoopBeats(deckId, beats) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.loopBeats = beats;
    if (deck.loopActive) {
      const beatSec = 60 / deck.currentBpm;
      deck.loopEnd = deck.loopStart + (beats * beatSec);
    }
  }

  toggleLoop(deckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.loopActive = !deck.loopActive;
    if (deck.loopActive) {
      const current = this.getDeckCurrentTime(deckId);
      const beatSec = 60 / deck.currentBpm;
      deck.loopStart = Math.floor(current / beatSec) * beatSec;
      deck.loopEnd = deck.loopStart + (deck.loopBeats * beatSec);
    }
    return deck.loopActive;
  }

  seek(deckId, targetTime) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer) return;
    const wasPlaying = deck.isPlaying;
    if (wasPlaying) {
      this.stopSource(deck);
    }
    deck.pauseOffset = Math.max(0, Math.min(deck.duration - 0.05, targetTime));
    if (wasPlaying) {
      this.startSourceAt(deck, deck.pauseOffset);
    }
  }

  startSourceAt(deck, offset) {
    if (deck.source) {
      try { deck.source.stop(); } catch (e) {}
      deck.source.disconnect();
    }

    deck.source = this.ctx.createBufferSource();
    deck.source.buffer = deck.buffer;
    deck.source.loop = true;
    deck.source.loopStart = 0;
    deck.source.loopEnd = deck.duration;
    deck.source.playbackRate.value = deck.playbackRate;

    deck.source.connect(deck.eqLow);
    deck.startTime = this.ctx.currentTime;
    deck.pauseOffset = offset % deck.duration;

    try {
      deck.source.start(0, deck.pauseOffset);
      deck.isPlaying = true;
    } catch (err) {
      console.warn('Playback error:', err);
    }
  }

  stopSource(deck) {
    if (deck.source) {
      try {
        deck.source.stop();
        deck.source.disconnect();
      } catch (e) {}
      deck.source = null;
    }
    deck.isPlaying = false;
  }

  // Turntable Scratch Engine
  startScratch(deckId) {
    this.ensureContext();
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.buffer) return;
    deck.isScratching = true;
    deck.scratchWasPlaying = deck.isPlaying;
    deck.pauseOffset = this.getDeckCurrentTime(deckId);
    this.stopSource(deck);
  }

  scratchMove(deckId, deltaAngle) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.isScratching || !deck.buffer) return;

    const secondsPerRadian = 1.8 / (2 * Math.PI);
    const scrubDelta = deltaAngle * secondsPerRadian * 1.5;

    let targetTime = deck.pauseOffset + scrubDelta;
    if (targetTime < 0) targetTime += deck.duration;
    targetTime = targetTime % deck.duration;
    deck.pauseOffset = targetTime;

    this.playScratchGrain(deck, scrubDelta);
  }

  playScratchGrain(deck, scrubDelta) {
    if (Math.abs(scrubDelta) < 0.001) return;
    const now = this.ctx.currentTime;
    const grainSource = this.ctx.createBufferSource();
    const isForward = scrubDelta >= 0;

    grainSource.buffer = isForward ? deck.buffer : (deck.reverseBuffer || deck.buffer);
    const speed = Math.min(3.5, Math.max(0.2, Math.abs(scrubDelta) * 45));
    grainSource.playbackRate.setValueAtTime(speed, now);

    const scratchFilter = this.ctx.createBiquadFilter();
    scratchFilter.type = 'bandpass';
    scratchFilter.frequency.setValueAtTime(1400 * Math.sqrt(speed), now);
    scratchFilter.Q.setValueAtTime(2.0, now);

    const grainGain = this.ctx.createGain();
    const duration = Math.min(0.12, Math.max(0.04, Math.abs(scrubDelta) * 2.5));
    grainGain.gain.setValueAtTime(0.8, now);
    grainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    grainSource.connect(scratchFilter);
    scratchFilter.connect(grainGain);
    grainGain.connect(deck.eqLow);

    let offset = deck.pauseOffset;
    if (!isForward && deck.reverseBuffer) {
      offset = deck.duration - offset;
    }
    offset = Math.max(0, Math.min(deck.duration - duration - 0.05, offset));

    try {
      grainSource.start(now, offset, duration);
    } catch (e) {}
  }

  stopScratch(deckId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck.isScratching) return;
    deck.isScratching = false;

    if (deck.scratchWasPlaying) {
      this.startSourceAt(deck, deck.pauseOffset);
    }
  }

  // 8-Pad DJ Sampler Sounds
  playSample(sampleIndex) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    switch (sampleIndex) {
      case 0: this.synthAirhorn(now); break;
      case 1: this.synthLaser(now); break;
      case 2: this.synthSubDrop(now); break;
      case 3: this.synthSiren(now); break;
      case 4: this.synthScratchChirp(now); break;
      case 5: this.synthVocalChant(now); break;
      case 6: this.synthClubClap(now); break;
      case 7: this.synthReverseCymbal(now); break;
      default: break;
    }
  }

  synthAirhorn(startTime) {
    const delays = [0.0, 0.16, 0.32];
    const hornDuration = 0.13;

    delays.forEach((delayTime, idx) => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc3.type = 'square';

      const baseFreq = 466.16;
      osc1.frequency.setValueAtTime(baseFreq, startTime + delayTime);
      osc2.frequency.setValueAtTime(baseFreq * 1.008, startTime + delayTime);
      osc3.frequency.setValueAtTime(baseFreq * 0.5, startTime + delayTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, startTime + delayTime);
      filter.Q.setValueAtTime(3.0, startTime + delayTime);

      gain.gain.setValueAtTime(0, startTime + delayTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + delayTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + delayTime + hornDuration + (idx === 2 ? 0.25 : 0.05));

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(this.samplerGain);

      osc1.start(startTime + delayTime);
      osc2.start(startTime + delayTime);
      osc3.start(startTime + delayTime);
      osc1.stop(startTime + delayTime + hornDuration + 0.3);
      osc2.stop(startTime + delayTime + hornDuration + 0.3);
      osc3.stop(startTime + delayTime + hornDuration + 0.3);
    });
  }

  synthLaser(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800, startTime);
    osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.28);
    gain.gain.setValueAtTime(0.6, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gain);
    gain.connect(this.samplerGain);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  }

  synthSubDrop(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, startTime);
    osc.frequency.exponentialRampToValueAtTime(32, startTime + 1.2);
    gain.gain.setValueAtTime(0.9, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);
    osc.connect(gain);
    gain.connect(this.samplerGain);
    osc.start(startTime);
    osc.stop(startTime + 1.4);
  }

  synthSiren(startTime) {
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, startTime);
    lfo.frequency.setValueAtTime(3.5, startTime);
    lfoGain.gain.setValueAtTime(250, startTime);
    lfo.connect(osc.frequency);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.45, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
    osc.connect(gain);
    gain.connect(this.samplerGain);
    lfo.start(startTime);
    osc.start(startTime);
    lfo.stop(startTime + 1.8);
    osc.stop(startTime + 1.8);
  }

  synthScratchChirp(startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, startTime);
    osc.frequency.exponentialRampToValueAtTime(1800, startTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.18);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(4.0, startTime);
    gain.gain.setValueAtTime(0.7, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.samplerGain);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }

  synthVocalChant(startTime) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, startTime);
    osc.frequency.exponentialRampToValueAtTime(170, startTime + 0.35);

    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(800, startTime);
    f1.Q.setValueAtTime(6.0, startTime);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1800, startTime);
    f2.Q.setValueAtTime(5.0, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(f1);
    f1.connect(gain);
    osc.connect(f2);
    f2.connect(gain);
    gain.connect(this.samplerGain);

    osc.start(startTime);
    osc.stop(startTime + 0.35);
  }

  synthClubClap(startTime) {
    for (let i = 0; i < 3; i++) {
      const burstTime = startTime + i * 0.012;
      const length = Math.floor(this.ctx.sampleRate * (i === 2 ? 0.4 : 0.03));
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < length; j++) data[j] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, burstTime);
      filter.Q.setValueAtTime(2.0, burstTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(i === 2 ? 0.7 : 0.3, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + (i === 2 ? 0.4 : 0.03));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.samplerGain);

      noise.start(burstTime);
      noise.stop(burstTime + 0.45);
    }
  }

  synthReverseCymbal(startTime) {
    const duration = 1.4;
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, startTime);
    filter.frequency.exponentialRampToValueAtTime(8000, startTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.exponentialRampToValueAtTime(0.7, startTime + duration - 0.02);
    gain.gain.setValueAtTime(0.0001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.samplerGain);

    noise.start(startTime);
    noise.stop(startTime + duration + 0.05);
  }

  // Mix Recording
  startRecording() {
    if (this.isRecording) return false;
    this.ensureContext();
    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.recordingDest.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start(100);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Recording initialization error:', err);
      return false;
    }
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        resolve(null);
        return;
      }
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  // Load Custom File
  async loadAudioFile(deckId, file) {
    this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const deck = deckId === 'A' ? this.deckA : this.deckB;
    this.pause(deckId, false);

    deck.buffer = audioBuffer;
    deck.reverseBuffer = this.createReverseBuffer(audioBuffer);
    deck.duration = audioBuffer.duration;
    deck.pauseOffset = 0;
    deck.cuePoint = 0;
    deck.hotCues = [null, null, null, null];
    deck.trackTitle = file.name.replace(/\.[^/.]+$/, '');
    deck.trackArtist = 'Custom Track';
    deck.originalBpm = 126;
    deck.currentBpm = 126;

    return deck;
  }

  createReverseBuffer(buffer) {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const revBuffer = this.ctx.createBuffer(numChannels, length, sampleRate);

    for (let c = 0; c < numChannels; c++) {
      const src = buffer.getChannelData(c);
      const dest = revBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        dest[i] = src[length - 1 - i];
      }
    }
    return revBuffer;
  }

  generateDemoTracks() {
    this.loadBuiltinTrack('A', 'cyberpulse');
    this.loadBuiltinTrack('B', 'neondrift');
  }

  loadBuiltinTrack(deckId, trackId) {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const track = BUILTIN_TRACKS.find(t => t.id === trackId) || BUILTIN_TRACKS[0];
    const sampleRate = this.ctx.sampleRate;
    const bars = track.bars || 32;
    const duration = (bars * 4 * 60) / track.bpm;
    const buffer = this.ctx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);

    if (track.id === 'cyberpulse') {
      this.synthesizeTechHouseTrack(buffer, track.bpm, bars);
    } else if (track.id === 'neondrift') {
      this.synthesizeElectroTrack(buffer, track.bpm, bars);
    } else if (track.id === 'mumbainights') {
      this.synthesizeBollywoodClubTrack(buffer, track.bpm, bars);
    } else if (track.id === 'sunsetgoa') {
      this.synthesizeGoaDeepHouseTrack(buffer, track.bpm, bars);
    } else if (track.id === 'retrocyber') {
      this.synthesizeSynthwaveRetroTrack(buffer, track.bpm, bars);
    } else if (track.id === 'tokyotrap') {
      this.synthesizeFutureTrapTrack(buffer, track.bpm, bars);
    } else {
      this.synthesizeTechHouseTrack(buffer, track.bpm, bars);
    }

    deck.buffer = buffer;
    deck.reverseBuffer = this.createReverseBuffer(buffer);
    deck.duration = duration;
    deck.originalBpm = track.bpm;
    deck.currentBpm = track.bpm;
    deck.trackTitle = track.title;
    deck.trackArtist = track.artist;
    deck.trackId = track.id;
    deck.pauseOffset = 0;
    deck.currentTime = 0;
    deck.pitchPercent = 0;
    deck.playbackRate = 1.0;
    deck.hotCues = [null, null, null, null];
    deck.loopActive = false;

    return {
      deckId,
      track,
      duration,
      bpm: track.bpm,
      buffer
    };
  }

  synthesizeTechHouseTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    const chords = [
      [174.61, 207.65, 261.63],
      [138.59, 174.61, 207.65],
      [116.54, 138.59, 174.61],
      [130.81, 164.81, 196.00]
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const chord = chords[Math.floor(bar / 4) % chords.length];

      for (let beat = 0; beat < 4; beat++) {
        const kickStart = Math.floor(barStart + beat * beatSamples);
        const kickLen = Math.floor(0.35 * sampleRate);
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 135 * Math.exp(-t * 32) + 42;
          const phase = 2 * Math.PI * freq * t;
          const click = (i < 80) ? (Math.random() * 2 - 1) * 0.4 : 0;
          const env = Math.exp(-t * 9.5);
          const val = (Math.sin(phase) * 0.85 + click) * env;
          left[kickStart + i] += val * 0.7;
          right[kickStart + i] += val * 0.7;
        }

        const hatStart = Math.floor(kickStart + beatSamples * 0.5);
        const hatLen = Math.floor(0.18 * sampleRate);
        for (let i = 0; i < hatLen && hatStart + i < left.length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1);
          const env = Math.exp(-t * 24);
          const val = noise * env * 0.28;
          left[hatStart + i] += val * 0.85;
          right[hatStart + i] += val * 0.7;
        }

        if (beat === 1 || beat === 3) {
          const clapStart = kickStart;
          const clapLen = Math.floor(0.25 * sampleRate);
          for (let i = 0; i < clapLen && clapStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1);
            const env = Math.exp(-t * 16);
            const val = noise * env * 0.35;
            left[clapStart + i] += val * 0.8;
            right[clapStart + i] += val * 0.8;
          }
        }
      }

      const sixteenth = beatSamples / 4;
      const bassPattern = [0, 0, 1, 0,  1, 0, 0, 1,  0, 1, 0, 1,  1, 0, 1, 0];
      const rootFreq = chord[0] * 0.5;

      for (let s = 0; s < 16; s++) {
        if (bassPattern[s]) {
          const bassStart = Math.floor(barStart + s * sixteenth);
          const bassLen = Math.floor(0.12 * sampleRate);
          for (let i = 0; i < bassLen && bassStart + i < left.length; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 14);
            const val = Math.sin(2 * Math.PI * rootFreq * t) * env * 0.55;
            left[bassStart + i] += val;
            right[bassStart + i] += val;
          }
        }
      }

      const stabOffsets = [sixteenth * 3, sixteenth * 7, sixteenth * 11];
      stabOffsets.forEach(offset => {
        const stabStart = Math.floor(barStart + offset);
        const stabLen = Math.floor(0.22 * sampleRate);
        for (let i = 0; i < stabLen && stabStart + i < left.length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 12);
          let sumL = 0;
          let sumR = 0;
          chord.forEach((freq, fIndex) => {
            const saw = (2 * ((freq * t) % 1) - 1);
            sumL += saw * (fIndex === 1 ? 0.4 : 0.7);
            sumR += saw * (fIndex === 2 ? 0.4 : 0.7);
          });
          left[stabStart + i] += sumL * env * 0.18;
          right[stabStart + i] += sumR * env * 0.18;
        }
      });
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  synthesizeElectroTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    const roots = [110.0, 87.31, 130.81, 98.0];
    const arpeggios = [
      [220, 261.63, 329.63, 440, 329.63, 261.63],
      [174.61, 220, 261.63, 349.23, 261.63, 220],
      [261.63, 329.63, 392, 523.25, 392, 329.63],
      [196, 246.94, 293.66, 392, 293.66, 246.94]
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const root = roots[Math.floor(bar / 4) % roots.length];
      const arpNotes = arpeggios[Math.floor(bar / 4) % arpeggios.length];

      for (let beat = 0; beat < 4; beat++) {
        const kickStart = Math.floor(barStart + beat * beatSamples);
        const kickLen = Math.floor(0.4 * sampleRate);
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 160 * Math.exp(-t * 28) + 48;
          const phase = 2 * Math.PI * freq * t;
          const env = Math.exp(-t * 8.0);
          const click = (i < 60) ? 0.5 : 0;
          const val = (Math.sin(phase) * 0.8 + click) * env;
          left[kickStart + i] += val * 0.72;
          right[kickStart + i] += val * 0.72;
        }

        if (beat === 1 || beat === 3) {
          const snareStart = kickStart;
          const snareLen = Math.floor(0.28 * sampleRate);
          for (let i = 0; i < snareLen && snareStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14);
            const body = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 22);
            left[snareStart + i] += (noise * 0.45 + body * 0.25);
            right[snareStart + i] += (noise * 0.45 + body * 0.25);
          }
        }

        const sixteenth = beatSamples / 4;
        for (let s = 0; s < 4; s++) {
          const hatStart = Math.floor(kickStart + s * sixteenth);
          const hatLen = Math.floor(0.06 * sampleRate);
          const accent = (s === 2) ? 0.35 : 0.16;
          for (let i = 0; i < hatLen && hatStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 50);
            left[hatStart + i] += noise * accent * 0.8;
            right[hatStart + i] += noise * accent;
          }
        }
      }

      const eighth = beatSamples / 2;
      for (let e = 0; e < 8; e++) {
        const bassStart = Math.floor(barStart + e * eighth);
        const bassLen = Math.floor(0.18 * sampleRate);
        const bassFreq = root * (e === 6 ? 1.5 : 1.0);
        for (let i = 0; i < bassLen && bassStart + i < left.length; i++) {
          const t = i / sampleRate;
          const saw = (2 * ((bassFreq * t) % 1) - 1);
          const sub = Math.sin(2 * Math.PI * (bassFreq * 0.5) * t);
          const env = Math.exp(-t * 11);
          const val = (saw * 0.45 + sub * 0.55) * env;
          left[bassStart + i] += val * 0.55;
          right[bassStart + i] += val * 0.55;
        }
      }

      const sixteenth = beatSamples / 4;
      for (let s = 0; s < 16; s++) {
        const arpStart = Math.floor(barStart + s * sixteenth);
        const arpLen = Math.floor(0.14 * sampleRate);
        const noteFreq = arpNotes[s % arpNotes.length];
        const pan = Math.sin(s * 0.7);
        for (let i = 0; i < arpLen && arpStart + i < left.length; i++) {
          const t = i / sampleRate;
          const square = Math.sin(2 * Math.PI * noteFreq * t) > 0 ? 1 : -1;
          const sine = Math.sin(2 * Math.PI * noteFreq * 2 * t);
          const env = Math.exp(-t * 18);
          const val = (square * 0.3 + sine * 0.4) * env * 0.22;
          left[arpStart + i] += val * (1 - pan * 0.3);
          right[arpStart + i] += val * (1 + pan * 0.3);
        }
      }
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  synthesizeBollywoodClubTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    // D minor pentatonic Indian EDM hook: D4, F4, G4, A4, C5, D5
    const hookNotes = [293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 293.66, 440.0];
    const bassNotes = [146.83, 116.54, 130.81, 146.83]; // D3, Bb2, C3, D3

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const bassRoot = bassNotes[Math.floor(bar / 4) % bassNotes.length];

      for (let beat = 0; beat < 4; beat++) {
        const kickStart = Math.floor(barStart + beat * beatSamples);
        const kickLen = Math.floor(0.38 * sampleRate);

        // 1. Punchy club kick
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 145 * Math.exp(-t * 30) + 45;
          const phase = 2 * Math.PI * freq * t;
          const env = Math.exp(-t * 9.0);
          const click = (i < 65) ? 0.45 : 0;
          const val = (Math.sin(phase) * 0.85 + click) * env;
          left[kickStart + i] += val * 0.75;
          right[kickStart + i] += val * 0.75;
        }

        // 2. Dhol rim / high slap offbeat
        const dholStart = Math.floor(kickStart + beatSamples * 0.5);
        const dholLen = Math.floor(0.12 * sampleRate);
        for (let i = 0; i < dholLen && dholStart + i < left.length; i++) {
          const t = i / sampleRate;
          const slapFreq = 380 * Math.exp(-t * 40) + 180;
          const tone = Math.sin(2 * Math.PI * slapFreq * t) * Math.exp(-t * 22);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 35);
          const val = (tone * 0.6 + noise * 0.4) * 0.35;
          left[dholStart + i] += val * 0.9;
          right[dholStart + i] += val * 0.7;
        }

        // 3. Indian festival claps on beats 1 & 3
        if (beat === 1 || beat === 3) {
          const clapStart = kickStart;
          const clapLen = Math.floor(0.24 * sampleRate);
          for (let i = 0; i < clapLen && clapStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16);
            left[clapStart + i] += noise * 0.38;
            right[clapStart + i] += noise * 0.38;
          }
        }
      }

      // 4. Groovy 16th-note sub bass
      const sixteenth = beatSamples / 4;
      const bassPattern = [1, 0, 1, 0,  0, 1, 0, 1,  1, 0, 1, 0,  0, 1, 1, 0];
      for (let s = 0; s < 16; s++) {
        if (bassPattern[s]) {
          const bassStart = Math.floor(barStart + s * sixteenth);
          const bassLen = Math.floor(0.14 * sampleRate);
          for (let i = 0; i < bassLen && bassStart + i < left.length; i++) {
            const t = i / sampleRate;
            const saw = (2 * ((bassRoot * t) % 1) - 1);
            const sine = Math.sin(2 * Math.PI * (bassRoot * 0.5) * t);
            const env = Math.exp(-t * 12);
            const val = (saw * 0.4 + sine * 0.6) * env * 0.5;
            left[bassStart + i] += val;
            right[bassStart + i] += val;
          }
        }
      }

      // 5. Bollywood Synth Brass Hook
      for (let s = 0; s < 8; s++) {
        const leadStart = Math.floor(barStart + s * (beatSamples * 0.5));
        const leadLen = Math.floor(0.26 * sampleRate);
        const note = hookNotes[(bar * 2 + s) % hookNotes.length];
        for (let i = 0; i < leadLen && leadStart + i < left.length; i++) {
          const t = i / sampleRate;
          const saw1 = (2 * ((note * t) % 1) - 1);
          const saw2 = (2 * (((note * 1.006) * t) % 1) - 1);
          const env = Math.exp(-t * 10);
          const val = (saw1 * 0.5 + saw2 * 0.5) * env * 0.22;
          left[leadStart + i] += val * 0.85;
          right[leadStart + i] += val * 0.95;
        }
      }
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  synthesizeGoaDeepHouseTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    // Sunset chords: Am9, Fmaj7, Cmaj7, G6
    const chords = [
      [220.0, 261.63, 329.63, 493.88], // Am9
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [196.0, 246.94, 293.66, 392.0]   // G6
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const chord = chords[bar % chords.length];
      const bassRoot = chord[0] * 0.5;

      for (let beat = 0; beat < 4; beat++) {
        const kickStart = Math.floor(barStart + beat * beatSamples);
        const kickLen = Math.floor(0.36 * sampleRate);

        // Deep warm kick
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 120 * Math.exp(-t * 26) + 40;
          const val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8.0);
          left[kickStart + i] += val * 0.68;
          right[kickStart + i] += val * 0.68;
        }

        // Shakers / soft hats
        const sixteenth = beatSamples / 4;
        for (let s = 0; s < 4; s++) {
          const hatStart = Math.floor(kickStart + s * sixteenth);
          const hatLen = Math.floor(0.08 * sampleRate);
          const vol = (s === 2) ? 0.25 : 0.12;
          for (let i = 0; i < hatLen && hatStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40);
            left[hatStart + i] += noise * vol;
            right[hatStart + i] += noise * vol * 0.8;
          }
        }
      }

      // Warm rolling sub-bass
      const eighth = beatSamples / 2;
      for (let e = 0; e < 8; e++) {
        const bassStart = Math.floor(barStart + e * eighth);
        const bassLen = Math.floor(0.28 * sampleRate);
        for (let i = 0; i < bassLen && bassStart + i < left.length; i++) {
          const t = i / sampleRate;
          const sine = Math.sin(2 * Math.PI * bassRoot * t);
          const val = sine * Math.exp(-t * 6.5) * 0.55;
          left[bassStart + i] += val;
          right[bassStart + i] += val;
        }
      }

      // Plucked acoustic guitar/chime chords
      const sixteenth = beatSamples / 4;
      const pluckPattern = [1, 0, 0, 1,  0, 1, 0, 0,  1, 0, 1, 0,  0, 1, 0, 1];
      for (let s = 0; s < 16; s++) {
        if (pluckPattern[s]) {
          const pluckStart = Math.floor(barStart + s * sixteenth);
          const pluckLen = Math.floor(0.35 * sampleRate);
          for (let i = 0; i < pluckLen && pluckStart + i < left.length; i++) {
            const t = i / sampleRate;
            let sumL = 0;
            let sumR = 0;
            chord.forEach((freq, idx) => {
              const sine = Math.sin(2 * Math.PI * freq * t);
              const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.4;
              const env = Math.exp(-t * 14);
              const v = (sine + harmonic) * env;
              sumL += v * (idx % 2 === 0 ? 0.7 : 0.4);
              sumR += v * (idx % 2 === 1 ? 0.7 : 0.4);
            });
            left[pluckStart + i] += sumL * 0.16;
            right[pluckStart + i] += sumR * 0.16;
          }
        }
      }
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  synthesizeSynthwaveRetroTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    const roots = [110.0, 98.0, 87.31, 98.0]; // A, G, F, G

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const root = roots[bar % roots.length];

      for (let beat = 0; beat < 4; beat++) {
        const kickStart = Math.floor(barStart + beat * beatSamples);
        const kickLen = Math.floor(0.35 * sampleRate);

        // 80s punchy kick
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 160 * Math.exp(-t * 26) + 50;
          const val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 9);
          left[kickStart + i] += val * 0.7;
          right[kickStart + i] += val * 0.7;
        }

        // Gated 80s Snare on 1 & 3
        if (beat === 1 || beat === 3) {
          const snareStart = kickStart;
          const snareLen = Math.floor(0.28 * sampleRate);
          for (let i = 0; i < snareLen && snareStart + i < left.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 11);
            const tone = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 16);
            left[snareStart + i] += (noise * 0.5 + tone * 0.3);
            right[snareStart + i] += (noise * 0.5 + tone * 0.3);
          }
        }
      }

      // Rolling 16th-note Giorgio Moroder synth bass
      const sixteenth = beatSamples / 4;
      for (let s = 0; s < 16; s++) {
        const bassStart = Math.floor(barStart + s * sixteenth);
        const bassLen = Math.floor(0.12 * sampleRate);
        const noteFreq = (s % 2 === 0) ? root : root * 2;
        for (let i = 0; i < bassLen && bassStart + i < left.length; i++) {
          const t = i / sampleRate;
          const saw = (2 * ((noteFreq * t) % 1) - 1);
          const val = saw * Math.exp(-t * 15) * 0.5;
          left[bassStart + i] += val;
          right[bassStart + i] += val;
        }
      }

      // Neon synth arpeggio
      const arpNotes = [root * 2, root * 2.5, root * 3, root * 4];
      for (let s = 0; s < 16; s++) {
        const arpStart = Math.floor(barStart + s * sixteenth);
        const arpLen = Math.floor(0.16 * sampleRate);
        const nFreq = arpNotes[s % arpNotes.length];
        for (let i = 0; i < arpLen && arpStart + i < left.length; i++) {
          const t = i / sampleRate;
          const square = Math.sin(2 * Math.PI * nFreq * t) > 0 ? 0.7 : -0.7;
          const val = square * Math.exp(-t * 18) * 0.18;
          left[arpStart + i] += val * 0.7;
          right[arpStart + i] += val;
        }
      }
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  synthesizeFutureTrapTrack(buffer, bpm, bars) {
    const sampleRate = buffer.sampleRate;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beatSamples = (60 / bpm) * sampleRate;
    const barSamples = beatSamples * 4;

    const chords = [
      [261.63, 329.63, 392.0, 523.25], // C
      [220.0, 261.63, 329.63, 440.0],  // Am
      [174.61, 220.0, 261.63, 349.23], // F
      [196.0, 246.94, 293.66, 392.0]   // G
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = Math.floor(bar * barSamples);
      const chord = chords[bar % chords.length];

      // 1. Sliding 808 Sub-Bass on beat 0 and beat 2.5
      const subKickMoments = [0, beatSamples * 2.5];
      subKickMoments.forEach(offset => {
        const kickStart = Math.floor(barStart + offset);
        const kickLen = Math.floor(0.85 * sampleRate);
        for (let i = 0; i < kickLen && kickStart + i < left.length; i++) {
          const t = i / sampleRate;
          const freq = 150 * Math.exp(-t * 18) + 38;
          const sine = Math.sin(2 * Math.PI * freq * t);
          const click = (i < 80) ? 0.5 : 0;
          const env = Math.exp(-t * 3.5);
          const val = (sine * 0.85 + click) * env;
          left[kickStart + i] += val * 0.8;
          right[kickStart + i] += val * 0.8;
        }
      });

      // 2. Trap Snare on Beat 2 (half-time!)
      const snareStart = Math.floor(barStart + beatSamples * 2);
      const snareLen = Math.floor(0.25 * sampleRate);
      for (let i = 0; i < snareLen && snareStart + i < left.length; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);
        const tone = Math.sin(2 * Math.PI * 260 * t) * Math.exp(-t * 30);
        left[snareStart + i] += (noise * 0.6 + tone * 0.3);
        right[snareStart + i] += (noise * 0.6 + tone * 0.3);
      }

      // 3. Fast trap hi-hats with triplet rolls
      const sixteenth = beatSamples / 4;
      for (let s = 0; s < 16; s++) {
        const hatStart = Math.floor(barStart + s * sixteenth);
        const hatLen = Math.floor(0.05 * sampleRate);
        for (let i = 0; i < hatLen && hatStart + i < left.length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 70);
          left[hatStart + i] += noise * 0.18;
          right[hatStart + i] += noise * 0.18;
        }
      }

      // 4. Floating ambient chord pads
      const padLen = Math.floor(barSamples);
      for (let i = 0; i < padLen && barStart + i < left.length; i++) {
        const t = i / sampleRate;
        let sum = 0;
        chord.forEach(freq => {
          sum += Math.sin(2 * Math.PI * freq * t);
        });
        const env = Math.sin((i / padLen) * Math.PI);
        const val = sum * env * 0.08;
        left[barStart + i] += val;
        right[barStart + i] += val;
      }
    }
    this.normalizeBuffer(buffer, 0.88);
  }

  normalizeBuffer(buffer, targetPeak) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    let max = 0;
    for (let i = 0; i < left.length; i++) {
      const absL = Math.abs(left[i]);
      const absR = Math.abs(right[i]);
      if (absL > max) max = absL;
      if (absR > max) max = absR;
    }
    if (max > 0) {
      const scale = targetPeak / max;
      for (let i = 0; i < left.length; i++) {
        left[i] = Math.max(-1, Math.min(1, left[i] * scale));
        right[i] = Math.max(-1, Math.min(1, right[i] * scale));
      }
    }
  }
}
