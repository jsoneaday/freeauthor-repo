import { UploadResponse } from "@irys/sdk/common/types";
import {
  Avatar,
  ProfileModel,
  TopicModel,
  WorkResponseModel,
  WorkTopicModel,
  WorkWithAuthorModel,
} from "./ApiModels";

export type TxHashPromise = Promise<string | null | undefined | UploadResponse>;

export interface IApi {
  get Address(): string;

  getData(
    entityTxId: string,
    isTextData: boolean
  ): Promise<null | string | ArrayBuffer>;

  arbitraryFund(amount: number): Promise<void>;

  /// Loaded balance on Irys
  balance(): Promise<number>;

  addWork(
    title: string,
    /// if undefined use first few words of content
    description: string | undefined,
    /// should be html
    content: string,
    authorId: string,
    topicId: string,
    fund?: boolean
  ): TxHashPromise;

  updateWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string,
    priorWorkId: string,
    fund?: boolean
  ): TxHashPromise;

  /// workId is transaction id
  getWork(workId: string): Promise<WorkWithAuthorModel | null>;

  searchWorksTop(
    searchTxt: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  searchWorks(
    searchTxt: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByAllFollowed(
    followerId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByAllFollowedTop(
    followerId: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByOneFollowed(
    followedId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByOneFollowedTop(
    followedId: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getAuthorWorks(
    authorId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByTopic(
    topicId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByTopicTop(
    topicId: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  addProfile(
    userName: string,
    fullName: string,
    description: string,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): TxHashPromise;

  updateProfile(
    userName: string,
    fullName: string,
    description: string,
    priorProfileId: string,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): TxHashPromise;

  getProfile(profileId: string): Promise<ProfileModel | null>;
  getOwnersProfile(): Promise<ProfileModel | null>;
  getFollowedProfiles(profileId: string): Promise<ProfileModel[] | null>;
  getFollowerProfiles(profileId: string): Promise<ProfileModel[] | null>;

  addWorkResponse(
    content: string,
    workId: string,
    responderId: string,
    fund?: boolean
  ): TxHashPromise;

  getWorkResponses(
    workId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkResponseModel[] | null>;

  getWorkResponsesTop(
    workId: string,
    pageSize: number
  ): Promise<WorkResponseModel[] | null>;

  getWorkResponsesByProfile(
    profileId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkResponseModel[] | null>;

  getWorkResponsesByProfileTop(
    profileId: string,
    pageSize: number
  ): Promise<WorkResponseModel[] | null>;

  isConnected(): Promise<boolean>;
  connect(walletProvider?: object): Promise<void>;

  addFollow(
    followerId: string,
    followedId: string,
    fund?: boolean
  ): TxHashPromise;
  removeFollow(followerId: string, followedId: string): TxHashPromise;

  addTopic(name: string, fund?: boolean): TxHashPromise;
  removeTopic(name: string): TxHashPromise;

  addWorkTopic(topicId: string, workId: string, fund?: boolean): TxHashPromise;
  removeWorkTopic(topicId: string, workId: string): TxHashPromise;

  addWorkLike(workId: string, likerId: string, fund?: boolean): TxHashPromise;
  removeWorkLike(workId: string, likerId: string): TxHashPromise;

  /// Used to wait for tx completion and then get entity id
  // waitAndGetId(
  //   tx: string | null | undefined,
  //   entityType?: string
  // ): Promise<number>;

  getWorkLikeCount(workId: string): Promise<number>;

  getWorkResponseCount(workId: string): Promise<number>;

  getFollowedCount(profileId: string): Promise<number>;
  getFollowerCount(profileId: string): Promise<number>;

  getAllTopics(): Promise<TopicModel[] | null>;
  getWorkTopic(workId: string): Promise<WorkTopicModel | null>;
  getTopicByWork(workId: string): Promise<TopicModel | null>;

  // cleanDb(): TxHashPromise;
  // setupData(): TxHashPromise;
}
