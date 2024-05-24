import { IApi, TxHashPromise } from "../api/IApi";
import {
  ProfileModel,
  WorkResponseModel,
  WorkWithAuthorModel,
} from "../api/ApiModels";
import {
  Profile,
  ResponseWithResponder,
  Topic,
  WorkTopic,
  WorkWithAuthor,
} from "./UIModels";

export class UiApi {
  #_api: IApi | null = null;
  get #Api(): IApi {
    return this.#_api!;
  }

  get Address() {
    return this.#Api.Address;
  }

  /// Pass api instance here
  /// e.g. new FakeApi("0xE7DCCAE2d95A1cB1E30E07477207065A9EDf6D38")
  constructor(apiObj: IApi, walletProvider: object) {
    this.#_api = apiObj;
    if (!this.isConnected()) {
      this.connect(walletProvider);
    }
  }

  async isConnected(): Promise<boolean> {
    return await this.#Api?.isConnected();
  }

  async connect(walletProvider: object) {
    await this.#Api.connect(walletProvider);
  }

  async addWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string
  ): TxHashPromise {
    return await this.#Api.addWork(
      title,
      description,
      content,
      authorId,
      topicId
    );
  }

  // todo: add avatar
  async addProfile(
    userName: string,
    fullName: string,
    description: string,
    socialLinkPrimary: string,
    socialLinkSecond: string,
    fund: boolean = false
  ): TxHashPromise {
    return await this.#Api.addProfile(
      userName,
      fullName,
      description,
      fund,
      socialLinkPrimary,
      socialLinkSecond
    );
  }
  async addFollow(followerId: string, followedId: string): TxHashPromise {
    return await this.#Api.addFollow(followerId, followedId);
  }
  async addTopic(name: string): TxHashPromise {
    return await this.#Api.addTopic(name);
  }
  async addWorkTopic(topicId: string, workId: string): TxHashPromise {
    return await this.#Api.addWorkTopic(topicId, workId);
  }
  async addWorkLikes(workId: string, likerId: string): TxHashPromise {
    return await this.#Api.addWorkLike(workId, likerId);
  }
  async addWorkResponse(
    content: string,
    workId: string,
    responderId: string
  ): TxHashPromise {
    return await this.#Api.addWorkResponse(content, workId, responderId);
  }

  // async waitAndGetId(
  //   tx: string | null | undefined,
  //   entityType?: string
  // ): Promise<number> {
  //   return await this.#Api.waitAndGetId(tx, entityType);
  // }

  async updateWork(
    workId: string,
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string
  ): TxHashPromise {
    return this.#Api.updateWork(
      title,
      description,
      content,
      authorId,
      topicId,
      workId
    );
  }

  // todo: add avatar later
  async updateProfile(
    profileId: string,
    userName: string,
    fullName: string,
    description: string,
    socialLinkPrimary: string,
    socialLinkSecond: string,
    fund: boolean = false
  ): TxHashPromise {
    return this.#Api.updateProfile(
      userName,
      fullName,
      description,
      profileId,
      fund,
      socialLinkPrimary,
      socialLinkSecond
    );
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    const profile = await this.#Api.getProfile(profileId);
    return this.#getProfile(profile);
  }

  async getOwnersProfile(): Promise<Profile | null> {
    const profile = await this.#Api.getOwnersProfile();
    if (profile) return this.#getProfile(profile);
    return null;
  }

  async getFollowedProfiles(profileId: string): Promise<Profile[] | null> {
    const profiles = await this.#Api.getFollowedProfiles(profileId);
    if (profiles) return this.#getProfiles(profiles);
    return null;
  }

  async getFollowerProfiles(profileId: string): Promise<Profile[] | null> {
    const profiles = await this.#Api.getFollowerProfiles(profileId);
    if (profiles) return this.#getProfiles(profiles);
    return null;
  }

  async getWork(workId: string): Promise<WorkWithAuthor | null> {
    const work = await this.#Api.getWork(workId);
    return this.#getWorkWithAuthor(work);
  }

  async searchWorksTop(
    searchTxt: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.searchWorksTop(searchTxt, pageSize);
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async searchWorks(
    searchTxt: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.searchWorks(searchTxt, lastKeyset, pageSize);
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByAllFollowed(
    followerId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByAllFollowed(
      followerId,
      lastKeyset,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByAllFollowedTop(
    followerId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByAllFollowedTop(
      followerId,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByOneFollowed(
    followedId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByOneFollowed(
      followedId,
      lastKeyset,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByOneFollowedTop(
    followedId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByOneFollowedTop(
      followedId,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getAuthorWorks(
    authorId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getAuthorWorks(
      authorId,
      lastKeyset,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getAuthorWorksTop(authorId, pageSize);
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByTopic(
    topicId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByTopic(
      topicId,
      lastKeyset,
      pageSize
    );
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorksByTopicTop(
    topicId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByTopicTop(topicId, pageSize);
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async getWorkLikeCount(workId: string): Promise<number> {
    return await this.#Api.getWorkLikeCount(workId);
  }

  async getWorkResponses(
    workId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponses(
      workId,
      lastKeyset,
      pageSize
    );
    if (responses) return this.#getResponseWithResponders(responses);
    return null;
  }

  async getWorkResponsesTop(
    workId: string,
    pageSize: number
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponsesTop(workId, pageSize);
    if (responses) return this.#getResponseWithResponders(responses);
    return null;
  }

  async getWorkResponsesByProfile(
    profileId: string,
    lastKeyset: string,
    pageSize: number
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponsesByProfile(
      profileId,
      lastKeyset,
      pageSize
    );
    if (responses) return this.#getResponseWithResponders(responses);
    return null;
  }

  async getWorkResponsesByProfileTop(
    profileId: string,
    pageSize: number
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponsesByProfileTop(
      profileId,
      pageSize
    );
    if (responses) return this.#getResponseWithResponders(responses);
    return null;
  }

  async getWorkResponseCount(workId: string): Promise<number> {
    return await this.#Api.getWorkResponseCount(workId);
  }

  async getFollowedCount(profileId: string): Promise<number> {
    return this.#Api.getFollowedCount(profileId);
  }
  async getFollowerCount(profileId: string): Promise<number> {
    return this.#Api.getFollowerCount(profileId);
  }

  async getAllTopics(): Promise<Topic[] | null> {
    const topics = await this.#Api.getAllTopics();
    return (
      topics?.map((topic) => ({
        id: topic.id,
        updatedAt: topic.updated_at.toString(),
        name: topic.name,
      })) || null
    );
  }

  async getTopicByWork(workId: string): Promise<Topic | null> {
    const topic = await this.#Api.getTopicByWork(workId);
    if (topic) {
      return {
        id: topic.id,
        updatedAt: topic.updated_at.toString(),
        name: topic.name,
      };
    }
    return null;
  }

  async getWorkTopic(workId: string): Promise<WorkTopic | null> {
    const workTopic = await this.#Api.getWorkTopic(workId);
    if (workTopic) {
      return {
        id: workTopic.id,
        updatedAt: workTopic.updated_at.toString(),
        workId: workTopic.work_id,
        topicId: workTopic.topic_id,
      };
    }
    return null;
  }

  // async cleanDb(): TxHashPromise {
  //   return await this.#Api.cleanDb();
  // }

  // async setupData(): TxHashPromise {
  //   return await this.#Api.setupData();
  // }

  #getResponseWithResponders(responses: WorkResponseModel[]) {
    const responsesWithResponder: ResponseWithResponder[] = [];
    for (let i = 0; i < responses.length; i++) {
      if (responses[i]) {
        responsesWithResponder.push(
          this.#getResponseWithResponder(responses[i])
        );
      }
    }
    return responsesWithResponder;
  }

  #getResponseWithResponder(
    response: WorkResponseModel
  ): ResponseWithResponder {
    return {
      id: response.id,
      updatedAt: response.updated_at.toString(),
      workId: response.work_id,
      workTitle: response.work_title,
      responseContent: response.response_content,
      responderId: response.id,
      fullName: response.fullname,
      userName: response.username,
      profileDesc: response.profileDesc,
    };
  }

  #getWorkWithAuthors(works: WorkWithAuthorModel[]) {
    const worksWithAuthor: WorkWithAuthor[] = [];
    for (let i = 0; i < works.length; i++) {
      if (works[i]) {
        const work = this.#getWorkWithAuthor(works[i]);
        work && worksWithAuthor.push(work);
      }
    }
    return worksWithAuthor;
  }

  #getWorkWithAuthor(work: WorkWithAuthorModel | null): WorkWithAuthor | null {
    if (!work) return null;

    return {
      id: work.id,
      updatedAt: work.updated_at.toString(),
      title: work.title,
      description: work.description,
      content: work.content,
      authorId: work.author_id,
      fullName: work.fullname,
      userName: work.username,
      profileDesc: work.profileDesc,
    };
  }

  #getProfiles(profileModels: ProfileModel[]) {
    if (!profileModels) return null;

    const profiles: Profile[] = [];
    for (let i = 0; i < profileModels.length; i++) {
      if (profileModels[i]) {
        const profile = this.#getProfile(profileModels[i]);
        profile && profiles.push(profile);
      }
    }
    return profiles;
  }

  #getProfile(profileModel: ProfileModel | null): Profile | null {
    if (!profileModel) return null;

    return {
      id: profileModel.id,
      updatedAt: profileModel.updated_at.toString(),
      fullName: profileModel.fullname,
      userName: profileModel.username,
      description: profileModel.description,
      ownerAddress: profileModel.owner_address,
      socialLinkPrimary: profileModel.social_link_primary,
      socialLinkSecond: profileModel.social_link_second,
    };
  }
}
