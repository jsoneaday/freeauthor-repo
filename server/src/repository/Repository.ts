import { PrismaClient } from "@prisma/client";
import { WorkRepo } from "./work/WorkRepo.js";
import { ProfileRepo } from "./profile/ProfileRepo.js";
import { TopicRepo } from "./topic/TopicRepo.js";
import { LikeRepo } from "./like/LikeRepo.js";
import { FollowRepo } from "./follow/FollowRepo.js";
import { WorkResponseRepo } from "./work/workResponse/WorkResponseRepo.js";
import { WorkTopicRepo } from "./work/workTopic/WorkTopicRepo.js";

export class Repository {
  #client: PrismaClient;

  #work: WorkRepo;
  get Work() {
    if (!this.#work) throw new Error("work is undefined");
    return this.#work;
  }

  #profile: ProfileRepo;
  get Profile() {
    if (!this.#profile) throw new Error("profile is undefined");
    return this.#profile;
  }

  #workResp: WorkResponseRepo;
  get WorkResp() {
    if (!this.#workResp) throw new Error("workResp is undefined");
    return this.#workResp;
  }

  #workTopic: WorkTopicRepo;
  get WorkTopic() {
    if (!this.#workTopic) throw new Error("workTopic is undefined");
    return this.#workTopic;
  }

  #follow: FollowRepo;
  get Follow() {
    if (!this.#follow) throw new Error("follow is undefined");
    return this.#follow;
  }

  #topic: TopicRepo;
  get Topic() {
    if (!this.#topic) throw new Error("topic is undefined");
    return this.#topic;
  }

  #likes: LikeRepo;
  get Likes() {
    if (!this.#likes) throw new Error("likes is undefined");
    return this.#likes;
  }

  constructor() {
    this.#client = new PrismaClient();

    this.#work = new WorkRepo(this.#client);
    this.#workResp = new WorkResponseRepo();
    this.#workTopic = new WorkTopicRepo(this.#client);
    this.#profile = new ProfileRepo(this.#client);
    this.#topic = new TopicRepo(this.#client);
    this.#likes = new LikeRepo();
    this.#follow = new FollowRepo();
  }

  async close() {
    await this.#client.$disconnect();
  }
}
