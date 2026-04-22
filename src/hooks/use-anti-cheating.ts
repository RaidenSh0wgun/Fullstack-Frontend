import { useEffect, useCallback, useRef } from 'react';

interface AntiCheatingOptions {
  onCheatingDetected?: (type: 'tab_switch' | 'copy_paste' | 'screenshot') => void;
  onAutoSubmit?: () => void;
  showWarnings?: boolean;
  autoSubmitOnCheat?: boolean;
  quizId?: number;
  isLeaving?: boolean;
  timeLeft?: number | null;
}

export function useAntiCheating(options: AntiCheatingOptions = {}) {
  const {
    onCheatingDetected,
    onAutoSubmit,
    showWarnings = true,
    autoSubmitOnCheat = false,
    quizId,
    isLeaving = false,
    timeLeft,
  } = options;

  const showWarning = useCallback((message: string) => {
    if (showWarnings) {
      alert(`Warning: ${message}`);
    }
  }, [showWarnings]);

  const tabSwitchCountRef = useRef(0);
  const lastTabSwitchTimeRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const TAB_SWITCH_WARNING_LIMIT = 3;

  const getCheatingDelay = useCallback(() => {
    if (timeLeft == null || timeLeft <= 0) return 1000;
    if (timeLeft <= 300) return 200; 
    if (timeLeft <= 600) return 500; 
    return 1000;
  }, [timeLeft]);

  const reportCheating = useCallback(async (type: 'tab_switch' | 'copy_paste' | 'screenshot') => {
    console.log(`CHEATING DETECTED: ${type}`, {
      quizId,
      timeLeft,
      timestamp: new Date().toISOString(),
      delay: getCheatingDelay()
    });

    onCheatingDetected?.(type);

    if (autoSubmitOnCheat && onAutoSubmit && type === 'screenshot') {
      console.log("AUTO-SUBMITTING QUIZ DUE TO SERIOUS CHEATING (SCREENSHOT)");
      onAutoSubmit();
    }
  }, [onCheatingDetected, onAutoSubmit, autoSubmitOnCheat, quizId, timeLeft, getCheatingDelay]);

  useEffect(() => {
    if (isLeaving) return;
    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportCheating('copy_paste');
      showWarning("Right-click context menu disabled. Copying quiz content is not allowed.");
    };

    const disablePasteInAnswers = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isAnswerInput = target.tagName === 'TEXTAREA' ||
      (target.tagName === 'INPUT' && target.getAttribute('type') === 'text');

      if (isAnswerInput) {
        e.preventDefault();
        reportCheating('copy_paste');
          showWarning("Pasting text into answer fields is not allowed. Please type your answers manually.");
      }
    };

    const disableKeyShortcuts = (e: KeyboardEvent) => {
      const isPasteShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v';
      const isCopyShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
      const isCutShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x';

      const target = e.target as HTMLElement;
      const isAnswerInput = target.tagName === 'TEXTAREA' ||
                           (target.tagName === 'INPUT' && target.getAttribute('type') === 'text');

      if (isPasteShortcut && isAnswerInput) {
        e.preventDefault();
        reportCheating('copy_paste');
        showWarning("Pasting text into answer fields is not allowed. Please type your answers manually.");
        return;
      }

      if (isCopyShortcut || isCutShortcut) {
        e.preventDefault();
        reportCheating('copy_paste');
          showWarning("Copying or cutting quiz content is not allowed.");
        return;
      }
    };

    document.addEventListener("contextmenu", disableContextMenu);
    document.addEventListener("paste", disablePasteInAnswers);
    document.addEventListener("keydown", disableKeyShortcuts);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("paste", disablePasteInAnswers);
      document.removeEventListener("keydown", disableKeyShortcuts);
    };
  }, [reportCheating, showWarning, isLeaving]);

  useEffect(() => {
    if (isLeaving) return;

    let blurTimeout: number | null = null;

    const handleBlur = () => {
      blurTimeout = window.setTimeout(() => {
        handleTabSwitchAttempt();
      }, 50);
    };

    const handleFocus = () => {
      if (blurTimeout !== null) {
        window.clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitchAttempt();
      }
    };

    const handleTabSwitchAttempt = () => {
      const now = Date.now();
      if (now - lastTabSwitchTimeRef.current < 1000) {
        return;
      }

      lastTabSwitchTimeRef.current = now;
      tabSwitchCountRef.current += 1;
      const count = tabSwitchCountRef.current;

      reportCheating('tab_switch');

      if (count >= TAB_SWITCH_WARNING_LIMIT) {
        showWarning(`${TAB_SWITCH_WARNING_LIMIT}/${TAB_SWITCH_WARNING_LIMIT}: Repeated tab/app switching detected. Your quiz will now be auto-submitted.`);
        if (autoSubmitOnCheat && onAutoSubmit && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          onAutoSubmit();
        }
        return;
      }

      showWarning(`${count}/${TAB_SWITCH_WARNING_LIMIT}: Switching tabs or using Alt+Tab is not allowed during the quiz.`);
      window.focus();
      if (document.body) {
        (document.body as HTMLElement).focus();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reportCheating, showWarning, isLeaving, autoSubmitOnCheat, onAutoSubmit]);

  useEffect(() => {
    if (isLeaving) return;

    const preventScreenshot = (e: KeyboardEvent) => {
      console.log('Screenshot prevention check:', {
        key: e.key,
        keyCode: e.keyCode,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      });

      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        console.log("PRINT SCREEN DETECTED");
        e.preventDefault();
        e.stopPropagation();
        reportCheating('screenshot');
        if (autoSubmitOnCheat && onAutoSubmit) {
          onAutoSubmit();
          return;
        }
        showWarning("Screenshots are not allowed. Taking screenshots of quiz content is prohibited.");
        return;
      }

      if (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
        console.log("ALT + PRINT SCREEN DETECTED");
        e.preventDefault();
        e.stopPropagation();
        reportCheating('screenshot');
        if (autoSubmitOnCheat && onAutoSubmit) {
          onAutoSubmit();
          return;
        }
        showWarning("Screenshots are not allowed. Alt+Print Screen is disabled during the quiz.");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 's' || e.keyCode === 83)) {
        console.log("WIN + SHIFT + S DETECTED");
        e.preventDefault();
        e.stopPropagation();
        reportCheating('screenshot');
        if (autoSubmitOnCheat && onAutoSubmit) {
          onAutoSubmit();
          return;
        }
        showWarning("Screenshots are not allowed. Snip & Sketch tool is disabled during the quiz.");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'PrintScreen' || e.keyCode === 44)) {
        console.log("WIN + PRINT SCREEN DETECTED");
        e.preventDefault();
        e.stopPropagation();
        reportCheating('screenshot');
        if (autoSubmitOnCheat && onAutoSubmit) {
          onAutoSubmit();
          return;
        }
        showWarning("Screenshots are not allowed. Saving screenshots is prohibited during the quiz.");
        return;
      }
    };

    window.addEventListener("keydown", preventScreenshot, true);
    window.addEventListener("keyup", preventScreenshot, true);

    return () => {
      window.removeEventListener("keydown", preventScreenshot, true);
      window.removeEventListener("keyup", preventScreenshot, true);
    };
  }, [reportCheating, showWarning, isLeaving]);
}
