import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

type SiteFooterProps = { appName: string };

export function SiteFooter({ appName }: SiteFooterProps) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <ThemeToggle />
        <div className="flex items-center gap-4">
          <Link href="/support" className="underline-offset-4 hover:text-ink hover:underline">
            고객 지원
          </Link>
          <span>© {appName}</span>
        </div>
      </div>
    </footer>
  );
}
