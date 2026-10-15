import { notFound, redirect } from 'next/navigation';
import { mmsRecords } from '@/lib/mms-import';
import { getLocale } from '@/lib/request';

export default async function ImportedPage({ params }: PageProps<'/[locale]/mms-hub/[id]'>) {
  const { id } = await params;
  const locale = await getLocale();
  const record = mmsRecords.find((r) => r.id === id);
  if (!record || !['1', '2'].includes(record.category)) notFound();
  const section = record.category === '1' ? 'news' : 'activities';
  redirect(`/${locale}/${section}/risa-${record.id}`);
}
