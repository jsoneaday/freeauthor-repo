import {
  Avatar,
  BaseTags,
  ProfileModel,
  Tag,
  TopicModel,
  WorkModel,
  WorkResponseModel,
  WorkTopicModel,
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
  LikeTagNames,
  IrysGraphqlVariables,
  IrysGraphqlResponse,
  DataUpload,
  IrysGraphqlResponseNode,
  PagedWorkWithAuthorModel,
  PagedProfileModel,
  PagedWorkResponseModel,
  WorkResponseModelWithProfile,
  InputTag,
  WorkTopicTagNames,
} from "./ApiModels";
import { IApi } from "./IApi";
import { WebIrys } from "@irys/sdk";
import SolanaConfig from "@irys/sdk/node/tokens/solana";
import { BaseWebIrys } from "@irys/sdk/web/base";
import { type WebToken } from "@irys/sdk/web/types";
import Query from "@irys/query";
import {
  IRYS_DATA_URL,
  IRYS_GRAPHQL_URL,
  RPC_URL,
  TOKEN,
  TX_METADATA_URL,
} from "../Env";
import bs58 from "bs58";
import { UploadResponse } from "@irys/sdk/common/types";

const DESC = "DESC";
//const ASC = "ASC";
const SEARCH_TX = "irys:transactions";

/// Note all entity id are the transaction id on Irys
export class IrysApi implements IApi {
  #irys?: WebIrys | BaseWebIrys;
  get #Irys() {
    if (!this.#irys) throw new Error("#webIrys is not set yet!");
    return this.#irys;
  }
  #query?: Query;
  get #Query() {
    if (!this.#query) throw new Error("#query is not set yet!");
    return this.#query;
  }
  #address?: string;
  get Address() {
    if (!this.#address) throw new Error("#address is not set yet!");
    return this.#address;
  }
  #network = "devnet";
  #token = "solana";
  #wallet?: { rpcUrl: string; name: string; provider: object };

  async isConnected(): Promise<boolean> {
    return this.#irys ? true : false;
  }

  /// if no walletProvider assumed wallet coming from file
  async connect(walletProvider?: object): Promise<void> {
    if (walletProvider) {
      this.#wallet = {
        rpcUrl: RPC_URL,
        name: TOKEN,
        provider: walletProvider,
      };
      const webIrys = new WebIrys({
        network: this.#network,
        token: this.#token,
        wallet: this.#wallet,
      });
      this.#irys = await webIrys.ready();
    } else {
      const keyBuffer = Uint8Array.from(
        JSON.parse(import.meta.env.VITE_SOLANA_KEY)
      );
      const key = bs58.encode(keyBuffer);

      const irys = new BaseWebIrys({
        network: this.#network,
        config: {
          providerUrl: RPC_URL,
        },
        getTokenConfig: (irys): WebToken =>
          new SolanaConfig({
            irys,
            name: "solana",
            ticker: "SOL",
            minConfirm: 1,
            providerUrl: RPC_URL,
            wallet: key,
          }) as unknown as WebToken,
      });
      this.#irys = await irys.ready();
    }

    this.#address = this.#irys.address;

    this.#query = new Query({ network: this.#network });
  }

  async #fundText(content: string) {
    const contentSize = this.#getByteSizeOfString(content);
    const fundingAmount = await this.#Irys.getPrice(contentSize);
    console.log("funding needed:", fundingAmount);
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

