import Solflare from "@solflare-wallet/sdk";
import { createContext, useContext } from "react";

export const SolflareContext = createContext<Solflare | null>(null);

interface SolflareProviderProps {
  children: React.ReactNode;
}

export default function SolflareProvider({ children }: SolflareProviderProps) {
  return (
    <SolflareContext.Provider value={new Solflare()}>
      {children}
    </SolflareContext.Provider>
  );
}

export function useWallet() {
  return useContext(SolflareContext);
}