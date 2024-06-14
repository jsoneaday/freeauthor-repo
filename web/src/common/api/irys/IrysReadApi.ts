import { PAGE_SIZE } from "../../utils/StandardValues";
import { ICommonApi } from "../interfaces/ICommonApi";
import { IGraphqlApi } from "../interfaces/IGraphqlApi";
import { IReadApi } from "../interfaces/IReadApi";
import { DESC, SEARCH_TX } from "./IrysCommon";
import { IrysGraphql } from "./IrysGraphql";
import { convertQueryToProfile } from "./models/ApiModelConverters";
import {
  AppTagNames,
  BaseQueryTags,
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
  WorkLikeTagNames,
  WorkModel,
  WorkResponseModel,
  WorkResponseModelWithProfile,
  WorkTopicModel,
  WorkTopicTagNames,
  WorkWithAuthorModel,
} from "./models/ApiModels";
import Query from "@irys/query";

export class IrysReadApi implements IReadApi {
  #irysCommon: ICommonApi;
  #irysGraphql?: IGraphqlApi;
  get #IrysGql(): IGraphqlApi {
    if (!this.#irysGraphql) {
      this.#irysGraphql = new IrysGraphql(this.#irysCommon, this);
    }
    return this.#irysGraphql;
  }

  constructor(common: ICommonApi) {
    this.#irysCommon = common;
  }

  removeDeletedRecords(
    response: IrysGraphqlResponse | null,
    entityType: EntityType
  ): IrysGraphqlResponse {
    return this.#IrysGql.removeDeletedRecords(response, entityType);
  }

  async queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null> {
    return await this.#IrysGql.queryGraphQL(variables);
  }

  async convertGqlResponseToWorkResponse(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkResponseModel | null> {
    return await this.#IrysGql.convertGqlResponseToWorkResponse(searchResults);
  }

  async convertGqlResponseNodeToWorkResponse(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkResponseModelWithProfile> {
    return await this.#IrysGql.convertGqlResponseNodeToWorkResponse(
      gqlResponse
    );
  }

  async convertGqlResponseToProfile(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedProfileModel | null> {
    return await this.#IrysGql.convertGqlResponseToProfile(searchResults);
  }

  async convertGqlResponseNodeToProfile(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<ProfileModel> {
    return await this.#IrysGql.convertGqlResponseNodeToProfile(gqlResponse);
  }

  async convertGqlResponseToWorkWithAuthor(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkWithAuthorModel | null> {
    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
  }

  convertGqlResponseToTopic(
    response: IrysGraphqlResponse | null
  ): TopicModel[] {
    return this.#IrysGql.convertGqlResponseToTopic(response);
  }

  convertGqlResponseToWorkTopic(
    response: IrysGraphqlResponse | null
  ): WorkTopicModel[] {
    return this.#IrysGql.convertGqlResponseToWorkTopic(response);
  }

  convertGqlResponseToFollow(
    response: IrysGraphqlResponse | null
  ): FollowModel[] {
    return this.#IrysGql.convertGqlResponseToFollow(response);
  }

  async convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkWithAuthorModel> {
    return await this.#IrysGql.convertGqlResponseNodeToWorkWithAuthor(
      gqlResponse
    );
  }

  convertGqlNodeToWorkResponse(
    response: IrysGraphqlResponseNode,
    data: string | null
  ): WorkResponseModel {
    return this.#IrysGql.convertGqlNodeToWorkResponse(response, data);
  }

  convertGqlNodeToProfile(
    response: IrysGraphqlResponseNode,
    data: ArrayBuffer | null
  ): ProfileModel {
    return this.#IrysGql.convertGqlNodeToProfile(response, data);
  }

  convertGqlNodeToWork(
    response: IrysGraphqlResponseNode,
    data: DataUpload
  ): WorkModel {
    return this.#IrysGql.convertGqlNodeToWork(response, data);
  }

  #irysQuery?: Query;
  get #IrysQuery() {
    if (!this.#irysQuery) {
      this.#irysQuery = new Query({ network: this.#irysCommon.Network });
    }
    return this.#irysQuery;
  }

  async getProfile(profileId: string): Promise<ProfileModel | null> {
    const result = await this.#IrysQuery
      .search(SEARCH_TX)
      .ids([profileId])
      .sort(DESC);

    const data = await this.#irysCommon.getData(result[0].id, false);

    return convertQueryToProfile(result[0], data as ArrayBuffer | null);
  }

  async getAllTopics(): Promise<TopicModel[]> {
    const response = await this.#IrysQuery
      .search(SEARCH_TX)
      .tags([
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Topic] },
      ])
      .sort(DESC)
      .limit(PAGE_SIZE);

    return this.#irysCommon.convertQueryToTopics(response) || [];
  }

  async getWorksByTopic(
    topicId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const workTopicResponse = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkTopic] },
        { name: WorkTopicTagNames.TopicId, values: [topicId] },
      ],
      limit: pageSize,
      cursor,
    });

    const workTopics =
      this.#IrysGql.convertGqlResponseToWorkTopic(workTopicResponse);

    const worksResponse = await this.#IrysGql.queryGraphQL({
      ids: workTopics.map((wt) => wt.work_id),
      limit: pageSize,
    });

    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(
      worksResponse
    );
  }

  async getWorksByTopicTop(
    topicId: string,
    pageSize?: number
  ): Promise<PagedWorkWithAuthorModel | null> {
    const response = await this.getWorksByTopic(
      topicId,
      pageSize ? pageSize : PAGE_SIZE
    );
    response?.workModels.sort((a, b) => {
      if (a.likes > b.likes) return -1;
      if (a.likes < b.likes) return 1;
      return 0;
    });
    return response;
  }

  async getWorkLikeCount(workId: string): Promise<number> {
    const likesResp = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkLike] },
        { name: WorkLikeTagNames.WorkId, values: [workId] },
      ],
    });

    const likes = this.#IrysGql.removeDeletedRecords(
      likesResp,
      EntityType.WorkLike
    );

    return likes.data.transactions.edges.length;
  }
}
