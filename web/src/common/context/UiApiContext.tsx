import { createContext, useContext, useEffect, useState } from "react";
import { UiApi } from "../ui-api/UiApi";
import { initOrGetUiApi } from "../ui-api/UiApiInstance";
import { useWallet } from "./SolflareContext";

export const UiApiContext = createContext<UiApi | null>(null);

interface UiApiProps {
  children: React.ReactNode;
}

export default function UiApiProvider({ children }: UiApiProps) {
  const walletState = useWallet();
  const [uiApi, setUiApi] = useState<UiApi | null>(null);

  const connectUiApi = async () => {
    const _uiApi = await initOrGetUiApi();
    await _uiApi.connect(walletState!.walletObject!.wallet);
    walletState!.setWalletObject({
      ...walletState!.walletObject!,
      isConnected: true,
    });
  };

  useEffect(() => {
    if (walletState) {
      initOrGetUiApi().then((_uiApi) => {
        setUiApi(_uiApi);
      });
    }
    walletState?.walletObject?.wallet.on("connect", connectUiApi);

    return () => {
      walletState?.walletObject?.wallet.off("connect", connectUiApi);
    };
  }, [walletState]);

  return (
    <UiApiContext.Provider value={uiApi}>{children}</UiApiContext.Provider>
  );
}

export function useUiApi() {
  return useContext(UiApiContext);
}
