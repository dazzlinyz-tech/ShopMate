/**
 * Speech Recognition and Speech Synthesis Services
 * Strict compliance with PRD Technical Requirements:
 * - SpeechRecognition en-US
 * - SpeechSynthesis en-US (normal rate 0.9, slow rate 0.7)
 * - Auto-stop after ~1.5s of silence
 * - In-app browser detection
 */

// Define SpeechRecognition types for browsers that support it
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const inAppRegex = /KAKAOTALK|Instagram|NAVER|Line|FBAN|FBAV|Snapchat|musical_ly|BytedanceWebview/i;
  return inAppRegex.test(ua);
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class SpeechSynthesisManager {
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  static play(
    text: string,
    rate: number = 0.9,
    onStart?: () => void,
    onEnd?: () => void
  ): () => void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return () => {};
    }

    // Cancel any current utterance
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate; // 0.9 for normal, 0.7 for slow
    utterance.pitch = 1.05; // slightly friendly warm pitch for Lucy

    // Pick friendly English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Victoria'))) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    this.activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    // Return cancel function
    return () => {
      this.stop();
    };
  }

  static stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
    }
  }

  static isSpeaking(): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    return window.speechSynthesis.speaking;
  }
}

export interface SpeechRecognizerHandlers {
  onStart?: () => void;
  onInterim?: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onError: (errorCode: 'not-allowed' | 'no-speech' | 'network' | 'not-supported' | 'other', message?: string) => void;
  onEnd?: () => void;
}

export class SpeechRecognizerSession {
  private recognition: SpeechRecognitionInstance | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private hasReceivedSpeech = false;
  private isManuallyStopped = false;
  private finalTranscript = '';

  constructor(private handlers: SpeechRecognizerHandlers) {}

  start() {
    if (!isSpeechRecognitionSupported()) {
      this.handlers.onError('not-supported', 'Speech recognition is not supported in this browser. Please open in Chrome.');
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    this.stop(); // Clean previous instance if any
    this.hasReceivedSpeech = false;
    this.isManuallyStopped = false;
    this.finalTranscript = '';

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.handlers.onStart?.();
        // Fallback silence timer: if no speech at all within 6 seconds
        this.resetSilenceTimer(6000, true);
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        let localFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            localFinal += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const currentText = (localFinal || interimText).trim();
        if (currentText) {
          this.hasReceivedSpeech = true;
          this.finalTranscript = currentText;
          this.handlers.onInterim?.(currentText);

          // PRD requirement: "Listening stops after approximately 1.5 seconds of silence."
          this.resetSilenceTimer(1500, false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.clearSilenceTimer();
        const err = event.error;
        if (err === 'not-allowed') {
          this.handlers.onError('not-allowed', 'Microphone access was denied. Please allow microphone permissions.');
        } else if (err === 'no-speech') {
          // If no speech was recognized
          this.handlers.onError('no-speech', 'No speech detected.');
        } else if (err === 'network') {
          this.handlers.onError('network', 'Network connection issue with speech recognition.');
        } else if (err === 'aborted') {
          // Manually aborted or interrupted
          if (!this.isManuallyStopped && !this.finalTranscript) {
            this.handlers.onEnd?.();
          }
        } else {
          this.handlers.onError('other', event.error);
        }
      };

      this.recognition.onend = () => {
        this.clearSilenceTimer();
        if (this.hasReceivedSpeech && this.finalTranscript) {
          this.handlers.onFinal(this.finalTranscript);
        }
        this.handlers.onEnd?.();
      };

      this.recognition.start();
    } catch (e) {
      this.handlers.onError('other', (e as Error).message);
    }
  }

  private resetSilenceTimer(delayMs: number, isInitial: boolean) {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (isInitial && !this.hasReceivedSpeech) {
        this.stop();
        this.handlers.onError('no-speech', 'No speech heard.');
      } else if (this.hasReceivedSpeech) {
        // Auto-stop after 1.5s silence as required by PRD
        this.stop();
      }
    }, delayMs);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  stop() {
    this.clearSilenceTimer();
    this.isManuallyStopped = true;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
  }

  abort() {
    this.clearSilenceTimer();
    this.isManuallyStopped = true;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
  }
}
