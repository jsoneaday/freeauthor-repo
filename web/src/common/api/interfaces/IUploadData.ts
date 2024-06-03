import { DataUpload } from "../irys/ApiModels";

export interface IUploadData {
  getData(entityTxId: string, isTextData: boolean): Promise<DataUpload>;
}
