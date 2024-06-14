import {
  DataUpload,
  EntityType,
  QueryResponse,
  Tag,
  TopicModel,
} from "../irys/models/ApiModels";

export interface ICommonApi {
  get Network(): string;
  set Network(val: string);
  get Token(): string;
  set Token(val: string);

  convertQueryToTopics(queryResponse: QueryResponse[]): Promise<TopicModel[]>;

  removeDeletedRecords(
    response: QueryResponse[] | null,
    entityType: EntityType
  ): QueryResponse[];

  getData(entityTxId: string, isTextData: boolean): Promise<DataUpload>;

  tagsMatchByEntityType(
    entityType: EntityType,
    checkTag: Tag,
    searchTag: Tag
  ): boolean;
}
