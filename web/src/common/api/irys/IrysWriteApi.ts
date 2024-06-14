import {
  Avatar,
  BaseTags,
  ProfileModel,
  Tag,
  TopicModel,
  WorkWithAuthorModel,
  QueryResponse,
  TxValidationMetadata,
  EntityType,
  AppTagNames,
  WorkTagNames,
  TopicTagNames,
  ProfileTagNames,
  WorkResponderTagNames,
  FollowerTagNames,
  WorkLikeTagNames,
  PagedWorkWithAuthorModel,
  PagedWorkResponseModel,
  InputTag,
  WorkTopicTagNames,
  ActionName,
  ActionType,
  BaseQueryTags,
} from "./models/ApiModels";
import { IWriteApi } from "../interfaces/IWriteApi";
import { WebIrys } from "@irys/sdk";
import SolanaConfig from "@irys/sdk/node/tokens/solana";
import { BaseWebIrys } from "@irys/sdk/web/base";
import { type WebToken } from "@irys/sdk/web/types";
import Query from "@irys/query";
import { RPC_URL, TOKEN, TX_METADATA_URL } from "../../Env";
import bs58 from "bs58";
import { UploadResponse } from "@irys/sdk/common/types";
import { ICommonApi } from "../interfaces/ICommonApi";
import { DESC, SEARCH_TX } from "./IrysCommon";
import {
  convertModelsToWorkWithAuthor,
  convertQueryToWork,
} from "./models/ApiModelConverters";
import { PAGE_SIZE } from "../../utils/StandardValues";
import { IReadApi } from "../interfaces/IReadApi";

/// Note all entity id are the transaction id on Irys
export class IrysWriteApi implements IWriteApi {
  #irys?: WebIrys | BaseWebIrys;
  get #Irys() {
    if (!this.#irys) throw new Error("#irys is not set yet!");
    return this.#irys;
  }

