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

  const setupUiApi = async () => {
    const _uiApi = await initOrGetUiApi(wallet);
    setUiApi(_uiApi);
    console.log("_uiApi set", _uiApi);
  };

  useEffect(() => {
    wallet?.on("connect", setupUiApi);

    return () => {
      wallet?.off("connect", setupUiApi);
    };
  }, [wallet]);

  return (
    <UiApiContext.Provider value={uiApi}>{children}</UiApiContext.Provider>
  );
}

export function useUiApi() {
  return useContext(UiApiContext);
}
