import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { getAppInfo } from "@hamtteukka/shared";

type ScreenProps = {
  /** 앱 바 제목. 없으면 홈처럼 워드마크를 보여 준다. */
  title?: string;
  /** 하위 화면이면 뒤로 버튼이 돌아갈 상위 화면의 경로. */
  backHref?: string;
  children: ReactNode;
};

/**
 * 탭 화면의 앱 바와 본문. docs/design/visual-system.md의 앱 바 규칙을 따른다.
 * - 홈은 왼쪽에 워드마크를 둔다.
 * - 탭의 첫 화면은 왼쪽에 title-1 제목을 둔다.
 * - 하위 화면은 왼쪽에 뒤로 버튼을 두고 그 옆에 제목을 둔다.
 */
export function Screen({ title, backHref, children }: ScreenProps) {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-12.5 items-center gap-1 bg-surface px-4">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="뒤로"
            className="-ml-3 inline-flex size-11 items-center justify-center rounded-md text-ink"
          >
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.75} />
          </Link>
        ) : null}
        {title ? (
          <h1 className={backHref ? "text-title-2" : "text-title-1"}>{title}</h1>
        ) : (
          // 워드마크는 Pretendard ExtraBold(800)로 쓴 서비스 이름이다(docs/design/brand.md).
          <span className="text-title-1 font-extrabold">{getAppInfo().name}</span>
        )}
      </header>
      <main id="main" className="flex flex-1 flex-col px-4 pb-8">
        {children}
      </main>
    </>
  );
}
