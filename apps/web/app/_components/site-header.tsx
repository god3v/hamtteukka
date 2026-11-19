import Link from "next/link";

import { NavLink } from "./nav-link";

type SiteHeaderProps = { appName: string };

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/support", label: "고객 지원" },
];

export function SiteHeader({ appName }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          {appName}
        </Link>
        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
