"use client";

import { House, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BOTTOM_TABS, findActiveTab, isSheetScreen, type BottomTab } from "@/lib/navigation";

const ICONS: Record<BottomTab["id"], LucideIcon> = { home: House, me: UserRound };

/**
 * 화면 아래쪽의 하단 탭. layout.tsx가 이어서 뜨기 바와 함께 가운데 열 아래쪽에 sticky로 붙이므로 넓은 화면에서도 열 너비를 넘지 않는다.
 * 활성 탭은 accent, 나머지는 muted로 그리고, 휴대폰의 아래쪽 안전 영역만큼 여백을 둔다.
 * 퀵 카운터 화면처럼 전체 높이 시트로 여는 화면에서는 보이지 않는다.
 */
export function BottomTabs() {
  const pathname = usePathname();
  if (isSheetScreen(pathname)) return null;
  const activeId = findActiveTab(pathname)?.id;

  return (
    <nav
      aria-label="주요 메뉴"
      className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {BOTTOM_TABS.map((tab) => {
          const Icon = ICONS[tab.id];
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.href}
                aria-current={tab.id === activeId ? "page" : undefined}
                className="flex h-14 flex-col items-center justify-center gap-1 text-micro text-muted aria-[current=page]:text-accent"
              >
                <Icon aria-hidden="true" size={21} strokeWidth={1.75} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
