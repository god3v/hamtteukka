import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Screen } from "../_components/screen";
import { ThemeToggle } from "../_components/theme-toggle";
import { CounterSettingsRow } from "./counter-settings-row";

export const metadata: Metadata = {
  title: "내 정보",
};

// 내 정보 탭의 첫 화면. 배치는 docs/design/r1-screens.md의 내 정보 절을 따른다.
// 계정 구역(로그인 버튼, 로그인 수단)과 로그아웃, 탈퇴는 001 계정 기능에서 더한다.
export default function MePage() {
  return (
    <Screen title="내 정보">
      <section aria-labelledby="settings" className="pt-2 pb-4">
        <h2 id="settings" className="text-title-2">
          설정
        </h2>
        <ThemeToggle />
        <CounterSettingsRow />
      </section>

      <section aria-labelledby="help" className="border-t border-line pt-6 pb-4">
        <h2 id="help" className="text-title-2">
          도움말
        </h2>
        <ul>
          <li>
            <Link href="/support" className="flex min-h-12 items-center justify-between gap-4 py-3">
              고객 지원
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.75} className="text-muted" />
            </Link>
          </li>
        </ul>
      </section>
    </Screen>
  );
}
