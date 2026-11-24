// 카운터를 누를 때 내는 소리·진동 피드백. 003 요구사항 FR-09(켜 둔 피드백만 낸다)와 NFR-07(지원하지 않으면 비활성)을 따른다.
// 기기 기능은 FeedbackEnv로 받아서, 테스트에서는 가짜 기능을 넣고 화면에서는 browserFeedbackEnv()를 넣는다.

type AudioParamLike = {
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
};
type AudioNodeLike = { connect(node: unknown): unknown };

/** 효과음을 내는 데 필요한 Web Audio API의 일부. */
export type AudioContextLike = {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<unknown>;
  createOscillator(): AudioNodeLike & { frequency: AudioParamLike; start(when?: number): void; stop(when?: number): void };
  createGain(): AudioNodeLike & { gain: AudioParamLike };
};

/** 브라우저가 제공하는 기기 기능. 지원하지 않는 기능은 비워 둔다. */
export type FeedbackEnv = {
  vibrate?: (duration: number) => boolean;
  createAudioContext?: () => AudioContextLike;
};

export type FeedbackSettings = { sound: boolean; vibration: boolean };
export type FeedbackSupport = { sound: boolean; vibration: boolean };

export type CounterFeedback = {
  /** 화면이 지원하지 않는 설정을 비활성으로 보여 줄 때 쓴다. */
  support: FeedbackSupport;
  /** 설정에서 켜 둔 피드백만 낸다. 기기 기능이 실패해도 예외를 던지지 않는다. */
  play(settings: FeedbackSettings): void;
};

const VIBRATION_MS = 15;
const TONE_HZ = 880;
const TONE_SECONDS = 0.04;

export function createCounterFeedback(env: FeedbackEnv): CounterFeedback {
  const support: FeedbackSupport = {
    sound: env.createAudioContext !== undefined,
    vibration: env.vibrate !== undefined,
  };
  // 브라우저는 사용자 조작 뒤에만 소리를 허용하므로, 처음 소리를 낼 때 만든다.
  let audio: AudioContextLike | undefined;

  function playTone(createAudioContext: () => AudioContextLike) {
    audio ??= createAudioContext();
    if (audio.state === "suspended") void audio.resume().catch(() => undefined);
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.setValueAtTime(TONE_HZ, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + TONE_SECONDS);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + TONE_SECONDS);
  }

  return {
    support,
    play(settings) {
      if (settings.sound && env.createAudioContext) {
        try {
          playTone(env.createAudioContext);
        } catch {
          // 소리를 내지 못해도 카운트는 그대로 동작해야 한다(NFR-07).
        }
      }
      if (settings.vibration && env.vibrate) {
        try {
          env.vibrate(VIBRATION_MS);
        } catch {
          // 진동을 내지 못해도 카운트는 그대로 동작해야 한다(NFR-07).
        }
      }
    },
  };
}

/** 지금 브라우저의 기기 기능을 FeedbackEnv로 묶는다. 서버에서 그릴 때와 기능이 없는 브라우저에서는 그 항목을 비운다. */
export function browserFeedbackEnv(): FeedbackEnv {
  if (typeof window === "undefined") return {};
  const AudioContextClass =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return {
    vibrate: typeof navigator.vibrate === "function" ? (duration) => navigator.vibrate(duration) : undefined,
    createAudioContext: AudioContextClass ? () => new AudioContextClass() as unknown as AudioContextLike : undefined,
  };
}
