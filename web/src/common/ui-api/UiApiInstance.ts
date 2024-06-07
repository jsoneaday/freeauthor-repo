import { NETWORK, TOKEN } from "../Env";
import { IrysApi } from "../api/irys/IrysApi";
import { UiApi } from "./UiApi";

let uiApi: UiApi;

/// always returns same instance
function initOrGetUiApi(walletProvider: object) {
  if (!uiApi) {
    uiApi = new UiApi(new IrysApi(NETWORK, TOKEN), walletProvider);
  }
  return uiApi;
}

export function useApi(walletProvider: object) {
  return initOrGetUiApi(walletProvider);
}
