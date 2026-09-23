import type { Metadata } from "next";
import { Noto_Sans_Thai_Looped } from "next/font/google";
import { Toaster } from "sonner";
import { getLocale } from "@/lib/request";
import "./globals.css";

const notoThaiLooped = Noto_Sans_Thai_Looped({
  variable: "--font-noto-thai-looped",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RISA",
  description: "Research and Industry Standards Advancement Association",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${notoThaiLooped.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("risa-theme");var d=t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
