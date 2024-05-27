import {
  Avatar,
  BaseTags,
  ProfileModel,
  QueryResponseWithData,
  Tag,
  TopicModel,
  WorkModel,
  WorkResponseModel,
  WorkTopicModel,
  WorkWithAuthorModel,
  QueryResponse,
  TxValidationMetadata,
} from "./ApiModels";
import { IApi, TxHashPromise } from "./IApi";
import { WebIrys } from "@irys/sdk";
import SolanaConfig from "@irys/sdk/node/tokens/solana";
import { BaseWebIrys } from "@irys/sdk/web/base";
import { type WebToken } from "@irys/sdk/web/types";
import Query from "@irys/query";
import { IRYS_DATA_URL, RPC_URL, TOKEN, TX_METADATA_URL } from "../Env";
import bs58 from "bs58";

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
  ): TxHashPromise {
    if (fund) await this.#fundText(content);

    return await this.#Irys.upload(content, {
      tags: [...BaseTags, ...tags],
    });
  }

  async #uploadFile(file: File, tags: Tag[], fund: boolean): TxHashPromise {
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

  async #convertQueryToWorkWithModel(
    queryResp: QueryResponse,
    data: null | string | ArrayBuffer
  ) {
    const queryWorkWithData: QueryResponseWithData = { data, ...queryResp };
    const workModel = convertQueryToWork(queryWorkWithData);
    const profileModel = await this.getProfile(workModel.author_id);

    if (!profileModel)
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    return convertModelsToWorkWithAuthor(workModel, profileModel);
  }

  async getData(
    entityTxId: string,
    isTextData: boolean
  ): Promise<null | string | ArrayBuffer> {
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
  ): TxHashPromise {
    let _desc = !description
      ? content.substring(0, content.length < 20 ? content.length : 20)
      : description;

    const tags = [
      { name: "Content-Type", value: "text/html" },
      { name: "Entity-Type", value: "Work" },
      { name: "title", value: title },
      { name: "description", value: _desc },
      { name: "authorId", value: authorId.toString() },
      { name: "topicId", value: topicId.toString() },
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
  ): TxHashPromise {
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
      const data = await this.getData(workQueryResponse[0].id, true);
      return this.#convertQueryToWorkWithModel(workQueryResponse[0], data);
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
        { name: "title", values: [searchTxt] },
        { name: "description", values: [searchTxt] },
      ])
      .limit(pageSize);

    const works: WorkWithAuthorModel[] = new Array(workResponses.length);
    if (workResponses.length > 0) {
      for (let i = 0; i < workResponses.length; i++) {
        const data = await this.getData(workResponses[i].id, true);
        works[i] = await this.#convertQueryToWorkWithModel(
          workResponses[0],
          data
        );
      }
    }
    return works;
  }

  async searchWorks(
    _searchTxt: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
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
    _authorId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
  }

  async getAuthorWorksTop(
    _authorId: string,
    _pageSize: number
  ): Promise<WorkWithAuthorModel[] | null> {
    throw new Error("Not implemented");
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
  ): TxHashPromise {
    const tags = [
      { name: "Entity-Type", value: "Profile" },
      { name: "userName", value: userName },
      { name: "fullName", value: fullName },
      { name: "description", value: description },
      { name: "ownerAddress", value: this.Address },
    ];
    if (avatar) {
      tags.push({
        name: "Content-Type",
        value: `image/${avatar.fileExtension}`,
      });
    }
    if (socialLinkPrimary) {
      tags.push({ name: "socialLinkPrimary", value: socialLinkPrimary });
    }
    if (socialLinkSecondary) {
      tags.push({ name: "socialLinkSecondary", value: socialLinkSecondary });
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
  ): TxHashPromise {
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

    return convertQueryToProfile({ data, ...result[0] });
  }

  async getOwnersProfile(): Promise<ProfileModel | null> {
    throw new Error("Not implemented");
  }

  async getFollowedProfiles(
    _profileId: string
  ): Promise<ProfileModel[] | null> {
    throw new Error("Not implemented");
  }
  async getFollowerProfiles(
    _profileId: string
  ): Promise<ProfileModel[] | null> {
    throw new Error("Not implemented");
  }

  async addWorkResponse(
    content: string,
    workId: string,
    responderId: string,
    fund: boolean = false
  ): TxHashPromise {
    const tags = [
      { name: "Content-Type", value: "text/html" },
      { name: "Entity-Type", value: "Work" },
      { name: "workId", value: workId.toString() },
      { name: "responderId", value: responderId.toString() },
    ];

    return await this.#uploadText(content, tags, fund);
  }

  async getWorkResponses(
    _workId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkResponseModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorkResponsesTop(
    _workId: string,
    _pageSize: number
  ): Promise<WorkResponseModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorkResponsesByProfile(
    _profileId: string,
    _lastKeyset: string,
    _pageSize: number
  ): Promise<WorkResponseModel[] | null> {
    throw new Error("Not implemented");
  }

  async getWorkResponsesByProfileTop(
    _profileId: string,
    _pageSize: number
  ): Promise<WorkResponseModel[] | null> {
    throw new Error("Not implemented");
  }

  async addFollow(
    followerId: string,
    followedId: string,
    fund: boolean = false
  ): TxHashPromise {
    const tags = [
      { name: "Entity-Type", value: "Follow" },
      { name: "followerId", value: followerId.toString() },
      { name: "followedId", value: followedId.toString() },
    ];

    return await this.#uploadText("", tags, fund);
  }
  async removeFollow(_followerId: string, _followedId: string): TxHashPromise {
    throw new Error("Not implemented");
  }

  async addTopic(name: string, fund: boolean = false): TxHashPromise {
    const tags = [
      { name: "Entity-Type", value: "Topic" },
      { name: "name", value: name },
    ];

    return await this.#uploadText("", tags, fund);
  }
  async removeTopic(_name: string): TxHashPromise {
    throw new Error("Not implemented");
  }

  async addWorkTopic(
    topicId: string,
    workId: string,
    fund: boolean = false
  ): TxHashPromise {
    const tags = [
      { name: "Entity-Type", value: "WorkTopic" },
      { name: "topicId", value: topicId.toString() },
      { name: "workId", value: workId.toString() },
    ];

    return await this.#uploadText("", tags, fund);
  }
  async removeWorkTopic(_topicId: string, _workId: string): TxHashPromise {
    throw new Error("Not implemented");
  }

  async addWorkLike(
    workId: string,
    likerId: string,
    fund: boolean = false
  ): TxHashPromise {
    const tags = [
      { name: "Entity-Type", value: "WorkLike" },
      { name: "workId", value: workId.toString() },
      { name: "likerId", value: likerId.toString() },
    ];

    return await this.#uploadText("", tags, fund);
  }
  async removeWorkLike(_workId: string, _likerId: string): TxHashPromise {
    throw new Error("Not implemented");
  }

  async getWorkLikeCount(_workId: string): Promise<number> {
    throw new Error("Not implemented");
  }

  async getWorkResponseCount(_workId: string): Promise<number> {
    throw new Error("Not implemented");
  }

  async getFollowedCount(_profileId: string): Promise<number> {
    throw new Error("Not implemented");
  }
  async getFollowerCount(_profileId: string): Promise<number> {
    throw new Error("Not implemented");
  }

  async getAllTopics(): Promise<TopicModel[] | null> {
    throw new Error("Not implemented");
  }
  async getWorkTopic(_workId: string): Promise<WorkTopicModel | null> {
    throw new Error("Not implemented");
  }
  async getTopicByWork(_workId: string): Promise<TopicModel | null> {
    throw new Error("Not implemented");
  }
}

function convertQueryToWork(response: QueryResponseWithData): WorkModel {
  return new WorkModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == "title")?.value || "",
    (response.data as string) ? (response.data as string) : "",
    response.tags.find((tag) => tag.name == "authorId")?.value || "",
    response.tags.find((tag) => tag.name == "description")?.value
  );
}

function convertQueryToProfile(response: QueryResponseWithData): ProfileModel {
  return new ProfileModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == "username")?.value || "",
    response.tags.find((tag) => tag.name == "fullname")?.value || "",
    response.tags.find((tag) => tag.name == "description")?.value || "",
    response.tags.find((tag) => tag.name == "ownerAddress")?.value || "",
    response.tags.find((tag) => tag.name == "socialLinkPrimary")?.value,
    response.tags.find((tag) => tag.name == "socialLinkSecondary")?.value
  );
}

function convertModelsToWorkWithAuthor(
  work: WorkModel,
  profile: ProfileModel
): WorkWithAuthorModel {
  return new WorkWithAuthorModel(
    work.id,
    work.updated_at,
    work.title,
    work.content,
    work.description,
    work.author_id,
    profile.username,
    profile.fullname,
    profile.description
  );
}