  #irysQuery?: Query;
  get #IrysQuery() {
    if (!this.#irysQuery) {
      this.#irysQuery = new Query({ network: this.#irysCommon.Network });
    }
    return this.#irysQuery;
  }

  #address?: string;
  get Address() {
    if (!this.#address) throw new Error("#address is not set yet!");
    return this.#address;
  }

  #wallet?: { rpcUrl: string; name: string; provider: object };

  #irysCommon: ICommonApi;
  #irysRead: IReadApi;

  constructor(common: ICommonApi, irysRead: IReadApi) {
    this.#irysCommon = common;
    this.#irysRead = irysRead;
  }

  async isConnected(): Promise<boolean> {
    return this.#irys ? true : false;
  }

  async disconnect() {
    this.#irys = undefined;
    this.#address = undefined;
  }

  /// connection is only needed for write
  /// Notice call is async and therefore cannot be run validly from constructor
  /// if no walletProvider assumed wallet coming from file
  async connect(walletProvider?: object | null): Promise<void> {
    if (walletProvider) {
      this.#wallet = {
        rpcUrl: RPC_URL,
        name: TOKEN,
        provider: walletProvider,
      };
      const webIrys = new WebIrys({
        network: this.#irysCommon.Network,
        token: this.#irysCommon.Token,
        wallet: this.#wallet,
      });
      this.#irys = await webIrys.ready();
      console.log("WebIrys setup");
    } else {
      const keyBuffer = Uint8Array.from(
        JSON.parse(import.meta.env.VITE_SOLANA_KEY)
      );
      const key = bs58.encode(keyBuffer);

      const irys = new BaseWebIrys({
        network: this.#irysCommon.Network,
        config: {
          providerUrl: RPC_URL,
        },
        getTokenConfig: (irys): WebToken =>
          new SolanaConfig({
            irys,
            name: this.#irysCommon.Token,
            ticker: this.#getTickerFromToken(),
            minConfirm: 1,
            providerUrl: RPC_URL,
            wallet: key,
          }) as unknown as WebToken,
      });
      this.#irys = await irys.ready();
      console.log("BaseWebIrys setup");
    }

    this.#address = this.#irys.address;
  }

  #getTickerFromToken() {
    if (this.#irysCommon.Token === "solana") {
      return "SOL";
    }
    throw new Error(`${this.#irysCommon.Token}'s ticker not implemented`);
  }

  async #fundText(content: string) {
    const contentSize = this.#getByteSizeOfString(content);
    const fundingAmount = await this.#Irys.getPrice(contentSize);

    await this.#Irys.fund(fundingAmount);
  }

  async #fundFile(file: File) {
    await this.#Irys.fund(await this.#Irys.getPrice(file.size));
  }

  #getByteSizeOfString(content: string): number {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(content);
    return encodedString.length;
  }

  async #uploadText(
    content: string,
    tags: Tag[],
    fund: boolean
  ): Promise<UploadResponse> {
    console.log("upload text", content);
    if (fund) await this.#fundText(content);

    return await this.#Irys.upload(content, {
      tags: [...BaseTags, ...tags],
    });
  }

  async #uploadFile(
    file: File,
    tags: Tag[],
    fund: boolean
  ): Promise<UploadResponse> {
    if (fund) await this.#fundFile(file);
    return await (this.#Irys as WebIrys).uploadFile(file, {
      tags: [...BaseTags, ...tags],
    });
  }

  async #isEntityOwner(
    txId: string,
    verificationAddress: string
  ): Promise<boolean> {
    const result = await fetch(`${TX_METADATA_URL}/${txId}`);
    if (result.ok) {
      const txMeta: TxValidationMetadata = await result.json();

      return txMeta.address === verificationAddress;
    }
    return false;
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
    const likeCount = await this.#irysRead.getWorkLikeCount(workModel.id);
    const profileModel = await this.#irysRead.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
  }

  async arbitraryFund(amount: number): Promise<void> {
    this.#Irys.fund(amount);
  }

  async balance(): Promise<number> {
    return this.#Irys.utils
      .fromAtomic(await this.#Irys.getLoadedBalance())
      .toNumber();
  }

  async addWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    let _desc = !description
      ? content.substring(0, content.length < 20 ? content.length : 20)
      : description;

    const tags = [
      { name: AppTagNames.ContentType, value: "text/html" },
      { name: AppTagNames.EntityType, value: EntityType.Work },
      { name: ActionName, value: action },
      { name: WorkTagNames.Title, value: title },
      { name: WorkTagNames.Description, value: _desc },
      { name: WorkTagNames.AuthorId, value: authorId },
    ];

    return await this.#uploadText(content, tags, fund);
  }

  async updateWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    priorWorkId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    if (!(await this.#isEntityOwner(priorWorkId, this.Address))) {
      throw new Error("This user is not the original entity creator and owner");
    }
    return await this.addWork(
      title,
      description,
      content,
      authorId,
      ActionType.Update,
      fund
    );
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
    const searchResults = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.Description, values: [searchTxt] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#irysRead.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
  }

  async getWorksByAllFollowed(
    followerId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const followsResp = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Follow] },
        { name: FollowerTagNames.FollowerId, values: [followerId] },
      ],
    });
    const followModels = this.#irysRead.convertGqlResponseToFollow(followsResp);

    const tags: InputTag[] = new Array(4);
    tags[0] = { name: AppTagNames.EntityType, values: [EntityType.Work] };
    tags[1] = {
      name: WorkTagNames.AuthorId,
      values: followModels.map((follow) => follow.followed_id),
    };
    tags[2] = BaseQueryTags[0];
    tags[3] = BaseQueryTags[1];

    const worksResp = await this.#irysRead.queryGraphQL({
      tags,
      limit: pageSize,
      cursor,
    });

    return await this.#irysRead.convertGqlResponseToWorkWithAuthor(worksResp);
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

    const worksResp = await this.#irysRead.queryGraphQL({
      tags,
      limit: pageSize,
      cursor,
    });

    return await this.#irysRead.convertGqlResponseToWorkWithAuthor(worksResp);
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
    const searchResults = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#irysRead.convertGqlResponseToWorkWithAuthor(
      searchResults
    );
  }

  async getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
    });

    const works = await this.#irysRead.convertGqlResponseToWorkWithAuthor(
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

  async addProfile(
    userName: string,
    fullName: string,
    description: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse> {
    const tags: Tag[] = [
      { name: AppTagNames.EntityType, value: EntityType.Profile },
      { name: ActionName, value: action },
      { name: ProfileTagNames.UserName, value: userName },
      { name: ProfileTagNames.FullName, value: fullName },
      { name: ProfileTagNames.Description, value: description },
      { name: ProfileTagNames.OwnerAddress, value: this.Address },
    ];

    if (avatar) {
      tags.push({
        name: AppTagNames.ContentType,
        value: `image/${avatar.fileExtension}`,
      });
    } else {
      tags.push({ name: AppTagNames.ContentType, value: "empty" });
    }
    if (socialLinkPrimary) {
      tags.push({
        name: ProfileTagNames.SocialLinkPrimary,
        value: socialLinkPrimary,
      });
    }
    if (socialLinkSecondary) {
      tags.push({
        name: ProfileTagNames.SocialLinkSecondary,
        value: socialLinkSecondary,
      });
    }

    if (!avatar) {
      return await this.#uploadText("", tags, fund);
    }
    return await this.#uploadFile(avatar.file, tags, fund);
  }

  async updateProfile(
    profileId: string,
    userName: string,
    fullName: string,
    description: string,
    fund: boolean = false,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse> {
    if (!(await this.#isEntityOwner(profileId, this.Address))) {
      throw new Error("This user is not the original entity creator and owner");
    }
    return await this.addProfile(
      userName,
      fullName,
      description,
      ActionType.Update,
      fund,
      socialLinkPrimary,
      socialLinkSecondary,
      avatar
    );
  }

  async getOwnersProfile(): Promise<ProfileModel | null> {
    const searchResults = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Profile] },
        { name: ProfileTagNames.OwnerAddress, values: [this.Address] },
      ],
      limit: 1,
    });

    if (!searchResults || searchResults.data.transactions.edges.length === 0)
      return null;
    const node = searchResults.data.transactions.edges[0].node;
    const data = await this.#irysCommon.getData(node.id, false);
    return {
      id: node.id,
      updated_at: node.timestamp,
      username: node.tags.find((tag) => tag.name === ProfileTagNames.UserName)!
        .value,
      fullname: node.tags.find((tag) => tag.name === ProfileTagNames.FullName)!
        .value,
      description: node.tags.find(
        (tag) => tag.name === ProfileTagNames.Description
      )!.value,
      owner_address: node.tags.find(
        (tag) => tag.name === ProfileTagNames.OwnerAddress
      )!.value,
      social_link_primary: node.tags.find(
        (tag) => tag.name === ProfileTagNames.SocialLinkPrimary
      )?.value,
      social_link_second: node.tags.find(
        (tag) => tag.name === ProfileTagNames.SocialLinkSecondary
      )?.value,
      avatar: data as ArrayBuffer,
    };
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
      const profileModel = await this.#irysRead.getProfile(followId);
      if (!profileModel)
        throw new Error(`Follow ProfileModel ${followId} was not found!`);
      follow[i] = profileModel;
    }

    return follow;
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

  async addWorkResponse(
    content: string,
    workId: string,
    responderId: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "text/html" },
      { name: AppTagNames.EntityType, value: EntityType.WorkResponse },
      { name: ActionName, value: action },
      { name: WorkResponderTagNames.WorkId, value: workId },
      { name: WorkResponderTagNames.ResponderId, value: responderId },
    ];

    return await this.#uploadText(content, tags, fund);
  }

  async getWorkResponses(
    workId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null> {
    const response = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkResponderTagNames.WorkId, values: [workId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#irysRead.convertGqlResponseToWorkResponse(response);
  }

  /// todo: needs an update to include likes or I might not have response likes altogether
  async getWorkResponsesTop(
    workId: string,
    pageSize: number
  ): Promise<PagedWorkResponseModel | null> {
    return await this.getWorkResponses(workId, pageSize);
  }

  async getWorkResponsesByProfile(
    profileId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null> {
    const response = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkResponderTagNames.ResponderId, values: [profileId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#irysRead.convertGqlResponseToWorkResponse(response);
  }

  /// todo: needs an update to include likes or I might not have response likes altogether
  async getWorkResponsesByProfileTop(
    profileId: string,
    pageSize: number
  ): Promise<PagedWorkResponseModel | null> {
    return await this.getWorkResponsesByProfile(profileId, pageSize);
  }

  async addFollow(
    followerId: string,
    followedId: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.Follow },
      { name: ActionName, value: action },
      { name: FollowerTagNames.FollowerId, value: followerId },
      { name: FollowerTagNames.FollowedId, value: followedId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeFollow(
    followerId: string,
    followedId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return await this.addFollow(
      followerId,
      followedId,
      ActionType.Remove,
      fund
    );
  }

  async addTopic(
    name: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.Topic },
      { name: ActionName, value: action },
      { name: TopicTagNames.TopicName, value: name },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeTopic(
    name: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return await this.addTopic(name, ActionType.Remove, fund);
  }

  async addWorkTopic(
    topicId: string,
    workId: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: ActionName, value: action },
      { name: AppTagNames.EntityType, value: EntityType.WorkTopic },
      { name: WorkTopicTagNames.TopicId, value: topicId },
      { name: WorkTopicTagNames.WorkId, value: workId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeWorkTopic(
    topicId: string,
    workId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return await this.addWorkTopic(topicId, workId, ActionType.Remove, fund);
  }

  async addWorkLike(
    workId: string,
    likerId: string,
    action: ActionType = ActionType.Add,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.WorkLike },
      { name: ActionName, value: action },
      { name: WorkLikeTagNames.WorkId, value: workId },
      { name: WorkLikeTagNames.LikerId, value: likerId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeWorkLike(
    workId: string,
    likerId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return await this.addWorkLike(workId, likerId, ActionType.Remove, fund);
  }

  async getWorkResponseCount(workId: string): Promise<number> {
    return (
      (await this.getWorkResponses(workId))?.workResponseModels.length || 0
    );
  }

  async getFollowedCount(profileId: string): Promise<number> {
    return (await this.getFollowedProfiles(profileId))?.length || 0;
  }

  async getFollowerCount(profileId: string): Promise<number> {
    return (await this.getFollowerProfiles(profileId))?.length || 0;
  }

  async getTopicsByWork(workId: string): Promise<TopicModel[] | null> {
    const workTopicResponse = await this.#irysRead.queryGraphQL({
      tags: [
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.WorkTopic] },
        { name: WorkTopicTagNames.WorkId, values: [workId] },
      ],
    });

    const workTopics =
      this.#irysRead.convertGqlResponseToWorkTopic(workTopicResponse);
    const allTopicModels = await this.#irysRead.getAllTopics();
    const topics: TopicModel[] = new Array(workTopics.length);

    for (let i = 0; i < workTopics.length; i++) {
      topics[i] = allTopicModels.find(
        (topic) => topic.id === workTopics[i].topic_id
      )!;
    }
    return topics;
  }
}
