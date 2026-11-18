// 배포 상태와 함수가 실행된 Vercel 리전을 확인하는 엔드포인트다.
// 홈 화면은 정적 페이지라 CDN이 응답하므로, 함수 리전은 이 경로로 확인한다.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      region: process.env.VERCEL_REGION ?? "local",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
