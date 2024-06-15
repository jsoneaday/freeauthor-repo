import {
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
  WorkWithAuthorModel,
} from "../irys/models/ApiModels";
import { IGraphqlBase } from "./IGraphqlApi";

export interface IReadApi extends IGraphqlBase {
  getWork(workId: string): Promise<WorkWithAuthorModel | null>;

  searchWorksTop(searchTxt: string): Promise<WorkWithAuthorModel[] | null>;

  searchWorks(
    searchTxt: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getProfile(profileId: string): Promise<ProfileModel | null>;

  getAllTopics(): Promise<TopicModel[]>;

  getWorksByTopic(
    topicId: string,
    pageSize: number,
    cursor?: string
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorksByTopicTop(
    topicId: string,
    pageSize?: number
  ): Promise<PagedWorkWithAuthorModel | null>;

  getWorkLikeCount(workId: string): Promise<number>;

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

  getFollowedProfiles(followerId: string): Promise<ProfileModel[] | null>;
  getFollowerProfiles(followedId: string): Promise<ProfileModel[] | null>;
  getFollowedCount(profileId: string): Promise<number>;
  getFollowerCount(profileId: string): Promise<number>;

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

  getWorkResponseCount(workId: string): Promise<number>;

  getTopicsByWork(workId: string): Promise<TopicModel[] | null>;
}
