import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getAppInfo } from "@hamtteukka/shared";

export const metadata: Metadata = {
  title: "고객 지원",
  description: "함뜨까 문의 방법과 자주 묻는 질문",
};

type Faq = { question: string; answer: ReactNode };

const FAQS: Faq[] = [
  {
    question: "함뜨까는 어떤 서비스인가요?",
    answer: (
      <p>
        뜨개 프로젝트를 기록하고, 단수를 세고, 내 도안 파일을 한곳에 모아 두는 도구입니다. 나중에는 작가의 도안을
        받아 바로 프로젝트를 시작할 수 있게 할 예정입니다.
      </p>
    ),
  },
  {
    question: "회원가입은 어떻게 하나요?",
    answer: <p>카카오 또는 구글 계정으로 가입할 수 있도록 준비하고 있습니다.</p>,
  },
  {
    question: "휴대폰에서 PDF 도안이 저장되지 않아요",
    answer: (
      <>
        <p>사용하는 브라우저에 따라 저장 방법이 다릅니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="font-semibold text-ink">iPhone Safari</strong>: PDF를 연 뒤 아래쪽 공유 버튼을 누르고
            &lsquo;파일에 저장&rsquo;을 고릅니다.
          </li>
          <li>
            <strong className="font-semibold text-ink">카카오톡, 인스타그램 등 앱 안의 브라우저</strong>: 앱 안의
            브라우저는 파일을 내려받지 못할 때가 많습니다. 앱의 메뉴(⋮ 또는 ⋯, 위치는 앱마다 다릅니다)에서
            &lsquo;다른 브라우저로 열기&rsquo;를 고른 뒤 Safari나 Chrome에서 저장합니다.
          </li>
          <li>
            <strong className="font-semibold text-ink">Android Chrome</strong>: PDF를 연 뒤 메뉴(⋮)에서
            &lsquo;다운로드&rsquo;를 고릅니다.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "화면을 어둡게 보고 싶어요",
    answer: (
      <p>
        페이지 맨 아래 &lsquo;화면 모드&rsquo;에서 라이트, 다크, 시스템 가운데 하나를 고를 수 있습니다. 시스템을 고르면
        휴대폰 설정을 따라갑니다.
      </p>
    ),
  },
  {
    question: "탈퇴하거나 내 정보를 지우고 싶어요",
    answer: <p>아직 회원가입을 받지 않고 있습니다. 탈퇴와 데이터 삭제 방법은 가입을 열 때 함께 안내합니다.</p>,
  },
];

export default function SupportPage() {
  const { supportEmail } = getAppInfo();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">고객 지원</h1>
        <p className="text-muted">궁금한 점이나 불편한 점이 있으면 아래 방법으로 알려 주세요.</p>
      </header>

      <section aria-labelledby="contact" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 id="contact" className="text-lg font-semibold">
          문의하기
        </h2>
        {supportEmail ? (
          <>
            <p className="mt-2 text-muted">메일로 보내 주시면 확인한 뒤 답변드립니다.</p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-medium text-on-accent hover:bg-accent-strong"
            >
              {supportEmail}
            </a>
          </>
        ) : (
          <p className="mt-2 text-muted">문의 메일 주소를 준비하고 있습니다. 서비스를 공개할 때 이곳에 안내합니다.</p>
        )}
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-3">
        <h2 id="faq" className="text-lg font-semibold">
          자주 묻는 질문
        </h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-muted">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
