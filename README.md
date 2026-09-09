# 🎧 PulseDeck Pro — Dual-Deck Performance DJ Station & Procedural Synthesizer

> **Hardware-Grade Browser DJ Console • Real-Time Vinyl Scratch Physics • Web Audio DSP • 60 FPS Multi-Band Waveforms**

---

## 🎛️ Vision & Product Overview

**PulseDeck Pro** is a high-precision, browser-based performance DJ console modeled directly after world-class club hardware (Pioneer CDJ-3000 decks and DJM-900NXS2 mixers). Built completely from the ground up with **React 19** and the native **Web Audio API**, PulseDeck Pro delivers low-latency digital signal processing, tactile vinyl manipulation, and fluid audio visualization directly in the browser with zero external audio plugins.

Whether blending tracks, scratching on touch-sensitive platters, carving frequencies with isolator EQs, or dropping one-shot sound effects from the 8-pad sampler, PulseDeck Pro turns any laptop or desktop into an expressive performance workstation.

---

## ⚡ Core Systems & Performance Highlights

### 1. Dual Independent Decks (Deck A Cyan / Deck B Magenta)
- **High-Torque Jog Wheels:** Realistic vinyl platters supporting click-and-drag scratch physics, progressive inertia slip, nudging, and backward backspins.
- **Illuminated Transport Controls:** Distinctive Pioneer-style circular CUE and PLAY/PAUSE tactile buttons with active state glow and key-lock feedback.
- **Precision Pitch Fader:** 100mm long-throw tempo sliders with ±8%, ±16%, and ±50% range toggles, pitch bend nudges, and 1-click zero-reset.
- **Master Tempo & Beat Sync:** Instant tempo-locking algorithm aligning the BPM of the slave deck to the master deck at the push of a button.
- **Looping Matrix:** Seamless 1, 2, 4, 8, 16, and 32-beat auto-loop engine with immediate visual loop overlays on the scrolling waveform.
- **4 Hot Cue Banks per Deck:** Color-coded instant cue points allowing live jump-cuts and beat juggling.

### 2. Studio Club Mixer (DJM Architecture)
- **3-Band Isolator EQ:** High, Mid, and Low rotary frequency dials offering smooth +6dB boosts down to infinite kill (-∞ dB) for surgical mix transitions.
- **Dedicated EQ Frequency Kills:** Instant click buttons for cutting basslines or high hats in a single millisecond.
- **Bipolar Color Sound Filter:** High-pass filter when turned clockwise, Low-pass filter when turned counter-clockwise with a resonant sweep curve.
- **Curve-Selectable Crossfader:**
  - *Smooth Curve:* Balanced dip-free power transition for house, techno, and melodic blending.
  - *Linear Curve:* Direct mathematical crossfade for even level distribution.
  - *Fast Cut Curve:* Sharp razor cut near the edges designed for hip-hop turntablism, scratching, and crab cuts.
- **12-Segment Dual LED VU Meters:** Real-time peak and RMS volume ladder towers featuring Green (safe), Yellow (nominal), and Red (clipping) indicators.

### 3. Procedural Track Synthesis & Drum Machines
- **Built-In Sound Generation:** Features fully procedural, algorithmically synthesized dance tracks with zero external MP3 downloads:
  - *Track A:* 124 BPM Deep Cyber Tech-House with punchy 909 kicks, offbeat hi-hats, sub-bass synthesis, and sequenced chord stabs.
  - *Track B:* 128 BPM Neon Electro with energetic side-chained pads, driving bassline, and syncopated snare fills.
- **Dynamic BPM Modulation:** Modulating deck pitch directly adjusts the clock divider and playback rate of the audio synthesis graph in real-time.

### 4. 8-Pad Performance Sampler Rack
- **Instant DJ FX Bank:** Dedicated illuminated performance pads triggering high-impact club effects:
  - Airhorn, Siren, Laser Blaster, 808 Sub Drop, Vinyl Scratch FX, Club Whistle, Crash Cymbal, and Synth Chime.
- **Dual Trigger Modes:** One-shot punch triggers or re-trigger looping with independent sampler master volume control.

---

## 🔬 Audio Engineering & DSP Architecture

```
[Procedural Track Synth / Audio Buffer]
                  │
                  ▼
          [Playback Rate / Pitch Mod]
                  │
                  ▼
      [Biquad Filter: Low Shelf (EQ Low)]
                  │
                  ▼
       [Biquad Filter: Peaking (EQ Mid)]
                  │
                  ▼
     [Biquad Filter: High Shelf (EQ High)]
                  │
                  ▼
     [Biquad Filter: Bi-Polar Color Sound]
                  │
                  ▼
      [Deck Gain & Channel Volume Fader]
                  │
         ┌────────┴────────┐
         ▼                 ▼
   [Crossfader]     [Stereo AnalyserNode]
         │                 │
         ▼                 ▼
  [Master Gain Node]  [VU Meter Engine]
         │
         ▼
[AudioContext.destination]
```

### Multi-Band Dynamic Waveform Visualization
- **Multi-Frequency Color Decomposition:** Waveforms dynamically render audio energy separated into three distinct RGB color spectra:
  - *Red / Warm Hue:* Sub-bass and kick frequencies (20 Hz - 250 Hz).
  - *Green / Mid Hue:* Vocals, snares, and synth leads (250 Hz - 4 kHz).
  - *Blue / High Hue:* Hi-hats, cymbals, and crisp transients (4 kHz - 20 kHz).
- **Needle-Drop Minimap:** Full-track overview scrubber showing track phrasing, breakdowns, drops, and current playhead position.

---

## 🎨 Aesthetic & Ergonomics

- **Hardware Skeuomorphism meets Modern Cyberpunk:** Brushed dark titanium console plates, illuminated LED buttons with diffused bloom effects, and recessed fader tracks.
- **Custom Rotary Dial Interactions:** Rotary knobs respond naturally to vertical drag gestures, mouse wheel scrolling, and double-click center-detent resets.
- **Sub-10ms Latency Response:** Optimized event delegation and Web Audio clock scheduling guarantee tight rhythmic sync and instant pad triggering.
