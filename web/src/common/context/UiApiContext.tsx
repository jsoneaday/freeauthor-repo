import { createContext, useContext, useEffect, useState } from "react";
import { UiApi } from "../ui-api/UiApi";
import { initOrGetUiApi } from "../ui-api/UiApiInstance";
import { SolflareContext } from "./SolflareContext";

export const UiApiContext = createContext<UiApi | null>(null);

interface UiApiProps {
  children: React.ReactNode;
}

export default function UiApiProvider({ children }: UiApiProps) {
  const wallet = useContext(SolflareContext);
  const [uiApi, setUiApi] = useState<UiApi | null>(null);

  const connectUiApi = async () => {
    console.log("connect wallet to irys");
    uiApi?.connect(wallet);
  };

  useEffect(() => {
    console.log("wallet", wallet);

    if (wallet) {
      initOrGetUiApi().then((_uiApi) => {
        setUiApi(_uiApi);
      });
    }
    wallet?.on("connect", connectUiApi);

    return () => {
      wallet?.off("connect", connectUiApi);
    };
  }, [wallet]);

  return (
    <UiApiContext.Provider value={uiApi}>{children}</UiApiContext.Provider>
  );
}

export function useUiApi() {
  return useContext(UiApiContext);
}
