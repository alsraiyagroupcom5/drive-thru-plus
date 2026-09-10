import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Luxury centred dialog used for dashboard create/edit forms. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { pick } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label={pick("إغلاق", "Close")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold">{title}</h2>
            {subtitle ? <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label={pick("إغلاق", "Close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
