import Link from "next/link";

import { getAppInfo } from "@hamtteukka/shared";

export default function HomePage() {
  const appInfo = getAppInfo();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium text-accent">서비스를 준비하고 있습니다</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{appInfo.name}</h1>
        <p className="text-lg text-muted">{appInfo.description}</p>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">곧 만날 수 있어요</h2>
        <p className="mt-2 text-muted">
          뜨개 프로젝트 기록, 단수 카운터, 내 도안 파일 정리를 휴대폰에서 바로 쓸 수 있도록 준비하고 있습니다.
        </p>
        <Link
          href="/support"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-on-accent hover:bg-accent-strong"
        >
          궁금한 점 보기
        </Link>
      </section>
    </div>
  );
}
