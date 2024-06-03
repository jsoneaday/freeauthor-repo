import {
  DataUpload,
  EntityType,
  IrysGraphqlResponse,
  IrysGraphqlResponseNode,
  ProfileModel,
  TopicModel,
  WorkModel,
  WorkResponseModel,
  WorkTopicModel,
} from "../irys/ApiModels";

export interface IGraphql {
  convertGqlQueryToWorkResponse(
    response: IrysGraphqlResponseNode,
    data: string | null
  ): WorkResponseModel;

  convertGqlQueryToProfile(
    response: IrysGraphqlResponseNode,
    data: ArrayBuffer | null
  ): ProfileModel;

  convertGqlQueryToWork(
    response: IrysGraphqlResponseNode,
    data: DataUpload
  ): WorkModel;

  convertGqlQueryToTopic(response: IrysGraphqlResponse | null): TopicModel[];

  convertGqlQueryToWorkTopic(
    response: IrysGraphqlResponse | null,
    entityType: EntityType
  ): WorkTopicModel[];
}
