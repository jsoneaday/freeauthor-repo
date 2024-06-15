import { UploadResponse } from "@irys/sdk/common/types";
import {
  ActionType,
  Avatar,
  Bundle,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
} from "../irys/models/ApiModels";

export interface IWriteApi {
  get Address(): string;

  arbitraryFund(amount: number): Promise<void>;

  /// Loaded balance on Irys
  balance(): Promise<number>;

  uploadBundles(bundles: Bundle[]): Promise<UploadResponse | undefined>;

  addWork(
    title: string,
    /// if undefined use first few words of content
    description: string | undefined,
    /// should be html
    content: string,
    authorId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;

  updateWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    priorWorkId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  getAuthorWorks(
    authorId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<PagedWorkWithAuthorModel | null>;

  addProfile(
    userName: string,
    fullName: string,
    description: string,
    action?: ActionType,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse>;

  updateProfile(
    profileId: string,
    userName: string,
    fullName: string,
    description: string,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse>;

  getOwnersProfile(): Promise<ProfileModel | null>;
  getFollowedProfiles(followerId: string): Promise<ProfileModel[] | null>;
  getFollowerProfiles(followedId: string): Promise<ProfileModel[] | null>;

  addWorkResponse(
    content: string,
    workId: string,
    responderId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;

  getWorkResponses(
    workId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null>;

  getWorkResponsesTop(
    workId: string,
    pageSize: number
  ): Promise<PagedWorkResponseModel | null>;

  getWorkResponsesByProfile(
    profileId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkResponseModel | null>;

  getWorkResponsesByProfileTop(
    profileId: string,
    pageSize: number
  ): Promise<PagedWorkResponseModel | null>;

  isConnected(): Promise<boolean>;
  disconnect(): void;
  connect(walletProvider?: object | null): Promise<void>;

  addFollow(
    followerId: string,
    followedId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeFollow(
    followerId: string,
    followedId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  addTopic(
    name: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeTopic(name: string, fund?: boolean): Promise<UploadResponse>;

  addWorkTopic(
    topicId: string,
    workId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeWorkTopic(
    topicId: string,
    workId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  addWorkLike(
    workId: string,
    likerId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeWorkLike(
    workId: string,
    likerId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  /// Used to wait for tx completion and then get entity id
  // waitAndGetId(
  //   tx: string | null | undefined,
  //   entityType?: string
  // ): Promise<number>;

  getWorkResponseCount(workId: string): Promise<number>;

  getFollowedCount(profileId: string): Promise<number>;
  getFollowerCount(profileId: string): Promise<number>;

  getTopicsByWork(workId: string): Promise<TopicModel[] | null>;

  // cleanDb(): TxHashPromise;
  // setupData(): TxHashPromise;
}
