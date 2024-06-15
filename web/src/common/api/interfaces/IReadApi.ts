import {
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
  WorkWithAuthorModel,
} from "../irys/models/ApiModels";
import { IGraphqlApi } from "./IGraphqlApi";

export interface IReadApi extends IGraphqlApi {
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
}
