import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartOption = { name_en: string; name_ar: string; price_delta: number };

export type CartLine = {
  key: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  basePrice: number;
  quantity: number;
  options: CartOption[];
  notes?: string;
};

type Ctx = {
  lines: CartLine[];
  branchId: string | null;
  setBranchId: (id: string) => void;
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  lineTotal: (line: CartLine) => number;
};

const CartContext = createContext<Ctx | null>(null);
const CART_KEY = "qrspring.cart";
const BRANCH_KEY = "qrspring.branch";

export function lineUnitPrice(line: CartLine) {
  return line.basePrice + line.options.reduce((s, o) => s + Number(o.price_delta || 0), 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [branchId, setBranchIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
      const branch = window.localStorage.getItem(BRANCH_KEY);
      if (branch) setBranchIdState(branch);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const setBranchId = useCallback((id: string) => {
    window.localStorage.setItem(BRANCH_KEY, id);
    setBranchIdState(id);
  }, []);

  const add = useCallback<Ctx["add"]>(
    (line) => {
      const signature = `${line.productId}::${line.options
        .map((o) => o.name_en)
        .sort()
        .join("|")}::${line.notes ?? ""}`;
      setLines((prev) => {
        const existing = prev.find((l) => l.key === signature);
        const next = existing
          ? prev.map((l) =>
              l.key === signature ? { ...l, quantity: l.quantity + line.quantity } : l,
            )
          : [...prev, { ...line, key: signature }];
        window.localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      setLines((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, quantity } : l));
        window.localStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const remove = useCallback((key: string) => setQuantity(key, 0), [setQuantity]);
  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<Ctx>(() => {
    const subtotal = lines.reduce((sum, l) => sum + lineUnitPrice(l) * l.quantity, 0);
    return {
      lines,
      branchId,
      setBranchId,
      add,
      setQuantity,
      remove,
      clear,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal,
      lineTotal: (line) => lineUnitPrice(line) * line.quantity,
    };
  }, [lines, branchId, setBranchId, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
