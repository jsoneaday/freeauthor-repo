import { TopicModel } from "../irys/models/ApiModels";

export interface IReadApi {
  getAllTopics(): Promise<TopicModel[]>;
}
