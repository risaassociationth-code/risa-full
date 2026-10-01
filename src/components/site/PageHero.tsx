import { Editable } from "@/components/editable/Editable";

/** Standard band at the top of every inner page. */
export function PageHero({
  titleKey, subtitleKey, children,
}: {
  eyebrowKey?: string;
  titleKey: string;
  subtitleKey?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="risa-page-hero relative overflow-hidden border-b border-line bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 hidden size-[26rem] rounded-full opacity-[0.07] blur-3xl md:block"
        style={{ background: "var(--color-accent)" }}
      />
      <div className="container-page relative py-14 md:py-20">
        <Editable k={titleKey} as="h1" className="max-w-3xl text-[2rem] font-semibold md:text-[2.75rem]" />
        {subtitleKey && (
          <Editable
            k={subtitleKey}
            as="p"
            className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted"
          />
        )}
        {children}
      </div>
    </div>
  );
}
