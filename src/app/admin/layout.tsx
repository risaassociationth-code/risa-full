import "./admin.css";
import { AdminLanguageProvider } from "@/components/admin/AdminLanguage";
import { AdminThemeProvider } from "@/components/admin/AdminTheme";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminThemeProvider>
      <div lang="th" className="risa-admin min-h-screen bg-paper text-ink">
        <AdminLanguageProvider>{children}</AdminLanguageProvider>
      </div>
    </AdminThemeProvider>
  );
}
