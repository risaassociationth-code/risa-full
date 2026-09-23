import "./admin.css";
import { cookies } from 'next/headers';
import { AdminLanguage } from '@/components/admin/AdminLanguage';

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  const initial=(await cookies()).get('risa_admin_language')?.value==='en'?'en':'th';
  return <AdminLanguage initial={initial}>{children}</AdminLanguage>;
}
