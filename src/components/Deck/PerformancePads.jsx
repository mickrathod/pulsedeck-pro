import React from 'react';

function formatTimestamp(seconds) {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PerformancePads = ({
  deckId,
  isSynced,
  loopActive,
  loopBeats,
  hotCues = [],
  onSync,
  onLoopToggle,
  onLoopBeatsChange,
  onHotCueTrigger
}) => {
  return (
    <div className="deck-secondary-controls">
      <div className="sync-loop-bar">
        <button
          className={`sync-btn ${isSynced ? 'synced' : ''}`}
          onClick={onSync}
          title="BPM Sync with opposite deck"
        >
          SYNC
        </button>

        <div className="loop-controls">
          <button
            className={`loop-toggle-btn ${loopActive ? 'active' : ''}`}
            onClick={onLoopToggle}
            title="Toggle Auto Loop"
          >
            LOOP
          </button>
          {[1, 2, 4, 8].map(beats => (
            <button
              key={beats}
              className={`loop-size-btn ${loopBeats === beats ? 'selected' : ''}`}
              onClick={() => onLoopBeatsChange(beats)}
            >
              {beats}
            </button>
          ))}
        </div>
      </div>

      <div className="hot-cues-row">
        {[0, 1, 2, 3].map(idx => {
          const cueTime = hotCues[idx];
          const hasCue = cueTime !== null && cueTime !== undefined;
          return (
            <button
              key={idx}
              className={`hot-cue-pad ${hasCue ? 'has-cue' : ''}`}
              onClick={() => onHotCueTrigger(idx)}
              title={`Hot Cue ${idx + 1}`}
            >
              <span>HOT {idx + 1}</span>
              <span className="cue-time">{formatTimestamp(cueTime)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