  async #convertQueryToWorkWithModel(queryResp: QueryResponse) {
    const data = await this.getData(queryResp.id, true);
    const workModel = convertQueryToWork(queryResp, data);
    workModel.content = data as string;
    const likeCount = await this.getWorkLikeCount(workModel.id);
    const profileModel = await this.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
  }

  async #convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ) {
    const data = await this.getData(gqlResponse.id, true);
    const workModel = convertGqlQueryToWork(gqlResponse, data);
    const likeCount = await this.getWorkLikeCount(workModel.id);
    const profileModel = await this.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
  }

  async #convertGqlResponseToWorkWithAuthor(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkWithAuthorModel | null> {
    if (!searchResults) {
      return null;
    }
    const edgeLength = searchResults.data.transactions.edges.length;
    let workModels: WorkWithAuthorModel[] = new Array(edgeLength);
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      workModels[i] = await this.#convertGqlResponseNodeToWorkWithAuthor(
        edge.node
      );
    }
    return {
      workModels,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async #convertGqlResponseNodeToProfile(gqlResponse: IrysGraphqlResponseNode) {
    const data = await this.getData(gqlResponse.id, false);
    return convertGqlQueryToProfile(gqlResponse, data as ArrayBuffer | null);
  }

  async #convertGqlResponseToProfile(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedProfileModel | null> {
    if (!searchResults) {
      return null;
    }
    const edgeLength = searchResults.data.transactions.edges.length;
    let profileModels: ProfileModel[] = new Array(edgeLength);
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      profileModels[i] = await this.#convertGqlResponseNodeToProfile(edge.node);
    }
    return {
      profileModels,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async #convertGqlResponseNodeToWorkResponse(
    gqlResponse: IrysGraphqlResponseNode
  ) {
    const data = await this.getData(gqlResponse.id, false);
    const workResponse = convertGqlQueryToWorkResponse(
      gqlResponse,
      data as string | null
    );
    const profile = await this.getProfile(workResponse.responder_id);
    if (!profile) {
      throw new Error(
        `Responder ${workResponse.responder_id} for work response cannot be found`
      );
    }
    return convertModelsToWorkResponseWithAuthor(workResponse, profile);
  }

  async #convertGqlResponseToWorkResponse(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkResponseModel | null> {
    if (!searchResults) {
      return null;
    }
    const edgeLength = searchResults.data.transactions.edges.length;
    let workResponseModel: WorkResponseModelWithProfile[] = new Array(
      edgeLength
    );
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      workResponseModel[i] = await this.#convertGqlResponseNodeToWorkResponse(
        edge.node
      );
    }
    return {
      workResponseModels: workResponseModel,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async getData(entityTxId: string, isTextData: boolean): Promise<DataUpload> {
    const response = await fetch(`${IRYS_DATA_URL}/${entityTxId}`);

    if (response.ok) {
      if (isTextData) {
        return await response.text();
      }
      return await response.arrayBuffer();
    }
    return null;
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
    topicId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    let _desc = !description
      ? content.substring(0, content.length < 20 ? content.length : 20)
      : description;

    const tags = [
      { name: AppTagNames.ContentType, value: "text/html" },
      { name: AppTagNames.EntityType, value: EntityType.Work },
      { name: WorkTagNames.Title, value: title },
      { name: WorkTagNames.Description, value: _desc },
      { name: WorkTagNames.AuthorId, value: authorId },
      { name: TopicTagNames.TopicId, value: topicId },
    ];

    return await this.#uploadText(content, tags, fund);
  }

  async updateWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string,
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
      topicId,
      fund
    );
  }

  async getWork(workId: string): Promise<WorkWithAuthorModel | null> {
    const workQueryResponse = await this.#Query
      .search(SEARCH_TX)
      .ids([workId])
      .sort(DESC);

    if (workQueryResponse.length > 0) {
      return this.#convertQueryToWorkWithModel(workQueryResponse[0]);
    }
    return null;
  }

  async searchWorksTop(
    searchTxt: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    const workResponses: QueryResponse[] = await this.#Query
      .search(SEARCH_TX)
      .tags([
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.Description, values: [searchTxt] },
      ])
      .sort(DESC)
      .limit(pageSize);

    const works: WorkWithAuthorModel[] = new Array(workResponses.length);
    if (workResponses.length > 0) {
      for (let i = 0; i < workResponses.length; i++) {
        works[i] = await this.#convertQueryToWorkWithModel(workResponses[i]);
      }
    }

    return works.sort((a, b) => {
      if (a.likes > b.likes) return -1;
      if (a.likes < b.likes) return 1;
      return 0;
    });
  }

  async #queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null> {
    const query = this.#buildQuery(variables.limit, variables.cursor);
    const result = await fetch(IRYS_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (result.ok) {
      return await result.json();
    }
    return null;
  }

  #buildQuery(limit?: number, cursor?: string) {
    let outerVariable = "$tags: [TagFilter!]!";
    let innerVariable = `
      tags: $tags      
      order: DESC 
    `;
    if (limit) {
      outerVariable = "$tags: [TagFilter!]!, $limit: Int!";
      innerVariable = `
        tags: $tags
        limit: $limit
        order: DESC
      `;
    }
    if (cursor) {
      outerVariable = "$tags: [TagFilter!]!, $limit: Int!, $cursor: String!";
      innerVariable = `
        tags: $tags
        limit: $limit
        order: DESC
        after: $cursor
      `;
    }

    let query = `
      query Get(${outerVariable}) {
        transactions(
          ${innerVariable}          
        ) {
          edges {
            node {
              id
              address
              token
              receipt {
                deadlineHeight
                signature
                version
              }
              tags {
                name
                value
              }
              timestamp
            }
            cursor
          }
        }
      }
    `;
    return query;
  }

  async searchWorks(
    searchTxt: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.Description, values: [searchTxt] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#convertGqlResponseToWorkWithAuthor(searchResults);
  }

  async getWorksByAllFollowed(
    _followerId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorksByAllFollowedTop(
    _followerId: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorksByOneFollowed(
    _followedId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorksByOneFollowedTop(
    _followedId: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getAuthorWorks(
    authorId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
      cursor,
    });

    return await this.#convertGqlResponseToWorkWithAuthor(searchResults);
  }

  async getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<PagedWorkWithAuthorModel | null> {
    const searchResults = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.Work] },
        { name: WorkTagNames.AuthorId, values: [authorId] },
      ],
      limit: pageSize,
    });

    const works = await this.#convertGqlResponseToWorkWithAuthor(searchResults);
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

  async getWorksByTopic(
    _topicId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorksByTopicTop(
    _topicId: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async addProfile(
    userName: string,
    fullName: string,
    description: string,
    fund: boolean = false,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse> {
    const tags: Tag[] = [
      { name: AppTagNames.EntityType, value: EntityType.Profile },
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
    userName: string,
    fullName: string,
    description: string,
    _priorProfileId: string,
    fund: boolean = false,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse> {
    // todo: find immediate prior profile and match tx id and owner address
    return await this.addProfile(
      userName,
      fullName,
      description,
      fund,
      socialLinkPrimary,
      socialLinkSecondary,
      avatar
    );
  }

  async getProfile(profileId: string): Promise<ProfileModel | null> {
    const result = await this.#Query
      .search(SEARCH_TX)
      .ids([profileId])
      .sort(DESC);

    const data = await this.getData(result[0].id, false);

    return convertQueryToProfile(result[0], data as ArrayBuffer | null);
  }

  async getOwnersProfile(): Promise<PagedProfileModel | null> {
    const searchResults = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.Profile] },
        { name: ProfileTagNames.OwnerAddress, values: [this.Address] },
      ],
      limit: 1,
    });

    return await this.#convertGqlResponseToProfile(searchResults);
  }

  async #getFollowProfiles(profileId: string, getFollowed: boolean) {
    const searchTags: InputTag[] = [
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
    const responses: QueryResponse[] = await this.#Query
      .search(SEARCH_TX)
      .tags(searchTags);

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
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "text/html" },
      { name: AppTagNames.EntityType, value: EntityType.WorkResponse },
      { name: WorkTagNames.WorkId, value: workId },
      { name: WorkResponderTagNames.ResponderId, value: responderId },
    ];

    return await this.#uploadText(content, tags, fund);
  }

  async getWorkResponses(
    workId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null> {
    const response = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkTagNames.WorkId, values: [workId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#convertGqlResponseToWorkResponse(response);
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
    const response = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.WorkResponse] },
        { name: WorkResponderTagNames.ResponderId, values: [profileId] },
      ],
      limit: pageSize,
      cursor,
    });
    return await this.#convertGqlResponseToWorkResponse(response);
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
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.Follow },
      { name: FollowerTagNames.FollowerId, value: followerId },
      { name: FollowerTagNames.FollowedId, value: followedId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeFollow(
    _followerId: string,
    _followedId: string
  ): Promise<UploadResponse> {
    throw new Error("Not implemented");
  }

  async addTopic(name: string, fund: boolean = false): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.Topic },
      { name: TopicTagNames.TopicName, value: name },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeTopic(_name: string): Promise<UploadResponse> {
    throw new Error("Not implemented");
  }

  async addWorkTopic(
    topicId: string,
    workId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.WorkTopic },
      { name: WorkTopicTagNames.TopicId, value: topicId },
      { name: WorkTopicTagNames.WorkId, value: workId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeWorkTopic(
    _topicId: string,
    _workId: string
  ): Promise<UploadResponse> {
    throw new Error("Not implemented");
  }

  async addWorkLike(
    workId: string,
    likerId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const tags = [
      { name: AppTagNames.ContentType, value: "empty" },
      { name: AppTagNames.EntityType, value: EntityType.WorkLike },
      { name: WorkTagNames.WorkId, value: workId },
      { name: LikeTagNames.LikerId, value: likerId },
    ];

    return await this.#uploadText("", tags, fund);
  }

  async removeWorkLike(
    _workId: string,
    _likerId: string
  ): Promise<UploadResponse> {
    throw new Error("Not implemented");
  }

  async getWorkLikeCount(workId: string): Promise<number> {
    const likes = await this.#Query.search(SEARCH_TX).tags([
      { name: AppTagNames.EntityType, values: [EntityType.WorkLike] },
      { name: WorkTagNames.WorkId, values: [workId] },
    ]);

    let likeCount = 0;
    if (likes.length > 0) {
      for (let i = 0; i < likes.length; i++) {
        likeCount += 1;
      }
    }
    return likeCount;
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

  async getAllTopics(): Promise<TopicModel[]> {
    const response = await this.#queryGraphQL({
      tags: [{ name: AppTagNames.EntityType, values: [EntityType.Topic] }],
    });

    return convertGqlQueryToTopic(response) || [];
  }

  async getTopicsByWork(workId: string): Promise<TopicModel[] | null> {
    const workTopicResponse = await this.#queryGraphQL({
      tags: [
        { name: AppTagNames.EntityType, values: [EntityType.WorkTopic] },
        { name: WorkTopicTagNames.WorkId, values: [workId] },
      ],
    });

    const workTopics = convertGqlQueryToWorkTopic(workTopicResponse);
    const topicModels = await this.getAllTopics();
    const topics: TopicModel[] = new Array(workTopics.length);
    for (let i = 0; i < workTopics.length; i++) {
      topics[i] = topicModels.find(
        (topic) => topic.id === workTopics[i].topic_id
      )!;
    }

    return topics;
  }
}

