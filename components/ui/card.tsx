import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      {(title || subtitle) && (
        <header className="mb-3">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
