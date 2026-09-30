import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.grovesoft.net"),
  title: "GROVE",
  description: "그로브는 AI 선제안, 시스템 구축, 운영 자동화와 AI 에이전트를 연결해 실제 비즈니스의 AX를 구현합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=switzer@1,2,3,4,5,6,7,8,9,100,200,300,400,500,600,700,800,900&display=swap" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Wanted+Sans:wght@400;500;600;700;800;900&display=swap" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@latest/dist/web/variable/pretendardvariable-dynamic-subset.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