function convertGqlQueryToWorkTopic(response: IrysGraphqlResponse | null) {
  const count = response?.data.transactions.edges.length || 0;
  const topics: WorkTopicModel[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const node = response?.data.transactions.edges[i].node;
    if (!node) throw new Error("Topic item is null");
    topics[i] = {
      id: node.id,
      updated_at: node.timestamp,
      work_id:
        node.tags.find((tag) => tag.name === WorkTopicTagNames.WorkId)?.value ||
        "",
      topic_id:
        node.tags.find((tag) => tag.name === WorkTopicTagNames.TopicId)
          ?.value || "",
    };
  }
  return topics;
}

function convertGqlQueryToTopic(response: IrysGraphqlResponse | null) {
  const count = response?.data.transactions.edges.length || 0;
  console.log("count", count);
  const topics: TopicModel[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const node = response?.data.transactions.edges[i].node;
    if (!node) throw new Error("Topic item is null");
    topics[i] = {
      id: node.id,
      updated_at: node.timestamp,
      name:
        node.tags.find((tag) => tag.name === TopicTagNames.TopicName)?.value ||
        "",
    };
  }
  return topics;
}

function convertQueryToWork(
  response: QueryResponse,
  data: DataUpload
): WorkModel {
  return new WorkModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
    (data as string) ? (data as string) : "",
    response.tags.find((tag) => tag.name == WorkTagNames.AuthorId)?.value || "",
    response.tags.find((tag) => tag.name == WorkTagNames.Description)?.value
  );
}

