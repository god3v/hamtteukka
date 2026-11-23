// 카운터 화면을 보는 동안 화면이 꺼지지 않게 하는 모듈. 003 요구사항 NFR-03, NFR-04와
// docs/specs/003-row-counter/design/sequence.md의 '화면 꺼짐 방지를 켠다' 시나리오를 따른다.
// 탭이 숨겨지면 브라우저가 요청을 스스로 풀기 때문에, 탭이 다시 보이면 다시 요청한다.

/** Screen Wake Lock API가 돌려주는 요청 객체의 일부. */
export type WakeLockSentinelLike = { released: boolean; release(): Promise<void> };

export type WakeLockEnv = {
  /** 화면 꺼짐 방지를 요청한다. 브라우저가 Screen Wake Lock API를 지원하지 않으면 비워 둔다. */
  request?: () => Promise<WakeLockSentinelLike>;
  document: {
    visibilityState: string;
    addEventListener(type: "visibilitychange", listener: () => void): void;
    removeEventListener(type: "visibilitychange", listener: () => void): void;
  };
};

export type ScreenWakeLock = {
  /** false이면 화면은 설정을 비활성으로 보여 주고 자동 잠금 시간을 늘리는 방법을 안내한다(NFR-04). */
  supported: boolean;
  /** 요청에 성공하면 true로 끝난다. 지원하지 않거나 브라우저가 거절하면 예외 없이 false로 끝난다. */
  enable(): Promise<boolean>;
  /** 요청을 풀고, 탭이 다시 보여도 요청하지 않는다. */
  disable(): Promise<void>;
  /** 화면을 닫을 때 부른다. 요청을 풀고 탭 변화 감시를 멈춘다. */
  dispose(): Promise<void>;
  /** 지금 화면 꺼짐 방지가 걸려 있는지 알려 준다. 상태 줄의 표시에 쓴다. */
  isActive(): boolean;
};

export function createScreenWakeLock(env: WakeLockEnv): ScreenWakeLock {
  const supported = env.request !== undefined;
  let wanted = false;
  let listening = false;
  let sentinel: WakeLockSentinelLike | undefined;
  // 진행 중인 요청. 요청이 끝나기 전에 다시 켜거나 탭이 다시 보여도 같은 요청에 합류해, 요청이 두 번 나가지 않게 한다.
  let pending: Promise<boolean> | undefined;

  async function releaseSentinel(target: WakeLockSentinelLike) {
    if (target.released) return;
    try {
      await target.release();
    } catch {
      // 이미 풀린 요청을 다시 풀 때 생기는 오류는 무시한다.
    }
  }

  async function requestOnce(request: () => Promise<WakeLockSentinelLike>): Promise<boolean> {
    try {
      const acquired = await request();
      // 요청을 기다리는 동안 끄거나 화면을 닫았으면 받은 요청을 바로 푼다.
      if (!wanted) {
        await releaseSentinel(acquired);
        return false;
      }
      sentinel = acquired;
      return true;
    } catch {
      // 절전 모드처럼 브라우저가 요청을 거절할 수 있다. 카운터는 그대로 쓸 수 있으므로 false로 알린다.
      return false;
    }
  }

  function acquire(): Promise<boolean> {
    if (!env.request || env.document.visibilityState !== "visible") return Promise.resolve(false);
    if (sentinel && !sentinel.released) return Promise.resolve(true);
    pending ??= requestOnce(env.request).finally(() => {
      pending = undefined;
    });
    return pending;
  }

  async function release() {
    // 진행 중인 요청이 있으면 끝나기를 기다린다. wanted가 false이므로 그 요청은 requestOnce가 바로 푼다.
    if (pending) await pending;
    const current = sentinel;
    sentinel = undefined;
    if (current) await releaseSentinel(current);
  }

  const onVisibilityChange = () => {
    if (wanted && env.document.visibilityState === "visible") void acquire();
  };

  return {
    supported,
    async enable() {
      if (!supported) return false;
      wanted = true;
      if (!listening) {
        env.document.addEventListener("visibilitychange", onVisibilityChange);
        listening = true;
      }
      return acquire();
    },
    async disable() {
      wanted = false;
      await release();
    },
    async dispose() {
      wanted = false;
      if (listening) {
        env.document.removeEventListener("visibilitychange", onVisibilityChange);
        listening = false;
      }
      await release();
    },
    isActive() {
      return sentinel !== undefined && !sentinel.released;
    },
  };
}

/** 지금 브라우저의 Screen Wake Lock API를 WakeLockEnv로 묶는다. 화면이 브라우저에서 그려진 뒤에만 부른다. */
export function browserWakeLockEnv(): WakeLockEnv {
  const wakeLock = "wakeLock" in navigator ? navigator.wakeLock : undefined;
  return {
    document,
    request: wakeLock ? () => wakeLock.request("screen") : undefined,
  };
}
