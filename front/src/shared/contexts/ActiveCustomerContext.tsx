import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usersApi, type User } from "@/shared/api/users";
import { ACTIVE_CUSTOMER_ID } from "@/shared/api/config";

interface ActiveCustomerContextValue {
  customer: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ActiveCustomerContext = createContext<ActiveCustomerContextValue | undefined>(undefined);

const resolveActiveCustomer = (users: User[]): User | null => {
  if (!users.length) {
    return null;
  }
  if (!ACTIVE_CUSTOMER_ID) {
    return users[0];
  }
  return users.find((user) => user.id === ACTIVE_CUSTOMER_ID) ?? users[0];
};

interface ActiveCustomerProviderProps {
  children: ReactNode;
}

export const ActiveCustomerProvider = ({ children }: ActiveCustomerProviderProps) => {
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await usersApi.getUsers();
      const resolved = resolveActiveCustomer(users);
      if (!resolved) {
        throw new Error("Nenhum cliente disponível. Execute o seed do banco para criar dados base.");
      }
      setCustomer(resolved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar o cliente ativo";
      setError(message);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const value = useMemo<ActiveCustomerContextValue>(
    () => ({
      customer,
      loading,
      error,
      refresh: loadCustomer,
    }),
    [customer, loading, error, loadCustomer]
  );

  return <ActiveCustomerContext.Provider value={value}>{children}</ActiveCustomerContext.Provider>;
};

export const useActiveCustomer = () => {
  const context = useContext(ActiveCustomerContext);
  if (!context) {
    throw new Error("useActiveCustomer deve ser usado dentro de ActiveCustomerProvider");
  }
  return context;
};
