import { NETWORK, TOKEN } from "../Env";
import { IrysApi } from "../api/irys/IrysApi";
import { UiApi } from "./UiApi";
import Solflare from "@solflare-wallet/sdk";

let uiApi: UiApi;

/// always returns same instance
export async function initOrGetUiApi(
  walletProvider: Solflare | null | undefined
) {
  if (!uiApi) {
    uiApi = new UiApi(new IrysApi(NETWORK, TOKEN));
    await uiApi.connect(walletProvider);
  }
  return uiApi;
}
