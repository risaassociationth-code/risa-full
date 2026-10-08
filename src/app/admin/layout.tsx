import "./admin.css";
import { AdminLanguageProvider } from "@/components/admin/AdminLanguage";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div lang="th" className="risa-admin min-h-screen bg-paper text-ink"><AdminLanguageProvider>{children}</AdminLanguageProvider></div>;
}
