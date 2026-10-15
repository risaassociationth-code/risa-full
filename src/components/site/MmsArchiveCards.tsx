import Link from 'next/link';
import { mmsRecords } from '@/lib/mms-import';

export function MmsArchiveCards({ locale, categories, excludedIds = [] }: { locale: string; categories: string[]; excludedIds?: string[] }) {
  const th = locale === 'th';
  return (
    <section className="my-10">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {mmsRecords
          .filter((r) => categories.includes(r.category) && !excludedIds.includes(r.id))
          .map((r) => {
            const title = !th && r.titleEn ? r.titleEn : r.title;
            const href = `/${locale}/${r.category === '1' ? 'news' : 'activities'}/risa-${r.id}`;
            return (
              <Link key={r.id} href={href} className="risa-archive-card block border-b border-line pb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.cover && <img src={`${r.cover}?v=4`} alt={title} loading="lazy" className="mb-4 aspect-[16/9] w-full rounded-xl object-cover" />}
                <h3 lang={th ? 'th' : 'en'} className="text-lg">{title}</h3>
                <span className="mt-3 block text-sm text-muted">{th ? 'อ่านรายละเอียด' : 'Read more'} ↗</span>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
