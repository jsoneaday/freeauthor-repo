import { UploadResponse } from "@irys/sdk/common/types";
import {
  ActionType,
  Avatar,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
  WorkWithAuthorModel,
} from "../irys/models/ApiModels";

export interface IApi {
  get Address(): string;

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

  /// workId is transaction id
  getWork(workId: string): Promise<WorkWithAuthorModel | null>;

  searchWorksTop(
    searchTxt: string,
    pageSize: number
  ): Promise<WorkWithAuthorModel[] | null>;

  searchWorks(
    searchTxt: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByAllFollowed(
    followerId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByAllFollowedTop(
    followerId: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByOneFollowed(
    followedId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByOneFollowedTop(
    followedId: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getAuthorWorks(
    authorId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByTopic(
    topicId: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthorModel[] | null>;

  getWorksByTopicTop(
    topicId: string,
    pageSize?: number
  ): Promise<WorkWithAuthorModel[] | null>;

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
    userName: string,
    fullName: string,
    description: string,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse>;

  getProfile(profileId: string): Promise<ProfileModel | null>;
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
  connect(walletProvider?: object): Promise<void>;

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
  removeTopic(name: string): Promise<UploadResponse>;

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
  removeWorkLike(workId: string, likerId: string): Promise<UploadResponse>;

  /// Used to wait for tx completion and then get entity id
  // waitAndGetId(
  //   tx: string | null | undefined,
  //   entityType?: string
  // ): Promise<number>;

  getWorkLikeCount(workId: string): Promise<number>;

  getWorkResponseCount(workId: string): Promise<number>;

  getFollowedCount(profileId: string): Promise<number>;
  getFollowerCount(profileId: string): Promise<number>;

  getAllTopics(): Promise<TopicModel[]>;
  getTopicsByWork(workId: string): Promise<TopicModel[] | null>;

  // cleanDb(): TxHashPromise;
  // setupData(): TxHashPromise;
}
