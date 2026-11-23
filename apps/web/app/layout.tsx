import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getAppInfo } from "@hamtteukka/shared";

import { THEME_COLORS, themeInitScript } from "@/lib/theme";

import { BottomTabs } from "./_components/bottom-tabs";
import { HistoryTracker } from "./_components/history-tracker";
// Pretendard 가변 글꼴. 글자 범위별로 나뉜 파일 가운데 화면에 쓰인 글자의 파일만 내려받는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const appInfo = getAppInfo();

export const metadata: Metadata = {
  title: { default: appInfo.name, template: `%s | ${appInfo.name}` },
  description: appInfo.description,
};

// 휴대폰 브라우저 주소창 색을 가운데 열의 바탕색(surface)에 맞춘다. 직접 고른 모드는 <head>의 스크립트가 다시 맞추고,
// 페이지를 이동해 Next.js가 이 태그를 기본값으로 다시 그려도 스크립트가 고른 모드의 색으로 되돌린다.
// viewportFit: "cover"는 하단 탭이 env(safe-area-inset-bottom)으로 아래쪽 안전 영역을 피할 수 있게 한다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // data-theme은 <head>의 스크립트가 하이드레이션 전에 정하므로 서버 HTML과 다를 수 있다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-surface"
        >
          본문으로 건너뛰기
        </a>
        {/* 넓은 화면에서도 휴대폰 화면 배치를 최대 600px 가운데 열에 그대로 둔다. 열 바깥은 body의 canvas 색이다. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col bg-surface">
          <HistoryTracker />
          {children}
          <BottomTabs />
        </div>
      </body>
    </html>
  );
}
