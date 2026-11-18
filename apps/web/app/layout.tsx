import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getAppInfo } from "@hamtteukka/shared";

import "./globals.css";

const appInfo = getAppInfo();

export const metadata: Metadata = {
  title: appInfo.name,
  description: appInfo.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
