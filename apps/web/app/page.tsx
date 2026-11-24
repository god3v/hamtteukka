import Link from "next/link";

import { getAppInfo } from "@hamtteukka/shared";

import { QuickCounterSection } from "./_components/quick-counter-section";
import { Screen } from "./_components/screen";

// 로그아웃 홈. 배치는 docs/design/r1-screens.md의 로그아웃 홈 절을 따른다.
// 앱 바의 로그인 버튼과 카카오·구글 시작 버튼은 001 계정 기능에서 더한다.
export default function HomePage() {
  const appInfo = getAppInfo();

  return (
    <Screen>
      <section aria-labelledby="intro" className="flex flex-col items-start gap-2 pt-4 pb-6">
        <p className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-micro text-secondary">출시 준비 중</p>
        <h1 id="intro" className="text-title-1">
          {appInfo.description}
        </h1>
        <p className="text-secondary">
          뜨개 프로젝트 기록, 단수 카운터, 내 도안 파일 정리를 휴대폰에서 바로 쓸 수 있게 준비하고 있어요.
        </p>
      </section>

      <QuickCounterSection />

      <section aria-labelledby="help" className="flex flex-col items-start gap-2 border-t border-line py-6">
        <h2 id="help" className="text-title-2">
          궁금한 점이 있나요?
        </h2>
        <p className="text-secondary">서비스 소개, 가입 방법, PDF 도안 저장 방법을 정리해 두었어요.</p>
        <Link
          href="/support#faq"
          className="mt-2 inline-flex h-11 items-center rounded-md border border-line-strong px-4 font-semibold text-ink"
        >
          자주 묻는 질문
        </Link>
      </section>
    </Screen>
  );
}