function convertGqlQueryToWork(
  response: IrysGraphqlResponseNode,
  data: DataUpload
): WorkModel {
  return new WorkModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
    (data as string) ? (data as string) : "",
    response.tags.find((tag) => tag.name == WorkTagNames.AuthorId)?.value || "",
    response.tags.find((tag) => tag.name == WorkTagNames.Description)?.value
  );
}

function convertQueryToProfile(
  response: QueryResponse,
  data: ArrayBuffer | null
): ProfileModel {
  return new ProfileModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == ProfileTagNames.UserName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.FullName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.Description)
      ?.value || "",
    response.tags.find((tag) => tag.name == ProfileTagNames.OwnerAddress)
      ?.value || "",
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkPrimary
    )?.value,
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkSecondary
    )?.value,
    data
  );
}

function convertGqlQueryToProfile(
  response: IrysGraphqlResponseNode,
  data: ArrayBuffer | null
): ProfileModel {
  return new ProfileModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == ProfileTagNames.UserName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.FullName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.Description)
      ?.value || "",
    response.tags.find((tag) => tag.name == ProfileTagNames.OwnerAddress)
      ?.value || "",
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkPrimary
    )?.value,
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkSecondary
    )?.value,
    data
  );
}

function convertGqlQueryToWorkResponse(
  response: IrysGraphqlResponseNode,
  data: string | null
): WorkResponseModel {
  return new WorkResponseModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == WorkTagNames.WorkId)?.value || "",
    response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
    data || "",
    response.tags.find((tag) => tag.name == WorkResponderTagNames.ResponderId)
      ?.value || ""
  );
}

function convertModelsToWorkWithAuthor(
  work: WorkModel,
  profileModel: ProfileModel,
  likeCount: number = 0
): WorkWithAuthorModel {
  return new WorkWithAuthorModel(
    work.id,
    work.updated_at,
    work.title,
    work.content,
    work.description,
    work.author_id,
    profileModel.username,
    profileModel.fullname,
    profileModel.description,
    likeCount
  );
}

function convertModelsToWorkResponseWithAuthor(
  workResponse: WorkResponseModel,
  profileModel: ProfileModel
) {
  return new WorkResponseModelWithProfile(
    workResponse.id,
    workResponse.updated_at,
    workResponse.work_id,
    workResponse.work_title,
    workResponse.response_content,
    workResponse.responder_id,
    profileModel.username,
    profileModel.fullname,
    profileModel.description
  );
}
