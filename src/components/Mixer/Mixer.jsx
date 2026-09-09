import React from 'react';
import { ChannelStrip } from './ChannelStrip';
import { VUMeter } from './VUMeter';
import { Crossfader } from './Crossfader';

export const Mixer = ({
  mixerState,
  onGainChange,
  onEQChange,
  onKillToggle,
  onFilterChange,
  onVolumeChange,
  onCrossfaderChange,
  onCrossfaderCurveChange,
  onFXToggle
}) => {
  return (
    <section className="mixer-chassis">
      <div className="mixer-top-bar">
        <span className="mixer-title">DJM HARDWARE MIXER</span>
        <div className="mixer-fx-row">
          <button
            className={`fx-btn ${mixerState.fxEcho ? 'active' : ''}`}
            onClick={() => onFXToggle('echo')}
            title="Toggle Studio Echo / Delay"
          >
            ECHO
          </button>
          <button
            className={`fx-btn ${mixerState.fxReverb ? 'active' : ''}`}
            onClick={() => onFXToggle('reverb')}
            title="Toggle Studio Reverb"
          >
            REVERB
          </button>
        </div>
      </div>

      <div className="eq-filter-grid">
        <ChannelStrip
          deckId="A"
          label="CH 1"
          themeColor="#00f0ff"
          gain={mixerState.deckA.gain}
          eqHigh={mixerState.deckA.eqHigh}
          eqMid={mixerState.deckA.eqMid}
          eqLow={mixerState.deckA.eqLow}
          filter={mixerState.deckA.filter}
          volume={mixerState.deckA.volume}
          killedBands={mixerState.deckA.killedBands}
          onGainChange={(val) => onGainChange('A', val)}
          onEQChange={(band, val) => onEQChange('A', band, val)}
          onKillToggle={(band) => onKillToggle('A', band)}
          onFilterChange={(val) => onFilterChange('A', val)}
          onVolumeChange={(val) => onVolumeChange('A', val)}
        />

        <VUMeter
          levelA={mixerState.deckA.vuLevel}
          levelB={mixerState.deckB.vuLevel}
        />

        <ChannelStrip
          deckId="B"
          label="CH 2"
          themeColor="#ff007f"
          gain={mixerState.deckB.gain}
          eqHigh={mixerState.deckB.eqHigh}
          eqMid={mixerState.deckB.eqMid}
          eqLow={mixerState.deckB.eqLow}
          filter={mixerState.deckB.filter}
          volume={mixerState.deckB.volume}
          killedBands={mixerState.deckB.killedBands}
          onGainChange={(val) => onGainChange('B', val)}
          onEQChange={(band, val) => onEQChange('B', band, val)}
          onKillToggle={(band) => onKillToggle('B', band)}
          onFilterChange={(val) => onFilterChange('B', val)}
          onVolumeChange={(val) => onVolumeChange('B', val)}
        />
      </div>

      {/* Channel Volume Vertical Faders */}
      <div className="channel-faders-row">
        <div className="ch-fader-wrap">
          <input
            type="range"
            className="vertical-slider"
            min="0"
            max="1"
            step="0.01"
            value={mixerState.deckA.volume}
            onChange={(e) => onVolumeChange('A', parseFloat(e.target.value))}
            title="CH 1 Volume"
          />
          <span className="knob-title">CH 1 VOL</span>
        </div>
        <div className="ch-fader-wrap">
          <input
            type="range"
            className="vertical-slider"
            min="0"
            max="1"
            step="0.01"
            value={mixerState.deckB.volume}
            onChange={(e) => onVolumeChange('B', parseFloat(e.target.value))}
            title="CH 2 Volume"
          />
          <span className="knob-title">CH 2 VOL</span>
        </div>
      </div>

      <Crossfader
        position={mixerState.crossfaderPos}
        curve={mixerState.crossfaderCurve}
        onPositionChange={onCrossfaderChange}
        onCurveChange={onCrossfaderCurveChange}
      />
    </section>
  );
};
