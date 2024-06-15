import { PAGE_SIZE } from "../../utils/StandardValues";
import { ICommonApi } from "../interfaces/ICommonApi";
import { IGraphqlApi } from "../interfaces/IGraphqlApi";
import { IReadApi } from "../interfaces/IReadApi";
import { DESC, SEARCH_TX } from "./IrysCommon";
import { IrysGraphql } from "./IrysGraphql";
import {
  convertModelsToWorkWithAuthor,
  convertQueryToProfile,
  convertQueryToWork,
} from "./models/ApiModelConverters";
import {
  AppTagNames,
  BaseQueryTags,
  DataUpload,
  EntityType,
  FollowModel,
  FollowerTagNames,
  InputTag,
  IrysGraphqlResponse,
  IrysGraphqlResponseNode,
  IrysGraphqlVariables,
  PagedProfileModel,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  QueryResponse,
  TopicModel,
  WorkLikeTagNames,
  WorkModel,
  WorkResponseModel,
  WorkResponseModelWithProfile,
  WorkTagNames,
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

  async #convertQueryToWorkWithAuthors(queryResponse: QueryResponse[]) {
    const _queryResp = this.#irysCommon.removeDeletedRecords(
      queryResponse,
      EntityType.Work
    );
    const workWithAuthors: WorkWithAuthorModel[] = new Array(_queryResp.length);
    for (let i = 0; i < _queryResp.length; i++) {
      workWithAuthors[i] = await this.#convertQueryToWorkWithAuthor(
        _queryResp[i]
      );
    }
    return workWithAuthors;
  }

  async #convertQueryToWorkWithAuthor(queryResp: QueryResponse) {
    const data = await this.#irysCommon.getData(queryResp.id, true);
    const workModel = convertQueryToWork(queryResp, data);
    workModel.content = data as string;
    const likeCount = await this.getWorkLikeCount(workModel.id);
    const profileModel = await this.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
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
    console.log("variables", variables);
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

  async getWork(workId: string): Promise<WorkWithAuthorModel | null> {
    const workQueryResponse = await this.#IrysQuery
      .search(SEARCH_TX)
      .ids([workId])
      .sort(DESC)
      .limit(1);

    if (workQueryResponse.length > 0) {
      return this.#convertQueryToWorkWithAuthor(workQueryResponse[0]);
    }
    return null;
  }

  async searchWorksTop(
    searchTxt: string
  ): Promise<WorkWithAuthorModel[] | null> {
    const workResponses: QueryResponse[] = await this.#IrysQuery
      .search(SEARCH_TX)
      .tags([
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.Description, values: [searchTxt] },
      ])
      .sort(DESC)
      .limit(PAGE_SIZE);

    const works: WorkWithAuthorModel[] =
      await this.#convertQueryToWorkWithAuthors(workResponses);

    return works.sort((a, b) => {
      if (a.likes > b.likes) return -1;
      if (a.likes < b.likes) return 1;
      return 0;
    });
  }

  async searchWorks(
    searchTxt: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.Description, values: [searchTxt] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
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

  async getWorksByAllFollowed(
    followerId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const followsResp = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Follow] },
        { name: FollowerTagNames.FollowerId, values: [followerId] },
      ],
    });
    const followModels = this.#IrysGql.convertGqlResponseToFollow(followsResp);

    const tags: InputTag[] = new Array(4);
    tags[0] = { name: AppTagNames.EntityType, values: [EntityType.Work] };
    tags[1] = {
      name: WorkTagNames.AuthorId,
      values: followModels.map((follow) => follow.followed_id),
    };
    tags[2] = BaseQueryTags[0];
    tags[3] = BaseQueryTags[1];

    const worksResp = await this.#IrysGql.queryGraphQL({
      tags,
      limit: pageSize,
      cursor,
    });

    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(worksResp);
  }

  async getWorksByAllFollowedTop(
    followerId: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    let works = await this.getWorksByAllFollowed(followerId, PAGE_SIZE);
    works?.workModels.sort((a, b) => {
      if (a.likes > b.likes) return -1;
      if (a.likes < b.likes) return 1;
      return 0;
    });
    return works;
  }

  async getWorksByOneFollowed(
    followedId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const tags: InputTag[] = new Array(4);
    tags[0] = { name: AppTagNames.EntityType, values: [EntityType.Work] };
    tags[1] = {
      name: WorkTagNames.AuthorId,
      values: [followedId],
    };
    tags[2] = BaseQueryTags[0];
    tags[3] = BaseQueryTags[1];

    const worksResp = await this.#IrysGql.queryGraphQL({
      tags,
      limit: pageSize,
      cursor,
    });

    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(worksResp);
  }

  async getWorksByOneFollowedTop(
    followedId: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    return await this.getWorksByOneFollowed(followedId, PAGE_SIZE);
  }
}
