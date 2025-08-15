import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Link-It | 딥링크 서비스",
  description: "소셜미디어에서 앱으로 바로 이동하는 스마트 딥링크 서비스",
  keywords: "딥링크, 링크단축, 모바일앱, 이커머스, 마케팅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
