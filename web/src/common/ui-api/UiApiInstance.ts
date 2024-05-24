import { IApi } from "../api/IApi";
import { IrysApi } from "../api/IrysApi";
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
  if (!uiApi) {
    initOrGetUiApi(new IrysApi(), walletProvider);
  }
  return uiApi;
}
