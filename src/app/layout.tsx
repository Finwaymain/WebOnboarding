import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fiinway Onboarding",
  description: "Complete your Fiinway provider onboarding",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function show(msg) {
                  try {
                    var text = document.body && document.body.innerText ? document.body.innerText.trim() : '';
                    if (text.length > 40) return;
                    document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;background:#f8fafc"><div style="max-width:360px;text-align:center"><p style="color:#b91c1c;font-weight:700;margin-bottom:8px">Onboarding failed to load</p><p style="color:#64748b;font-size:14px;line-height:1.5">' + (msg || 'Unknown error') + '</p></div></div>';
                  } catch (e) {}
                }
                window.addEventListener('error', function (e) { show(e.message || 'Script error'); });
                window.addEventListener('unhandledrejection', function (e) { show(String(e.reason || 'Promise error')); });
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
