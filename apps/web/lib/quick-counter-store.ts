// 퀵 카운터 값과 카운터 설정을 브라우저에 저장하는 QuickCounterStore.
// docs/specs/003-row-counter/design/domain.md의 '브라우저 저장 항목'과 여러 탭 규칙을 따른다.
// - 한 탭에 하나만 두고, 로그아웃 홈, 퀵 카운터 화면, 이어서 뜨기 바가 함께 쓴다.
// - 조작마다 저장소의 최신 값을 읽어 계산하고 바로 쓴다. 읽기, 계산, 쓰기는 한 번의 동기 처리 안에서 끝낸다.
// - 저장소를 쓸 수 없거나 읽기·쓰기에서 예외가 나면 MEMORY_ONLY로 바꾸고 화면 값을 이어 쓴다.
import {
  parseCounterSettings,
  parseCounterValue,
  type CounterResult,
  type CounterSettingsDto,
  type CounterValueDto,
} from "@hamtteukka/shared";

export const QUICK_COUNTER_KEY = "hamtteukka.quickCounter.v1";
export const COUNTER_SETTINGS_KEY = "hamtteukka.counterSettings.v1";
const PROBE_KEY = "hamtteukka.storageProbe";

export type StorageMode = "PERSISTENT" | "MEMORY_ONLY";
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type QuickCounterStoreEnv = {
  /** 브라우저 저장소를 돌려준다. 사생활 보호 모드처럼 접근이 막히면 예외를 던질 수 있다. */
  getStorage: () => StorageLike;
  /** 다른 탭의 저장소 변경을 구독한다. 리스너는 바뀐 키(모두 지웠으면 null)를 받는다. */
  subscribeStorage?: (listener: (key: string | null) => void) => () => void;
};

export type QuickCounterSnapshot = { value: CounterValueDto; settings: CounterSettingsDto; mode: StorageMode };
/** local은 이 탭의 조작, external은 다른 탭의 변경이다. 화면은 external을 받으면 되돌리기 정보를 버린다. */
export type QuickCounterChange = "local" | "external";

export type QuickCounterStore = {
  getSnapshot(): QuickCounterSnapshot;
  subscribe(listener: (change: QuickCounterChange) => void): () => void;
  /** 최신 값에 fn을 적용해 저장한다. fn이 받은 값을 그대로 돌려주면 저장하지 않는다. */
  update(fn: (latest: CounterValueDto) => CounterValueDto): CounterValueDto;
  /** 실패할 수 있는 조작(되돌리기, 1세트당 단수 바꾸기)에 쓴다. 실패하면 저장하지 않고 최신 값을 보여 준다. */
  tryUpdate(fn: (latest: CounterValueDto) => CounterResult<CounterValueDto>): CounterResult<CounterValueDto>;
  updateSettings(patch: Partial<CounterSettingsDto>): CounterSettingsDto;
  /** 다른 탭의 변경 구독을 멈춘다. */
  dispose(): void;
};

export const EMPTY_COUNTER_VALUE: CounterValueDto = { total: 0, setSize: null, lastCountedAt: null };
export const DEFAULT_COUNTER_SETTINGS: CounterSettingsDto = { sound: false, vibration: false, keepScreenOn: false };
/** 서버에서 그릴 때 쓰는 값. 브라우저에서 저장된 값을 읽기 전까지 보여 준다. */
export const SERVER_SNAPSHOT: QuickCounterSnapshot = {
  value: EMPTY_COUNTER_VALUE,
  settings: DEFAULT_COUNTER_SETTINGS,
  mode: "PERSISTENT",
};

function probe(env: QuickCounterStoreEnv): StorageLike | undefined {
  try {
    const storage = env.getStorage();
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return undefined;
  }
}

function sameValue(a: CounterValueDto, b: CounterValueDto): boolean {
  return a.total === b.total && a.setSize === b.setSize && a.lastCountedAt === b.lastCountedAt;
}

function sameSettings(a: CounterSettingsDto, b: CounterSettingsDto): boolean {
  return a.sound === b.sound && a.vibration === b.vibration && a.keepScreenOn === b.keepScreenOn;
}

function readValue(storage: StorageLike): CounterValueDto {
  const raw = storage.getItem(QUICK_COUNTER_KEY);
  if (raw === null) return EMPTY_COUNTER_VALUE;
  const parsed = parseCounterValue(raw);
  return parsed.ok ? parsed.value : EMPTY_COUNTER_VALUE;
}

