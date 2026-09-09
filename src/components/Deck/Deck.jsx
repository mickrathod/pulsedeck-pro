import React from 'react';
import { DeckScreen } from './DeckScreen';
import { WaveformView } from './WaveformView';
import { Turntable } from './Turntable';
import { PitchFader } from './PitchFader';
import { TransportControls } from './TransportControls';
import { PerformancePads } from './PerformancePads';

export const Deck = ({
  deckId,
  themeColor,
  deckState,
  peaks,
  onPlayToggle,
  onCueDown,
  onCueUp,
  onSeek,
  onScratchStart,
  onScratchMove,
  onScratchEnd,
  onPitchChange,
  onPitchBend,
  onPitchReset,
  onSync,
  onLoopToggle,
  onLoopBeatsChange,
  onHotCueTrigger,
  onFileUpload,
  onReloadDemo,
  onSelectTrack
}) => {
  return (
    <section className={`deck-chassis deck-${deckId.toLowerCase()}`}>
      <DeckScreen
        deckId={deckId}
        trackTitle={deckState.trackTitle}
        trackArtist={deckState.trackArtist}
        currentTime={deckState.currentTime}
        bpm={deckState.currentBpm}
        pitchPercent={deckState.pitchPercent}
        onFileUpload={onFileUpload}
        onReloadDemo={onReloadDemo}
        onSelectTrack={onSelectTrack}
        currentTrackId={deckState.trackId}
      />

      <WaveformView
        deckId={deckId}
        currentTime={deckState.currentTime}
        duration={deckState.duration}
        bpm={deckState.currentBpm}
        peaks={peaks}
        primaryColor={themeColor}
        hotCues={deckState.hotCues}
        loopInfo={{
          active: deckState.loopActive,
          start: deckState.loopStart,
          end: deckState.loopEnd
        }}
        onSeek={onSeek}
      />

      <div className="deck-body-main">
        <Turntable
          deckId={deckId}
          isPlaying={deckState.isPlaying}
          playbackRate={deckState.playbackRate}
          primaryColor={themeColor}
          onScratchStart={onScratchStart}
          onScratchMove={onScratchMove}
          onScratchEnd={onScratchEnd}
        />

        <PitchFader
          pitchPercent={deckState.pitchPercent}
          onChange={onPitchChange}
          onBend={onPitchBend}
          onReset={onPitchReset}
        />
      </div>

      <div className="deck-bottom-grid">
        <TransportControls
          isPlaying={deckState.isPlaying}
          onPlayToggle={onPlayToggle}
          onCueDown={onCueDown}
          onCueUp={onCueUp}
        />

        <PerformancePads
          deckId={deckId}
          isSynced={deckState.isSynced}
          loopActive={deckState.loopActive}
          loopBeats={deckState.loopBeats}
          hotCues={deckState.hotCues}
          onSync={onSync}
          onLoopToggle={onLoopToggle}
          onLoopBeatsChange={onLoopBeatsChange}
          onHotCueTrigger={onHotCueTrigger}
        />
      </div>
    </section>
  );
};
