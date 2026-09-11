import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PLANS } from "@/lib/marketing";
import { submitSignupRequest } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

const input = "spring-input";

export function RequestForm({ defaultPlan = "growth" }: { defaultPlan?: string }) {
  const { pick } = useI18n();
  const [plan, setPlan] = useState(defaultPlan);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    restaurantName: "",
    contactName: "",
    email: "",
    phone: "",
    branchesCount: 1,
    message: "",
  });

  const submit = useMutation({
    mutationFn: () => submitSignupRequest({ data: { ...form, plan } }),
    onSuccess: () => {
      setSent(true);
      toast.success(pick("تم استلام طلبك، سنتواصل معك قريباً", "Request received — we'll be in touch"));
    },
    onError: () => toast.error(pick("تعذّر الإرسال، حاول مرة أخرى", "Could not send, please try again")),
  });

  const valid = form.restaurantName.trim() && form.contactName.trim() && form.email.includes("@");

  if (sent) {
    return (
      <div className="spring-form-success">
        <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden />
        <p className="mt-3 font-display text-lg font-bold">{pick("تم استلام طلبك", "Request received")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick("سنتواصل معك خلال يوم عمل واحد.", "We'll contact you within one business day.")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={input}
          placeholder={pick("اسم المطعم", "Restaurant name")}
          value={form.restaurantName}
          onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
        />
        <input
          className={input}
          placeholder={pick("اسم المسؤول", "Contact name")}
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          type="email"
          placeholder="name@restaurant.qa"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          placeholder={pick("رقم الجوال", "Phone number")}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className={input}
          type="number"
          min={1}
          placeholder={pick("عدد الفروع", "Number of branches")}
          value={form.branchesCount}
          onChange={(e) => setForm({ ...form, branchesCount: Number(e.target.value) })}
        />
        <select className={input} value={plan} onChange={(e) => setPlan(e.target.value)}>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {pick(p.ar, p.en)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="spring-input mt-3 min-h-28 py-3"
        placeholder={pick("أخبرنا عن مطعمك", "Tell us about your restaurant")}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <Button
        type="button"
        onClick={() => submit.mutate()}
        disabled={!valid || submit.isPending}
        className="spring-button spring-button-primary mt-5 w-full"
      >
        {submit.isPending ? pick("جارٍ الإرسال…", "Sending…") : pick("إرسال الطلب", "Send request")}
      </Button>
    </div>
  );
}