function readSettings(storage: StorageLike): CounterSettingsDto {
  const raw = storage.getItem(COUNTER_SETTINGS_KEY);
  if (raw === null) return DEFAULT_COUNTER_SETTINGS;
  const parsed = parseCounterSettings(raw);
  return parsed.ok ? parsed.value : DEFAULT_COUNTER_SETTINGS;
}

export function createQuickCounterStore(env: QuickCounterStoreEnv): QuickCounterStore {
  let storage = probe(env);
  const listeners = new Set<(change: QuickCounterChange) => void>();
  // 객체 리터럴은 앞에서부터 계산하므로, 읽기에서 예외가 나 storage가 비워지면 mode도 MEMORY_ONLY가 된다.
  let snapshot: QuickCounterSnapshot = {
    value: guard(readValue, EMPTY_COUNTER_VALUE),
    settings: guard(readSettings, DEFAULT_COUNTER_SETTINGS),
    mode: storage ? "PERSISTENT" : "MEMORY_ONLY",
  };

  // 저장소 접근에서 예외가 나면 MEMORY_ONLY로 바꾼다. 그 뒤로는 snapshot이 탭의 메모리 사본이다.
  function guard<T>(access: (target: StorageLike) => T, fallback: T): T {
    if (!storage) return fallback;
    try {
      return access(storage);
    } catch {
      storage = undefined;
      return fallback;
    }
  }

  // 저장소에서 다시 읽은 값은 내용이 같아도 새 객체이므로, 필드 값으로 비교해 실제로 바뀐 경우에만 snapshot을 바꾸고 알린다.
  function set(next: Partial<QuickCounterSnapshot>, change: QuickCounterChange) {
    const value = next.value && !sameValue(next.value, snapshot.value) ? next.value : snapshot.value;
    const settings = next.settings && !sameSettings(next.settings, snapshot.settings) ? next.settings : snapshot.settings;
    const mode: StorageMode = storage ? "PERSISTENT" : "MEMORY_ONLY";
    if (value === snapshot.value && settings === snapshot.settings && mode === snapshot.mode) return;
    snapshot = { value, settings, mode };
    listeners.forEach((listener) => listener(change));
  }

  function save(latest: CounterValueDto, next: CounterValueDto) {
    if (next !== latest) guard((target) => target.setItem(QUICK_COUNTER_KEY, JSON.stringify(next)), undefined);
    set({ value: next }, "local");
  }

  const unsubscribeStorage = env.subscribeStorage?.((key) => {
    // MEMORY_ONLY 탭은 다른 탭의 저장 값과 섞지 않는다. 이벤트의 값은 늦게 도착했을 수 있으므로 저장소를 다시 읽는다.
    if (!storage) return;
    if (key !== null && key !== QUICK_COUNTER_KEY && key !== COUNTER_SETTINGS_KEY) return;
    const value = guard(readValue, snapshot.value);
    const settings = guard(readSettings, snapshot.settings);
    set({ value, settings }, "external");
  });

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(fn) {
      const latest = guard(readValue, snapshot.value);
      const next = fn(latest);
      save(latest, next);
      return next;
    },
    tryUpdate(fn) {
      const latest = guard(readValue, snapshot.value);
      const result = fn(latest);
      if (result.ok) save(latest, result.value);
      else set({ value: latest }, "local");
      return result;
    },
    updateSettings(patch) {
      const next = { ...guard(readSettings, snapshot.settings), ...patch };
      guard((target) => target.setItem(COUNTER_SETTINGS_KEY, JSON.stringify(next)), undefined);
      set({ settings: next }, "local");
      return next;
    },
    dispose() {
      unsubscribeStorage?.();
      listeners.clear();
    },
  };
}

let browserStore: QuickCounterStore | undefined;

/** 이 탭의 QuickCounterStore. 화면이 브라우저에서 그려진 뒤에만 부른다. */
export function getQuickCounterStore(): QuickCounterStore {
  browserStore ??= createQuickCounterStore({
    getStorage: () => window.localStorage,
    subscribeStorage: (listener) => {
      const onStorage = (event: StorageEvent) => listener(event.key);
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  });
  return browserStore;
}
