import { createContext, useContext, type ReactNode } from "react";
import { useAppDataController } from "./useAppDataController";

type AppDataValue = ReturnType<typeof useAppDataController>;

const AppDataContext = createContext<AppDataValue | null>(null);

type AppDataProviderProps = {
  value: AppDataValue;
  children: ReactNode;
};

export function AppDataProvider({ value, children }: AppDataProviderProps) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
