import {
  PagedWorkWithAuthorModel,
  ProfileModel,
  TopicModel,
} from "../irys/models/ApiModels";
import { IGraphqlApi } from "./IGraphqlApi";

export interface IReadApi extends IGraphqlApi {
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
}
