import React from 'react';
import { RotaryKnob } from '../Common/RotaryKnob';

export const ChannelStrip = ({
  deckId,
  label,
  themeColor,
  gain,
  eqHigh,
  eqMid,
  eqLow,
  filter,
  volume,
  killedBands = {},
  onGainChange,
  onEQChange,
  onKillToggle,
  onFilterChange,
  onVolumeChange
}) => {
  const getFilterReadout = (val) => {
    if (Math.abs(val) < 4) return 'FLAT';
    if (val < 0) return `LPF ${Math.round(val)}`;
    return `HPF +${Math.round(val)}`;
  };

  return (
    <div className="channel-strip">
      <span className={`channel-label ch-${deckId.toLowerCase()}-label`}>
        {label}
      </span>

      {/* TRIM GAIN */}
      <RotaryKnob
        value={gain}
        min={0}
        max={1.5}
        defaultValue={1.0}
        onChange={onGainChange}
        label="TRIM"
        deckColor={themeColor}
      />

      {/* HIGH EQ */}
      <div className="knob-control">
        <RotaryKnob
          value={eqHigh}
          min={-24}
          max={6}
          defaultValue={0}
          onChange={(val) => onEQChange('high', val)}
          label="HI"
          deckColor={themeColor}
        />
        <button
          className={`eq-kill-btn ${killedBands.high ? 'killed' : ''}`}
          onClick={() => onKillToggle('high')}
          title="Kill High Frequencies"
        >
          KILL
        </button>
      </div>

      {/* MID EQ */}
      <div className="knob-control">
        <RotaryKnob
          value={eqMid}
          min={-24}
          max={6}
          defaultValue={0}
          onChange={(val) => onEQChange('mid', val)}
          label="MID"
          deckColor={themeColor}
        />
        <button
          className={`eq-kill-btn ${killedBands.mid ? 'killed' : ''}`}
          onClick={() => onKillToggle('mid')}
          title="Kill Mid Frequencies"
        >
          KILL
        </button>
      </div>

      {/* LOW EQ */}
      <div className="knob-control">
        <RotaryKnob
          value={eqLow}
          min={-24}
          max={6}
          defaultValue={0}
          onChange={(val) => onEQChange('low', val)}
          label="LOW"
          deckColor={themeColor}
        />
        <button
          className={`eq-kill-btn ${killedBands.low ? 'killed' : ''}`}
          onClick={() => onKillToggle('low')}
          title="Kill Low Frequencies"
        >
          KILL
        </button>
      </div>

      {/* COLOR FILTER */}
      <RotaryKnob
        value={filter}
        min={-100}
        max={100}
        defaultValue={0}
        onChange={onFilterChange}
        label="COLOR"
        readout={getFilterReadout(filter)}
        deckColor="#ffb800"
        className="filter-variant"
      />
    </div>
  );
};
