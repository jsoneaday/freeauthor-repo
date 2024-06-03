import { DataUpload } from "../irys/models/ApiModels";

export interface IUploadData {
  getData(entityTxId: string, isTextData: boolean): Promise<DataUpload>;
}
