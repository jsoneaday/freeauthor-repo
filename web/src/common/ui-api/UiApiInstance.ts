import { NETWORK, TOKEN } from "../Env";
import { IApi } from "../api/interfaces/IApi";
import { IrysApi } from "../api/irys/IrysApi";
import { UiApi } from "./UiApi";

let uiApi: UiApi;

/// always returns same instance
export function initOrGetUiApi(apiObj: IApi, walletProvider: object) {
  if (!uiApi) {
    uiApi = new UiApi(apiObj, walletProvider);
  }
  return uiApi;
}

export function useApi(walletProvider: object) {
  return initOrGetUiApi(new IrysApi(NETWORK, TOKEN), walletProvider);
}
