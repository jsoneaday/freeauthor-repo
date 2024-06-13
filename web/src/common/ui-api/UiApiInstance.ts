import { WalletContextState } from "@solana/wallet-adapter-react";
import { NETWORK, TOKEN } from "../Env";
import { IrysApi } from "../api/irys/IrysApi";
import { UiApi } from "./UiApi";

let uiApi: UiApi;

/// always returns same instance
export function initOrGetUiApi(
  walletProvider: WalletContextState | null | undefined
) {
  if (!uiApi) {
    uiApi = new UiApi(new IrysApi(NETWORK, TOKEN, walletProvider));
  }
  console.log("uiApi", uiApi);
  return uiApi;
}

export function useApi(walletProvider: WalletContextState | null | undefined) {
  if (walletProvider?.connected) {
    return initOrGetUiApi(walletProvider);
  }
  return null;
}
