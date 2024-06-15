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
  EntityType,
  FollowerTagNames,
  InputTag,
  IrysGraphqlResponse,
  IrysGraphqlVariables,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  QueryResponse,
  TopicModel,
  WorkLikeTagNames,
  WorkResponderTagNames,
  WorkTagNames,
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

  /// getFollowed decides whether to return a list of followed or follower
  async #getFollowProfiles(profileId: string, getFollowed: boolean) {
    const searchTags: InputTag[] = [
      ...BaseQueryTags,
      { name: AppTagNames.EntityType, values: [EntityType.Follow] },
    ];
    if (getFollowed) {
      searchTags.push({
        name: FollowerTagNames.FollowerId,
        values: [profileId],
      });
    } else {
      searchTags.push({
        name: FollowerTagNames.FollowedId,
        values: [profileId],
      });
    }
    let responses: QueryResponse[] = await this.#IrysQuery
      .search(SEARCH_TX)
      .tags(searchTags)
      .sort(DESC);
    responses = this.#irysCommon.removeDeletedRecords(
      responses,
      EntityType.Follow
    );

    const follow: ProfileModel[] = new Array(responses.length);
    let filterTagValue = FollowerTagNames.FollowedId;
    if (!getFollowed) {
      filterTagValue = FollowerTagNames.FollowerId;
    }
    for (let i = 0; i < responses.length; i++) {
      const followId = responses[i].tags.find(
        (tag) => tag.name === filterTagValue
      )!.value;
      const profileModel = await this.getProfile(followId);
      if (!profileModel)
        throw new Error(`Follow ProfileModel ${followId} was not found!`);
      follow[i] = profileModel;
    }

    return follow;
  }

  #irysQuery?: Query;
  get #IrysQuery() {
    if (!this.#irysQuery) {
      this.#irysQuery = new Query({ network: this.#irysCommon.Network });
    }
    return this.#irysQuery;
  }

  async queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null> {
    return await this.#IrysGql.queryGraphQL(variables);
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
      .sort(DESC);

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

  async getAuthorWorks(
    authorId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#IrysGql.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
  }

  async getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
    });

    const works = await this.#IrysGql.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
    if (!works) {
      return null;
    }
    works.workModels.sort((a, b) => {
      if (a.likes > b.likes) return -1;
      if (a.likes < b.likes) return 1;
      return 0;
    });
    return works;
  }

  async getFollowedProfiles(
    followerId: string
  ): Promise<ProfileModel[] | null> {
    return this.#getFollowProfiles(followerId, true);
  }

  async getFollowerProfiles(
    followedId: string
  ): Promise<ProfileModel[] | null> {
    return this.#getFollowProfiles(followedId, false);
  }

  async getFollowedCount(profileId: string): Promise<number> {
    return (await this.getFollowedProfiles(profileId))?.length || 0;
  }

  async getFollowerCount(profileId: string): Promise<number> {
    return (await this.getFollowerProfiles(profileId))?.length || 0;
  }

  async getWorkResponses(
    workId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null> {
    const response = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkResponderTagNames.WorkId, values: [workId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#IrysGql.convertGqlResponseToWorkResponse(response);
  }

  /// todo: needs an update to include likes or I might not have response likes altogether
  async getWorkResponsesTop(
    workId: string,
    pageSize: number = PAGE_SIZE
  ): Promise<PagedWorkResponseModel | null> {
    return await this.getWorkResponses(workId, pageSize);
  }

  async getWorkResponsesByProfile(
    profileId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null> {
    const response = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkResponderTagNames.ResponderId, values: [profileId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#IrysGql.convertGqlResponseToWorkResponse(response);
  }

  /// todo: needs an update to include likes or I might not have response likes altogether
  async getWorkResponsesByProfileTop(
    profileId: string,
    pageSize: number = PAGE_SIZE
  ): Promise<PagedWorkResponseModel | null> {
    return await this.getWorkResponsesByProfile(profileId, pageSize);
  }

  async getWorkResponseCount(workId: string): Promise<number> {
    return (
      (await this.getWorkResponses(workId))?.workResponseModels.length || 0
    );
  }

  async getTopicsByWork(workId: string): Promise<TopicModel[] | null> {
    const workTopicResponse = await this.#IrysGql.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkTopic] },
        { name: WorkTopicTagNames.WorkId, values: [workId] },
      ],
    });

    const workTopics =
      this.#IrysGql.convertGqlResponseToWorkTopic(workTopicResponse);
    const allTopicModels = await this.getAllTopics();
    const topics: TopicModel[] = new Array(workTopics.length);

    for (let i = 0; i < workTopics.length; i++) {
      topics[i] = allTopicModels.find(
        (topic) => topic.id === workTopics[i].topic_id
      )!;
    }
    return topics;
  }
}
