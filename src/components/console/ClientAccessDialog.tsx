import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, QrCode, Users } from "lucide-react";
import { Modal } from "@/components/console/Modal";
import { clientAccess } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

const ROLE_LABEL: Record<string, { ar: string; en: string }> = {
  general_manager: { ar: "مدير عام", en: "General manager" },
  branch_manager: { ar: "مدير الفرع", en: "Branch manager" },
  cashier: { ar: "الكاشير", en: "Cashier" },
  kitchen: { ar: "المطبخ", en: "Kitchen" },
  super_admin: { ar: "المسؤول العام", en: "General admin" },
};

function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

function useQr(value: string) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!value) return;
    let alive = true;
    void QRCode.toDataURL(value, { margin: 1, width: 512 }).then((d) => {
      if (alive) setSrc(d);
    });
    return () => {
      alive = false;
    };
  }, [value]);
  return src;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { pick } = useI18n();
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        toast.success(pick("تم النسخ", "Copied"));
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-accent"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

function LinkRow({ url, title }: { url: string; title: string }) {
  const { pick } = useI18n();
  const qr = useQr(url);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-elevated p-3">
      {qr ? <img src={qr} alt={title} className="h-16 w-16 rounded-lg bg-white p-1" /> : <div className="h-16 w-16 rounded-lg bg-muted" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">
          {url}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <CopyButton text={url} label={pick("نسخ الرابط", "Copy link")} />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {pick("فتح", "Open")}
          </a>
          {qr ? (
            <a
              href={qr}
              download={`${title.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {pick("تحميل QR", "Download QR")}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Popup with the restaurant link, QR codes and per-branch login accounts. */
export function ClientAccessDialog({
  open,
  onClose,
  restaurantId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  title: string;
}) {
  const { pick } = useI18n();
  const origin = useOrigin();
  const access = useQuery({
    queryKey: ["client-access", restaurantId],
    queryFn: () => clientAccess({ data: { restaurantId } }),
    enabled: open && !!restaurantId,
  });

  const loginUrl = useMemo(() => `${origin}/auth`, [origin]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pick("روابط ودخول العميل", "Client links & access")}
      subtitle={title}
    >
      {access.isLoading ? (
        <p className="text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</p>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <QrCode className="h-4 w-4" aria-hidden />
              {pick("رابط المطعم", "Restaurant link")}
            </p>
            <LinkRow url={`${origin}/app`} title={title} />
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden />
              {pick("الفروع والحسابات", "Branches & accounts")}
            </p>
            {(access.data?.branches ?? []).map((b) => {
              const branchUrl = `${origin}/app?branch=${encodeURIComponent(b.code)}`;
              return (
                <div key={b.id} className="rounded-2xl border border-border p-3">
                  <LinkRow url={branchUrl} title={pick(b.name_ar, b.name_en)} />
                  <div className="mt-3 space-y-2">
                    {b.accounts.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        {pick("لا توجد حسابات لهذا الفرع بعد.", "No accounts for this branch yet.")}
                      </p>
                    ) : (
                      b.accounts.map((a) => (
                        <div
                          key={a.userId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-elevated px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">
                              {a.fullName ?? pick("بدون اسم", "Unnamed")} ·{" "}
                              <span className="text-muted-foreground">
                                {pick(ROLE_LABEL[a.role]?.ar ?? a.role, ROLE_LABEL[a.role]?.en ?? a.role)}
                              </span>
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                              {a.email ?? "—"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <CopyButton text={a.email ?? ""} label={pick("نسخ البريد", "Copy email")} />
                            <CopyButton
                              text={`${loginUrl}\n${a.email ?? ""}`}
                              label={pick("نسخ بيانات الدخول", "Copy login")}
                            />
                            <a
                              href={loginUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-accent"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              {pick("فتح الدخول", "Open login")}
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            {access.data && access.data.branches.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{pick("لا توجد فروع بعد.", "No branches yet.")}</p>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
