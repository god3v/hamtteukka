// 이어서 뜨기 바를 보여 줄지 정하는 규칙. 003 요구사항 FR-37~FR-39와 docs/design/information-architecture.md의 이어서 뜨기 바 절을 따른다.
// 로그인하지 않은 방문자는 퀵 카운터만 후보로 삼는다. 로그인한 회원의 후보 선정은 2차 설계에서 더한다.
import { isSheetScreen } from "./navigation.ts";

export type ContinueBarContext = {
  pathname: string;
  /** 퀵 카운터의 마지막으로 센 시각. 센 적이 없으면 null이다. */
  lastCountedAt: string | null;
  /** 화면 키보드가 열려 있으면 바가 입력창을 가리지 않게 숨긴다. */
  keyboardOpen: boolean;
};

// 로그아웃 홈은 퀵 카운터 구역이 같은 값을 이미 크게 보여 주므로 바를 숨긴다.
const LOGGED_OUT_HOME = "/";

export function shouldShowContinueBar({ pathname, lastCountedAt, keyboardOpen }: ContinueBarContext): boolean {
  if (lastCountedAt === null || keyboardOpen) return false;
  return pathname !== LOGGED_OUT_HOME && !isSheetScreen(pathname);
}

/** 포커스를 받으면 화면 키보드가 열리는 요소의 일부. 브라우저의 Element를 그대로 넘길 수 있다. */
export type FocusedElementLike = { tagName: string; type?: string; isContentEditable?: boolean };

// 글자를 입력하지 않아 화면 키보드가 열리지 않는 input 유형.
const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image", "hidden"]);

export function isEditableElement(element: FocusedElementLike | null): boolean {
  if (!element) return false;
  if (element.isContentEditable) return true;
  if (element.tagName === "TEXTAREA") return true;
  return element.tagName === "INPUT" && !NON_TEXT_INPUTS.has((element.type ?? "text").toLowerCase());
}
