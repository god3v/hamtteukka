"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = { href: string; children: ReactNode };

/** 주요 메뉴 링크. 지금 보고 있는 페이지는 aria-current로 알리고 글자색을 진하게 한다. */
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const current = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface hover:text-ink aria-[current=page]:text-ink"
    >
      {children}
    </Link>
  );
}
