import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getAppInfo } from "@hamtteukka/shared";

import { THEME_COLORS, themeInitScript } from "@/lib/theme";

import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import "./globals.css";

const appInfo = getAppInfo();

export const metadata: Metadata = {
  title: { default: appInfo.name, template: `%s | ${appInfo.name}` },
  description: appInfo.description,
};

// 휴대폰 브라우저 주소창 색을 화면 바탕색에 맞춘다. 직접 고른 모드는 <head>의 스크립트가 다시 맞추고,
// 페이지를 이동해 Next.js가 이 태그를 기본값으로 다시 그려도 스크립트가 고른 모드의 색으로 되돌린다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
        >
          본문으로 건너뛰기
        </a>
        <SiteHeader appName={appInfo.name} />
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
        <SiteFooter appName={appInfo.name} />
      </body>
    </html>
  );
}
