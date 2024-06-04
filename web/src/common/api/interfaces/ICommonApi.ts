import { DataUpload, EntityType, Tag } from "../irys/models/ApiModels";

export interface ICommonApi {
  getData(entityTxId: string, isTextData: boolean): Promise<DataUpload>;
  tagsMatchByEntityType(
    entityType: EntityType,
    checkTag: Tag,
    searchTag: Tag
  ): boolean;
}
