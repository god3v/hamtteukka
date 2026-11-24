"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { inAppHistory } from "@/lib/in-app-history";

/** 화면을 옮길 때마다 경로를 기록한다. 화면에는 아무것도 그리지 않는다. */
export function HistoryTracker() {
  const pathname = usePathname();
  useEffect(() => inAppHistory.record(pathname), [pathname]);
  return null;
}
