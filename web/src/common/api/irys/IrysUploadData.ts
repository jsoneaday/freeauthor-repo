import { IRYS_DATA_URL } from "../../Env";
import { IUploadData } from "../interfaces/IUploadData";
import { DataUpload } from "./ApiModels";

export class IrysUploadData implements IUploadData {
  async getData(entityTxId: string, isTextData: boolean): Promise<DataUpload> {
    const response = await fetch(`${IRYS_DATA_URL}/${entityTxId}`);

    if (response.ok) {
      if (isTextData) {
        return await response.text();
      }
      return await response.arrayBuffer();
    }
    return null;
  }
}
