// 지난 시각 표기. docs/design/brand.md의 '숫자와 날짜' 표를 따른다.
// 1분 안은 방금, 1시간 안은 n분 전, 오늘은 n시간 전, 어제는 어제, 7일 안은 n일 전, 그보다 오래되면 날짜로 쓴다.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** 지난 날짜 수. 기기의 현지 날짜 기준이며, 일광 절약 시간 때문에 하루가 23·25시간이어도 반올림해 맞춘다. */
function daysBetween(earlier: Date, later: Date): number {
  return Math.round((startOfDay(later) - startOfDay(earlier)) / (24 * HOUR));
}

export function formatElapsed(isoTime: string, now: Date = new Date()): string {
  const time = new Date(isoTime);
  const elapsed = now.getTime() - time.getTime();
  if (elapsed < MINUTE) return "방금";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`;

  const days = daysBetween(time, now);
  if (days === 0) return `${Math.floor(elapsed / HOUR)}시간 전`;
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;

  const date = `${time.getMonth() + 1}월 ${time.getDate()}일`;
  return time.getFullYear() === now.getFullYear() ? date : `${time.getFullYear()}년 ${date}`;
}
