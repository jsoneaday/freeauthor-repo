import { IApi } from "../api/interfaces/IApi";
import {
  ActionType,
  Avatar,
  ProfileModel,
  WorkResponseModelWithProfile,
  WorkWithAuthorModel,
} from "../api/irys/models/ApiModels";
import {
  Profile,
  ResponseWithResponder,
  Topic,
  WorkWithAuthor,
} from "./UIModels";
import { UploadResponse } from "@irys/sdk/common/types";

export class UiApi {
  #api: IApi | null = null;
  get #Api(): IApi {
    return this.#api!;
  }

  get Address() {
    return this.#Api.Address;
  }

  /// Pass api instance here
  /// e.g. new FakeApi("0xE7DCCAE2d95A1cB1E30E07477207065A9EDf6D38")
  constructor(apiObj: IApi) {
    this.#api = apiObj;
  }

  async isConnected(): Promise<boolean> {
    return await this.#Api?.isConnected();
  }

  async connect(walletProvider?: object | null): Promise<void> {
    await this.#Api.connect(walletProvider);
  }

  /// Works can have more than one topic but adding a default topic upon creation
  async addWorkWithTopic(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const work = await this.#Api.addWork(
      title,
      description,
      content,
      authorId,
      ActionType.Add,
      fund
    );
    await this.addWorkTopic(topicId, work.id);
    return work;
  }

  async addProfile(
    userName: string,
    fullName: string,
    description: string,
    socialLinkPrimary?: string,
    socialLinkSecond?: string,
    avatar?: Avatar,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return await this.#Api.addProfile(
      userName,
      fullName,
      description,
      ActionType.Add,
      fund,
      socialLinkPrimary,
      socialLinkSecond,
      avatar
    );
  }
  async addFollow(
    followerId: string,
    followedId: string
  ): Promise<UploadResponse> {
    return await this.#Api.addFollow(followerId, followedId);
  }
  async addTopic(name: string): Promise<UploadResponse> {
    return await this.#Api.addTopic(name);
  }
  async addWorkTopic(topicId: string, workId: string): Promise<UploadResponse> {
    return await this.#Api.addWorkTopic(topicId, workId);
  }
  async addWorkLikes(workId: string, likerId: string): Promise<UploadResponse> {
    return await this.#Api.addWorkLike(workId, likerId);
  }
  async addWorkResponse(
    content: string,
    workId: string,
    responderId: string
  ): Promise<UploadResponse> {
    return await this.#Api.addWorkResponse(content, workId, responderId);
  }

  async updateWorkWithTopic(
    workId: string,
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    topicId: string,
    fund: boolean = false
  ): Promise<UploadResponse> {
    const updatedWork = await this.#Api.updateWork(
      title,
      description,
      content,
      authorId,
      workId,
      fund
    );
    await this.#Api.removeWorkTopic(topicId, updatedWork.id);
    await this.addWorkTopic(topicId, updatedWork.id);
    return updatedWork;
  }

  // todo: add avatar later
  async updateProfile(
    profileId: string,
    userName: string,
    fullName: string,
    description: string,
    socialLinkPrimary?: string,
    socialLinkSecond?: string,
    avatar?: Avatar,
    fund: boolean = false
  ): Promise<UploadResponse> {
    return this.#Api.updateProfile(
      profileId,
      userName,
      fullName,
      description,
      fund,
      socialLinkPrimary,
      socialLinkSecond,
      avatar
    );
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return this.#getProfile(await this.#Api.getProfile(profileId));
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

  async searchWorksTop(searchTxt: string): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.searchWorksTop(searchTxt);
    if (works) return this.#getWorkWithAuthors(works);
    return null;
  }

  async searchWorks(
    searchTxt: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.searchWorks(searchTxt, pageSize, cursor);
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getWorksByAllFollowed(
    followerId: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByAllFollowed(
      followerId,
      pageSize,
      cursor
    );
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getWorksByAllFollowedTop(
    followerId: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByAllFollowedTop(followerId);
    if (works) return this.#getWorkWithAuthors(works.workModels);
    return null;
  }

  async getWorksByOneFollowed(
    followedId: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByOneFollowed(
      followedId,
      pageSize,
      cursor
    );
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getWorksByOneFollowedTop(
    followedId: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByOneFollowedTop(followedId);
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getAuthorWorks(
    authorId: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getAuthorWorks(authorId, pageSize, cursor);
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getAuthorWorksTop(
    authorId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getAuthorWorksTop(authorId, pageSize);
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getWorksByTopic(
    topicId: string,
    pageSize: number,
    cursor?: string
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByTopic(topicId, pageSize, cursor);
    if (works) return this.#getWorkWithAuthors(works.workModels, works.cursor);
    return null;
  }

  async getWorksByTopicTop(
    topicId: string,
    pageSize: number
  ): Promise<WorkWithAuthor[] | null> {
    const works = await this.#Api.getWorksByTopicTop(topicId, pageSize);
    if (works) return this.#getWorkWithAuthors(works.workModels);
    return null;
  }

  async getWorkLikeCount(workId: string): Promise<number> {
    return await this.#Api.getWorkLikeCount(workId);
  }

  async getWorkResponses(
    workId: string,
    pageSize: number,
    cursor?: string
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponses(
      workId,
      pageSize,
      cursor
    );
    if (responses)
      return this.#getResponseWithResponders(
        responses.workResponseModels,
        responses.cursor
      );
    return null;
  }

  async getWorkResponsesTop(
    workId: string,
    pageSize: number
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponsesTop(workId, pageSize);
    if (responses)
      return this.#getResponseWithResponders(
        responses.workResponseModels,
        responses.cursor
      );
    return null;
  }

  async getWorkResponsesByProfile(
    profileId: string,
    pageSize: number,
    cursor?: string
  ): Promise<ResponseWithResponder[] | null> {
    const responses = await this.#Api.getWorkResponsesByProfile(
      profileId,
      pageSize,
      cursor
    );
    if (responses)
      return this.#getResponseWithResponders(
        responses.workResponseModels,
        responses.cursor
      );
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
    if (responses)
      return this.#getResponseWithResponders(
        responses.workResponseModels,
        responses.cursor
      );
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

  async getTopicByWork(workId: string): Promise<Topic[] | null> {
    const topics = await this.#Api.getTopicsByWork(workId);
    return (
      topics?.map((topic) => ({
        id: topic.id,
        updatedAt: topic.updated_at.toString(),
        name: topic.name,
      })) || null
    );
  }

  // async cleanDb(): Promise<UploadResponse> {
  //   return await this.#Api.cleanDb();
  // }

  // async setupData(): Promise<UploadResponse> {
  //   return await this.#Api.setupData();
  // }

  #getResponseWithResponders(
    responses: WorkResponseModelWithProfile[],
    cursor?: string
  ) {
    const responsesWithResponder: ResponseWithResponder[] = [];
    for (let i = 0; i < responses.length; i++) {
      if (responses[i]) {
        responsesWithResponder.push(
          this.#getResponseWithResponder(responses[i], cursor)
        );
      }
    }
    return responsesWithResponder;
  }

  #getResponseWithResponder(
    response: WorkResponseModelWithProfile,
    cursor?: string
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
      cursor,
    };
  }

  #getWorkWithAuthors(works: WorkWithAuthorModel[], cursor?: string) {
    const worksWithAuthor: WorkWithAuthor[] = [];
    for (let i = 0; i < works.length; i++) {
      if (works[i]) {
        const work = this.#getWorkWithAuthor(works[i], cursor);
        work && worksWithAuthor.push(work);
      }
    }
    return worksWithAuthor;
  }

  #getWorkWithAuthor(
    work: WorkWithAuthorModel | null,
    cursor?: string
  ): WorkWithAuthor | null {
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
      cursor,
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
