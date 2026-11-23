// 카운터 소리·진동 피드백을 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { createCounterFeedback, type AudioContextLike, type FeedbackEnv } from "./counter-feedback.ts";

type Calls = { tones: number; vibrations: number[] };

function fakeAudioContext(calls: Calls): AudioContextLike {
  const param = { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} };
  return {
    currentTime: 0,
    state: "running",
    destination: {},
    resume: async () => {},
    createOscillator: () => ({
      frequency: param,
      connect: (node: unknown) => node,
      start: () => {
        calls.tones += 1;
      },
      stop: () => {},
    }),
    createGain: () => ({ gain: param, connect: (node: unknown) => node }),
  };
}

function env(calls: Calls, options: { vibrate?: boolean; audio?: boolean } = {}): FeedbackEnv {
  const { vibrate = true, audio = true } = options;
  return {
    vibrate: vibrate
      ? (duration: number) => {
          calls.vibrations.push(duration);
          return true;
        }
      : undefined,
    createAudioContext: audio ? () => fakeAudioContext(calls) : undefined,
  };
}

test("003/AC-09 소리만 켜 두면 소리만 내고 진동은 내지 않는다", () => {
  const calls: Calls = { tones: 0, vibrations: [] };
  const feedback = createCounterFeedback(env(calls));

  feedback.play({ sound: true, vibration: false });

  assert.equal(calls.tones, 1);
  assert.deepEqual(calls.vibrations, []);
});

test("003/AC-09 진동만 켜 두면 진동만 내고, 둘 다 끄면 아무것도 내지 않는다", () => {
  const calls: Calls = { tones: 0, vibrations: [] };
  const feedback = createCounterFeedback(env(calls));

  feedback.play({ sound: false, vibration: true });
  feedback.play({ sound: false, vibration: false });

  assert.equal(calls.tones, 0);
  assert.equal(calls.vibrations.length, 1);
});

test("003/AC-13 진동을 지원하지 않으면 지원 여부를 false로 알리고, 진동 설정을 켜도 예외 없이 넘어간다", () => {
  const calls: Calls = { tones: 0, vibrations: [] };
  const feedback = createCounterFeedback(env(calls, { vibrate: false }));

  assert.deepEqual(feedback.support, { sound: true, vibration: false });
  assert.doesNotThrow(() => feedback.play({ sound: true, vibration: true }));
  assert.equal(calls.tones, 1);
});

test("소리를 낼 수 없으면 지원 여부를 false로 알리고 소리 설정을 켜도 예외 없이 넘어간다", () => {
  const calls: Calls = { tones: 0, vibrations: [] };
  const feedback = createCounterFeedback(env(calls, { audio: false }));

  assert.deepEqual(feedback.support, { sound: false, vibration: true });
  assert.doesNotThrow(() => feedback.play({ sound: true, vibration: false }));
});

test("소리 장치는 처음 소리를 낼 때 한 번만 만든다", () => {
  const calls: Calls = { tones: 0, vibrations: [] };
  let created = 0;
  const base = env(calls);
  const feedback = createCounterFeedback({
    ...base,
    createAudioContext: () => {
      created += 1;
      return fakeAudioContext(calls);
    },
  });

  assert.equal(created, 0);
  feedback.play({ sound: true, vibration: false });
  feedback.play({ sound: true, vibration: false });

  assert.equal(created, 1);
  assert.equal(calls.tones, 2);
});

test("기기 기능이 예외를 던져도 카운트를 막지 않도록 피드백은 예외를 밖으로 던지지 않는다", () => {
  const feedback = createCounterFeedback({
    vibrate: () => {
      throw new Error("vibrate failed");
    },
    createAudioContext: () => {
      throw new Error("audio failed");
    },
  });

  assert.doesNotThrow(() => feedback.play({ sound: true, vibration: true }));
});
