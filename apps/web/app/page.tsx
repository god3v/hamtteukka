import { getAppInfo } from "@hamtteukka/shared";

export default function HomePage() {
  const appInfo = getAppInfo();

  return (
    <main>
      <h1>{appInfo.name}</h1>
      <p>{appInfo.description}</p>
      <p>현재 출시 단계: {appInfo.release}</p>
    </main>
  );
}
