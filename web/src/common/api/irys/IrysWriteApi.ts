import {
  Avatar,
  BaseTags,
  ProfileModel,
  Tag,
  TxValidationMetadata,
  EntityType,
  AppTagNames,
  WorkTagNames,
  TopicTagNames,
  ProfileTagNames,
  WorkResponderTagNames,
  FollowerTagNames,
  WorkLikeTagNames,
  WorkTopicTagNames,
  ActionName,
  ActionType,
  BaseQueryTags,
  Bundle,
} from "./models/ApiModels";
import { IWriteApi } from "../interfaces/IWriteApi";
import { WebIrys } from "@irys/sdk";
import SolanaConfig from "@irys/sdk/node/tokens/solana";
import { BaseWebIrys } from "@irys/sdk/web/base";
import { type WebToken } from "@irys/sdk/web/types";
import { RPC_URL, TOKEN, TX_METADATA_URL } from "../../Env";
import bs58 from "bs58";
import { IrysTransaction, UploadResponse } from "@irys/sdk/common/types";
import { ICommonApi } from "../interfaces/ICommonApi";
import { IReadApi } from "../interfaces/IReadApi";

/// Note all entity id are the transaction id on Irys
export class IrysWriteApi implements IWriteApi {
  #irys?: WebIrys | BaseWebIrys;
  get #Irys() {
    if (!this.#irys) throw new Error("#irys is not set yet!");
    return this.#irys;
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

  async uploadBundles(bundles: Bundle[]): Promise<UploadResponse | undefined> {
    let txs: IrysTransaction[] = new Array(bundles.length);

    for (let i = 0; i < bundles.length; i++) {
      const tx = this.#irys?.createTransaction(bundles[i].content, {
        tags: bundles[i].tags,
      });
      if (tx) {
        tx.sign();
        txs[i] = tx;
      }
    }

    return (await this.#irys?.uploader.uploadBundle(txs))?.data;
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

  /// User must be connected so leave in write api
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
}
