import { NETWORK, TOKEN } from "../Env";
import { IrysCommon } from "../api/irys/IrysCommon";
import { IrysReadApi } from "../api/irys/IrysReadApi";
import { IrysWriteApi } from "../api/irys/IrysWriteApi";
import { UiApi } from "./UiApi";

let uiApi: UiApi;

/// always returns same instance
export async function initOrGetUiApi() {
  if (!uiApi) {
    const irysCommon = new IrysCommon();
    irysCommon.Network = NETWORK;
    irysCommon.Token = TOKEN;
    const irysRead = new IrysReadApi(irysCommon);

    uiApi = new UiApi(new IrysWriteApi(irysCommon, irysRead), irysRead);
  }
  return uiApi;
}
