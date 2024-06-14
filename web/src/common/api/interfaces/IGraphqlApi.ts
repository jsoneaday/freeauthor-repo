import {
  DataUpload,
  EntityType,
  FollowModel,
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

export interface IGraphqlApi {
  removeDeletedRecords(
    response: IrysGraphqlResponse | null,
    entityType: EntityType
  ): IrysGraphqlResponse;

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

  convertGqlResponseToTopic(response: IrysGraphqlResponse | null): TopicModel[];

  convertGqlResponseToWorkTopic(
    response: IrysGraphqlResponse | null
  ): WorkTopicModel[];

  convertGqlResponseToFollow(
    response: IrysGraphqlResponse | null
  ): FollowModel[];

  convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkWithAuthorModel>;

  convertGqlNodeToWorkResponse(
    response: IrysGraphqlResponseNode,
    data: string | null
  ): WorkResponseModel;

  convertGqlNodeToProfile(
    response: IrysGraphqlResponseNode,
    data: ArrayBuffer | null
  ): ProfileModel;

  convertGqlNodeToWork(
    response: IrysGraphqlResponseNode,
    data: DataUpload
  ): WorkModel;
}
