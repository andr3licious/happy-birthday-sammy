import React, { useState, useRef, useCallback } from 'react';
import { music } from './utils/audio';
import { isReducedMotion } from './utils/confetti';
import { vibrate } from './utils/haptics';
import { StardustCanvas } from './components/StardustCanvas';
import { MuteButton } from './components/MuteButton';
import { StageIntro } from './components/StageIntro';
import { StageCake } from './components/StageCake';
import { StageHub } from './components/StageHub';
import { LinerNotesModal } from './components/LinerNotesModal';

export default function App() {
  // 'intro' | 'cake' | 'hub'
  const [stage, setStage] = useState('intro');
  // 'active' | 'leaving'
  const [stageStatus, setStageStatus] = useState('active');
  const [linerOpen, setLinerOpen] = useState(false);

  const stardustRef = useRef(null);
  const linerBtnRef = useRef(null);
  const transitioningRef = useRef(false);

  const transitionTo = useCallback((nextStage) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setStageStatus('leaving');

    const delay = isReducedMotion() ? 150 : 850;
    setTimeout(() => {
      window.scrollTo(0, 0);
      setStage(nextStage);
      requestAnimationFrame(() => {
        setStageStatus('active');
        transitioningRef.current = false;
      });
    }, delay);
  }, []);

  const handleOpenPresent = useCallback(
    (btnRect) => {
      if (transitioningRef.current) return;
      music.play();
      if (btnRect && stardustRef.current) {
        stardustRef.current.burst(
          btnRect.left + btnRect.width / 2,
          btnRect.top + btnRect.height / 2,
          22
        );
      }
      vibrate(15);
      transitionTo('cake');
    },
    [transitionTo]
  );

  const handleContinueToHub = useCallback(() => {
    transitionTo('hub');
  }, [transitionTo]);

  const handleOpenLiner = useCallback(() => {
    setLinerOpen(true);
  }, []);

  const handleCloseLiner = useCallback(() => {
    setLinerOpen(false);
    if (linerBtnRef.current) {
      linerBtnRef.current.focus({ preventScroll: true });
    }
  }, []);

  return (
    <>
      <div className="sky" aria-hidden="true" />
      <StardustCanvas ref={stardustRef} />
      <MuteButton />

      <main id="app">
        {stage === 'intro' && (
          <StageIntro status={stageStatus} onOpen={handleOpenPresent} />
        )}
        {stage === 'cake' && (
          <StageCake status={stageStatus} onContinue={handleContinueToHub} />
        )}
        {stage === 'hub' && (
          <StageHub
            status={stageStatus}
            linerOpen={linerOpen}
            onOpenLiner={handleOpenLiner}
            linerBtnRef={linerBtnRef}
          />
        )}
      </main>

      <LinerNotesModal open={linerOpen} onClose={handleCloseLiner} />
    </>
  );
}
