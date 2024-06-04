// import { render, waitFor, screen } from "@testing-library/react";
// import UserEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { IrysApi } from "./IrysApi";
import { IApi } from "../interfaces/IApi";
import { faker } from "@faker-js/faker";
import { UploadResponse } from "@irys/sdk/common/types";
import { ActionType } from "./models/ApiModels";

const network = "devnet";
const token = "solana";

describe("IrysApi Work tests", () => {
  beforeEach(async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();

    let balance = await api.balance();
    console.log("current balance:", balance);
    if (balance < 0.001) {
      await api.arbitraryFund(40_000);
      console.log("40_000 funding added, new balance:", await api.balance());
    }
  });

  it("addWork adds a new work", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();

    const work = await api.addWork(
      faker.lorem.words(3),
      faker.lorem.lines(1),
      faker.lorem.paragraph(1),
      "author123"
    );

    expect(work).not.toBeFalsy();
    expect(work.id).toBeTypeOf("string");
  });

  it("updateWork modifies an existing work", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();

    const username = faker.internet.userName();
    const fullname = faker.internet.displayName();
    const profileDesc = faker.lorem.sentences(1);

    const profileResponse = await api.addProfile(
      username,
      fullname,
      profileDesc
    );

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;

    const addedWork = await api.addWork(title, description, content, authorId);

    const updateAppendage = "123";
    const updatedWork = await api.updateWork(
      title + updateAppendage,
      description + updateAppendage,
      content + updateAppendage,
      authorId,
      addedWork.id
    );
    const getResult = await api.getWork(updatedWork.id);

    expect(getResult?.title).toBe(title + updateAppendage);
    expect(getResult?.description).toBe(description + updateAppendage);
    expect(getResult?.content).toBe(content + updateAppendage);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("getWork gets back a saved new work", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();

    const username = faker.internet.userName();
    const fullname = faker.internet.displayName();
    const profileDesc = faker.lorem.sentences(1);

    const profileResponse = await api.addProfile(
      username,
      fullname,
      profileDesc
    );

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;

    const work = await api.addWork(title, description, content, authorId);

    const getResult = await api.getWork(work.id);
    expect(getResult?.title).toBe(title);
    expect(getResult?.description).toBe(description);
    expect(getResult?.content).toBe(content);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("addWork for multiple items and use searchWorksTop to get back top liked results", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const worka = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWorkLike(worka.id, workb.id);
    await api.addWorkLike(worka.id, workc.id);
    await api.addWorkLike(worka.id, workd.id);

    await api.addWorkLike(workb.id, workc.id);
    await api.addWorkLike(workb.id, workd.id);

    await api.addWorkLike(workc.id, workd.id);

    const searchResults = await api.searchWorksTop(desc, 10);

    expect(worka.id).toBe(searchResults![0].id);
    expect(workb.id).toBe(searchResults![1].id);
    expect(workc.id).toBe(searchResults![2].id);
    expect(workd.id).toBe(searchResults![3].id);
  });

  it("addWork for 3 items and use searchWorks to get back two results", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const searchResult = await api.searchWorks(desc, 2);
    expect(workb.id).toBe(searchResult!.workModels[0].id);
    expect(workc.id).toBe(searchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use searchWorks to page twice", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const firstSearchResult = await api.searchWorks(desc, 2);
    const secondSearchResult = await api.searchWorks(
      desc,
      2,
      firstSearchResult!.cursor
    );
    expect(workc.id).toBe(secondSearchResult!.workModels[0].id);
    expect(workd.id).toBe(secondSearchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use getAuthorWorks to page twice", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const firstSearchResult = await api.getAuthorWorks(profile.id, 2);
    const secondSearchResult = await api.getAuthorWorks(
      profile.id,
      2,
      firstSearchResult!.cursor
    );
    expect(workc.id).toBe(secondSearchResult!.workModels[0].id);
    expect(workd.id).toBe(secondSearchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use getAuthorWorksTop to receive a sorted list of works sorted by like count", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );
    await api.addWorkLike(workc.id, profile.id);
    await api.addWorkLike(workc.id, profile.id);
    await api.addWorkLike(workc.id, profile.id);

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );
    await api.addWorkLike(workb.id, profile.id);
    await api.addWorkLike(workb.id, profile.id);

    const worka = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const searchResult = await api.getAuthorWorksTop(profile.id, 10);
    expect(workc.id).toBe(searchResult!.workModels[0].id);
    expect(workb.id).toBe(searchResult!.workModels[1].id);
    expect(worka.id).toBe(searchResult!.workModels[2].id);
    expect(workd.id).toBe(searchResult!.workModels[3].id);
  });

  it("getOwnersProfile gets profile of profile just created", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const ownersProfile = await api.getOwnersProfile();
    expect(profile.id).toBe(ownersProfile?.id);
  });

  it("getWorkResponses returns the expected paged responses", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWorkResponse("hello a", work.id, profile.id);
    const responseb = await api.addWorkResponse("hello b", work.id, profile.id);
    const responsec = await api.addWorkResponse("hello c", work.id, profile.id);
    const responsed = await api.addWorkResponse("hello d", work.id, profile.id);

    const workResponses = await api.getWorkResponses(work.id, 3);
    expect(responsed.id).toBe(workResponses?.workResponseModels[0].id);
    expect(responsec.id).toBe(workResponses?.workResponseModels[1].id);
    expect(responseb.id).toBe(workResponses?.workResponseModels[2].id);
  });

  it("getWorkResponseCount returns the expected response count", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await api.addWorkResponse("hello a", work.id, profile.id);
    await api.addWorkResponse("hello b", work.id, profile.id);
    await api.addWorkResponse("hello c", work.id, profile.id);
    await api.addWorkResponse("hello d", work.id, profile.id);

    const workResponseCount = await api.getWorkResponseCount(work.id);
    expect(workResponseCount).toBe(4);
  });

  it("getWorkResponsesByProfile returns the expected paged responses", async () => {
    const api: IApi = new IrysApi(network, token);
    await api.connect();
    const desc = faker.lorem.lines(1);

    const profileWorkOwner = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profileWorkResponseOwner = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profileWorkOwner.id
    );

    const responsea = await api.addWorkResponse(
      "hello a",
      work.id,
      profileWorkResponseOwner.id
    );
    const responseb = await api.addWorkResponse(
      "hello b",
      work.id,
      profileWorkResponseOwner.id
    );
    const responsec = await api.addWorkResponse(
      "hello c",
      work.id,
      profileWorkResponseOwner.id
    );
    const responsed = await api.addWorkResponse(
      "hello d",
      work.id,
      profileWorkResponseOwner.id
    );

    const workResponses = await api.getWorkResponsesByProfile(
      profileWorkResponseOwner.id,
      4
    );
    expect(responsed.id).toBe(workResponses?.workResponseModels[0].id);
    expect(responsec.id).toBe(workResponses?.workResponseModels[1].id);
    expect(responseb.id).toBe(workResponses?.workResponseModels[2].id);
    expect(responsea.id).toBe(workResponses?.workResponseModels[3].id);
  });

  it("addFollow adds one follow record and getFollowedProfiles retrieves followed profile", async () => {
    const api = new IrysApi(network, token);
    await api.connect();

    const profile_follower = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile_followed = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await api.addFollow(profile_follower.id, profile_followed.id);
    const followed = await api.getFollowedProfiles(profile_follower.id);
    expect(profile_followed.id).toBe(followed![0].id);
  });

  it("addFollow adds one follow record and getFollowerProfiles retrieves follower profile", async () => {
    const api = new IrysApi(network, token);
    await api.connect();

    const profile_follower = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile_followed = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await api.addFollow(profile_follower.id, profile_followed.id);
    const followers = await api.getFollowerProfiles(profile_followed.id);
    expect(profile_follower.id).toBe(followers![0].id);
  });

  describe("topics related tests", () => {
    let topicNameA = "Topic A";
    let topicNameB = "Topic B";
    let topicNameC = "Topic C";
    let topicaResp: UploadResponse;
    let topicbResp: UploadResponse;
    let topiccResp: UploadResponse;
    let api: IApi;

    beforeAll(async () => {
      api = new IrysApi(network, token);
      await api.connect();

      topicaResp = await api.addTopic(topicNameA);
      topicbResp = await api.addTopic(topicNameB);
      topiccResp = await api.addTopic(topicNameC);
    });

    it("call getAllTopics and confirm complete list of topics is returned", async () => {
      const topics = await api.getAllTopics();

      expect(topics![0].name).toBe(topicNameC);
      expect(topics![1].name).toBe(topicNameB);
      expect(topics![2].name).toBe(topicNameA);
    });

    it("call getTopicByWork and confirm returned topic", async () => {
      const profileResp = await api.addProfile(
        faker.internet.userName(),
        faker.internet.displayName(),
        faker.lorem.sentence(1)
      );

      const workResp = await api.addWork(
        faker.lorem.words(3),
        faker.lorem.sentence(1),
        faker.lorem.paragraph(1),
        profileResp.id,
        ActionType.Add
      );

      await api.addWorkTopic(topicaResp.id, workResp.id);

      const topics = await api.getTopicsByWork(workResp.id);
      expect(topics![0].name).toBe(topicNameA);
    });
  });
});
