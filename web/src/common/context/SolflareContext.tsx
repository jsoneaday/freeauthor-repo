import Solflare from "@solflare-wallet/sdk";
import { createContext, useContext, useState } from "react";

export const SolflareContext = createContext<WalletState | null>(null);

interface SolflareProviderProps {
  children: React.ReactNode;
}

interface WalletState {
  walletObject: WalletObject | null;
  setWalletObject: React.Dispatch<React.SetStateAction<WalletObject>>;
}

interface WalletObject {
  wallet: Solflare;
  /// isConnected is needed so that a state change can indicate connection,
  /// allowing the object to update its own isConnected property does not work
  isConnected: boolean;
}

export default function SolflareProvider({ children }: SolflareProviderProps) {
  const [walletObject, setWalletObject] = useState<WalletObject>({
    wallet: new Solflare(),
    isConnected: false,
  });

  return (
    <SolflareContext.Provider
      value={{
        walletObject,
        setWalletObject,
      }}
    >
      {children}
    </SolflareContext.Provider>
  );
}

export function useWallet() {
  return useContext(SolflareContext);
}
