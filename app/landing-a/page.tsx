import type { Metadata } from "next";
import AVariantFrame from "./AVariantFrame";

export const metadata: Metadata = {
  title: "Find the Core | GROVE",
  description: "전략부터 디자인, 개발, 운영까지. GROVE는 서비스와 업무의 핵심을 찾아 실행 가능한 디지털 경험으로 연결합니다.",
  openGraph: {
    title: "Find the Core | GROVE",
    description: "서비스와 업무의 핵심을 찾아 실행 가능한 디지털 경험으로 연결합니다.",
    images: [{ url: "/landing-b-media/find-your-core-hero.png", width: 1600, height: 1000 }],
  },
  robots: { index: false, follow: false },
};

export default function AVariantPage() {
  return <AVariantFrame />;
}
