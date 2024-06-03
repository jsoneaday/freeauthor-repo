import {
  DataUpload,
  EntityType,
  IrysGraphqlResponse,
  IrysGraphqlResponseNode,
  IrysGraphqlVariables,
  PagedProfileModel,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
  WorkModel,
  WorkResponseModel,
  WorkResponseModelWithProfile,
  WorkTopicModel,
  WorkWithAuthorModel,
} from "../irys/models/ApiModels";

export interface IGraphql {
  queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null>;

  convertGqlResponseToWorkResponse(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkResponseModel | null>;

  convertGqlResponseNodeToWorkResponse(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkResponseModelWithProfile>;

  convertGqlResponseToProfile(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedProfileModel | null>;

  convertGqlResponseNodeToProfile(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<ProfileModel>;

  convertGqlResponseToWorkWithAuthor(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkWithAuthorModel | null>;

  convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkWithAuthorModel>;

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
