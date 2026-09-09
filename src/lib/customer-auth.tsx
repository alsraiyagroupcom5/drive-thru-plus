import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Session = { token: string; customerId: string } | null;

type Ctx = {
  session: Session;
  ready: boolean;
  signIn: (token: string, customerId: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<Ctx | null>(null);
const KEY = "origami.session";

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((token: string, customerId: string) => {
    const next = { token, customerId };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, ready, signIn, signOut }), [session, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return ctx;
}
