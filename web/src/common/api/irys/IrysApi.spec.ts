// import { render, waitFor, screen } from "@testing-library/react";
// import UserEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { IrysWriteApi } from "./IrysWriteApi";
import { IWriteApi } from "../interfaces/IWriteApi";
import { faker } from "@faker-js/faker";
import { UploadResponse } from "@irys/sdk/common/types";
import { IrysCommon } from "./IrysCommon";
import { IrysReadApi } from "./IrysReadApi";
import { PAGE_SIZE } from "../../utils/StandardValues";

const network = "devnet";
const token = "solana";

describe("IrysApi Work tests", () => {
  beforeEach(async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    let balance = await irysWrite.balance();
    console.log("current balance:", balance);
    if (balance < 0.001) {
      await irysWrite.arbitraryFund(40_000);
      console.log(
        "40_000 funding added, new balance:",
        await irysWrite.balance()
      );
    }
  });

  it("addWork adds a new work", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const work = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.lines(1),
      faker.lorem.paragraph(1),
      "author123"
    );

    expect(work).not.toBeFalsy();
    expect(work.id).toBeTypeOf("string");
  });

  it("updateWork modifies an existing work", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const username = faker.internet.userName();
    const fullname = faker.internet.displayName();
    const profileDesc = faker.lorem.sentences(1);

    const profileResponse = await irysWrite.addProfile(
      username,
      fullname,
      profileDesc
    );

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;

    const addedWork = await irysWrite.addWork(
      title,
      description,
      content,
      authorId
    );

    const updateAppendage = "123";
    const updatedWork = await irysWrite.updateWork(
      title + updateAppendage,
      description + updateAppendage,
      content + updateAppendage,
      authorId,
      addedWork.id
    );
    const getResult = await irysRead.getWork(updatedWork.id);

    expect(getResult?.title).toBe(title + updateAppendage);
    expect(getResult?.description).toBe(description + updateAppendage);
    expect(getResult?.content).toBe(content + updateAppendage);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("getWork gets back a saved new work", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const username = faker.internet.userName();
    const fullname = faker.internet.displayName();
    const profileDesc = faker.lorem.sentences(1);

    const profileResponse = await irysWrite.addProfile(
      username,
      fullname,
      profileDesc
    );

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;

    const work = await irysWrite.addWork(title, description, content, authorId);

    const getResult = await irysRead.getWork(work.id);
    expect(getResult?.title).toBe(title);
    expect(getResult?.description).toBe(description);
    expect(getResult?.content).toBe(content);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("addWork for multiple items and use searchWorksTop to get back top liked results", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const worka = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWorkLike(worka.id, workb.id);
    await irysWrite.addWorkLike(worka.id, workc.id);
    await irysWrite.addWorkLike(worka.id, workd.id);

    await irysWrite.addWorkLike(workb.id, workc.id);
    await irysWrite.addWorkLike(workb.id, workd.id);

    await irysWrite.addWorkLike(workc.id, workd.id);

    const searchResults = await irysRead.searchWorksTop(desc);

    expect(worka.id).toBe(searchResults![0].id);
    expect(workb.id).toBe(searchResults![1].id);
    expect(workc.id).toBe(searchResults![2].id);
    expect(workd.id).toBe(searchResults![3].id);
  });

  it("addWork for 3 items and use searchWorks to get back two results", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const searchResult = await irysRead.searchWorks(desc, 2);
    expect(workb.id).toBe(searchResult!.workModels[0].id);
    expect(workc.id).toBe(searchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use searchWorks to page twice", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const firstSearchResult = await irysRead.searchWorks(desc, 2);
    const secondSearchResult = await irysRead.searchWorks(
      desc,
      2,
      firstSearchResult!.cursor
    );
    expect(workc.id).toBe(secondSearchResult!.workModels[0].id);
    expect(workd.id).toBe(secondSearchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use getAuthorWorks to page twice", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    const firstSearchResult = await irysRead.getAuthorWorks(profile.id, 2);
    const secondSearchResult = await irysRead.getAuthorWorks(
      profile.id,
      2,
      firstSearchResult!.cursor
    );
    expect(workc.id).toBe(secondSearchResult!.workModels[0].id);
    expect(workd.id).toBe(secondSearchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use getAuthorWorksTop to receive a sorted list of works sorted by like count", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile1 = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile2 = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile3 = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile4 = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile1.id
    );

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile1.id
    );
    await irysWrite.addWorkLike(workc.id, profile2.id);
    await irysWrite.addWorkLike(workc.id, profile3.id);
    await irysWrite.addWorkLike(workc.id, profile4.id);

    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile1.id
    );
    await irysWrite.addWorkLike(workb.id, profile2.id);
    await irysWrite.addWorkLike(workb.id, profile3.id);

    const worka = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile1.id
    );

    const searchResult = await irysRead.getAuthorWorksTop(profile1.id, 10);
    expect(workc.id).toBe(searchResult!.workModels[0].id);
    expect(workb.id).toBe(searchResult!.workModels[1].id);
    expect(worka.id).toBe(searchResult!.workModels[2].id);
    expect(workd.id).toBe(searchResult!.workModels[3].id);
  });

  it("getWorksByAllFollowed gets correct works list of all followed people", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const profileb = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profileb.id
    );
    const profilec = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilec.id
    );
    const profiled = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const workd = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profiled.id
    );

    await irysWrite.addFollow(profilea.id, profileb.id);
    await irysWrite.addFollow(profilea.id, profilec.id);
    await irysWrite.addFollow(profilea.id, profiled.id);
    const works = await irysRead.getWorksByAllFollowed(profilea.id, 4);
    expect(works!.workModels[0].id).toBe(workd.id);
    expect(works!.workModels[1].id).toBe(workc.id);
    expect(works!.workModels[2].id).toBe(workb.id);
  });

  it("getWorksByAllFollowedTop gets correct works list of all 20 followed people", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const followedWorks: UploadResponse[] = new Array(20);
    for (let i = 0; i < 20; i++) {
      const profile = await irysWrite.addProfile(
        faker.internet.userName(),
        faker.internet.displayName(),
        faker.lorem.sentence(1)
      );
      followedWorks[i] = await irysWrite.addWork(
        faker.lorem.words(3),
        faker.lorem.sentence(1),
        faker.lorem.paragraph(1),
        profile.id
      );
      await irysWrite.addFollow(profilea.id, profile.id);
    }

    // the list should return the first followedWork and the last followed work as first and second elements
    await irysWrite.addWorkLike(followedWorks[0].id, profilea.id);
    await irysWrite.addWorkLike(
      followedWorks[followedWorks.length - 1].id,
      profilea.id
    );

    const works = await irysRead.getWorksByAllFollowedTop(profilea.id);
    expect(works!.workModels.length).toBe(followedWorks.length);

    expect(works!.workModels[0].id).toBe(
      followedWorks[followedWorks.length - 1].id
    );
    expect(works!.workModels[1].id).toBe(followedWorks[0].id);
  });

  it("getWorksByOneFollowed gets the one work of followed profile", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const profileb = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profileb.id
    );
    await irysWrite.addFollow(profilea.id, profileb.id);

    const works = await irysRead.getWorksByOneFollowed(profileb.id, 10);
    expect(works!.workModels.length).toBe(1);
    expect(works!.workModels[0].id).toBe(workb.id);
  });

  it("getWorksByOneFollowedTop gets the one work of followed profile", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const profileb = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addFollow(profilea.id, profileb.id);

    for (let i = 0; i < 20; i++) {
      await irysWrite.addWork(
        faker.lorem.words(3),
        faker.lorem.sentence(1),
        faker.lorem.paragraph(1),
        profileb.id
      );
    }

    const works = await irysRead.getWorksByOneFollowedTop(profileb.id);
    expect(works!.workModels.length).toBe(PAGE_SIZE);
  });

  it("getWorksByTopic gets works by a topic", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const worka = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );
    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );
    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );

    const existingTopics = await irysRead.getAllTopics();
    let topicaRespId: string;
    if (existingTopics.length === 0) {
      topicaRespId = (await irysWrite.addTopic(faker.company.name())).id;
    } else {
      topicaRespId = existingTopics[0].id;
    }

    await irysWrite.addWorkTopic(topicaRespId, worka.id);
    await irysWrite.addWorkTopic(topicaRespId, workb.id);
    await irysWrite.addWorkTopic(topicaRespId, workc.id);

    const works = await irysRead.getWorksByTopic(topicaRespId, 2);
    expect(works!.workModels.length).toBe(2);
    expect(works!.workModels[0].id).toBe(workc.id);
    expect(works!.workModels[1].id).toBe(workb.id);
  });

  it("getWorksByTopicTop gets works by a topic sorted by likes desc", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profileb = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const worka = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );
    await irysWrite.addWorkLike(worka.id, profilea.id);

    const workb = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );
    await irysWrite.addWorkLike(workb.id, profilea.id);
    await irysWrite.addWorkLike(workb.id, profileb.id);

    const workc = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profilea.id
    );

    const existingTopics = await irysRead.getAllTopics();
    let topicaRespId: string;
    if (existingTopics.length === 0) {
      topicaRespId = (await irysWrite.addTopic(faker.company.name())).id;
    } else {
      topicaRespId = existingTopics[0].id;
    }

    await irysWrite.addWorkTopic(topicaRespId, worka.id);
    await irysWrite.addWorkTopic(topicaRespId, workb.id);
    await irysWrite.addWorkTopic(topicaRespId, workc.id);

    const works = await irysRead.getWorksByTopicTop(topicaRespId);
    console.log(
      "works!.workModels",
      works!.workModels.length,
      works!.workModels
    );

    expect(works!.workModels.find((work) => work.id === workb.id)?.likes).toBe(
      2
    );
    expect(works!.workModels.find((work) => work.id === worka.id)?.likes).toBe(
      1
    );
  });
});

describe("Profile related tests", () => {
  it("getOwnersProfile gets profile of profile just created", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const api: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await api.connect();

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const ownersProfile = await api.getOwnersProfile();
    expect(profile.id).toBe(ownersProfile?.id);
  });

  it("addFollow adds one follow record and getFollowedProfiles retrieves followed profile", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profile_follower = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile_followed = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addFollow(profile_follower.id, profile_followed.id);
    const followed = await irysRead.getFollowedProfiles(profile_follower.id);
    expect(profile_followed.id).toBe(followed![0].id);
  });

  it("addFollow adds one follow record and getFollowerProfiles retrieves follower profile", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profile_follower = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile_followed = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addFollow(profile_follower.id, profile_followed.id);
    const followers = await irysRead.getFollowerProfiles(profile_followed.id);
    expect(profile_follower.id).toBe(followers![0].id);
  });
});

describe("WorkResponse related tests", () => {
  it("getWorkResponses returns the expected paged responses", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWorkResponse("hello a", work.id, profile.id);
    const responseb = await irysWrite.addWorkResponse(
      "hello b",
      work.id,
      profile.id
    );
    const responsec = await irysWrite.addWorkResponse(
      "hello c",
      work.id,
      profile.id
    );
    const responsed = await irysWrite.addWorkResponse(
      "hello d",
      work.id,
      profile.id
    );

    const workResponses = await irysRead.getWorkResponses(work.id, 3);
    expect(responsed.id).toBe(workResponses?.workResponseModels[0].id);
    expect(responsec.id).toBe(workResponses?.workResponseModels[1].id);
    expect(responseb.id).toBe(workResponses?.workResponseModels[2].id);
  });

  it("getWorkResponseCount returns the expected response count", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id
    );

    await irysWrite.addWorkResponse("hello a", work.id, profile.id);
    await irysWrite.addWorkResponse("hello b", work.id, profile.id);
    await irysWrite.addWorkResponse("hello c", work.id, profile.id);
    await irysWrite.addWorkResponse("hello d", work.id, profile.id);

    const workResponseCount = await irysRead.getWorkResponseCount(work.id);
    console.log("workResponseCount", workResponseCount);
    expect(workResponseCount).toBe(4);
  });

  it("getWorkResponsesByProfile returns the expected paged responses", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();
    const desc = faker.lorem.lines(1);

    const profileWorkOwner = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profileWorkResponseOwner = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await irysWrite.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profileWorkOwner.id
    );

    const responsea = await irysWrite.addWorkResponse(
      "hello a",
      work.id,
      profileWorkResponseOwner.id
    );
    const responseb = await irysWrite.addWorkResponse(
      "hello b",
      work.id,
      profileWorkResponseOwner.id
    );
    const responsec = await irysWrite.addWorkResponse(
      "hello c",
      work.id,
      profileWorkResponseOwner.id
    );
    const responsed = await irysWrite.addWorkResponse(
      "hello d",
      work.id,
      profileWorkResponseOwner.id
    );

    const workResponses = await irysRead.getWorkResponsesByProfile(
      profileWorkResponseOwner.id,
      4
    );
    expect(responsed.id).toBe(workResponses?.workResponseModels[0].id);
    expect(responsec.id).toBe(workResponses?.workResponseModels[1].id);
    expect(responseb.id).toBe(workResponses?.workResponseModels[2].id);
    expect(responsea.id).toBe(workResponses?.workResponseModels[3].id);
  });
});

describe("follow related topics", () => {
  it("removeFollow marks follow entries as remove and subsequently prevents getting previously added follows", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profilea = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profileb = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addFollow(profilea.id, profileb.id);
    await irysWrite.removeFollow(profilea.id, profileb.id);

    const followed = await irysRead.getFollowedProfiles(profilea.id);
    const follower = await irysRead.getFollowerProfiles(profileb.id);

    expect(followed?.length).toBe(0);
    expect(follower?.length).toBe(0);
  });
});

describe("topics related tests", () => {
  let topicNameA = "Topic A";
  let topicNameB = "Topic B";
  let topicNameC = "Topic C";

  it("call getAllTopics and confirm complete list of topics is returned", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    await irysWrite.addTopic(topicNameA);
    await irysWrite.addTopic(topicNameB);
    await irysWrite.addTopic(topicNameC);

    const topics = await irysRead.getAllTopics();

    expect(topics![0].name).toBe(topicNameC);
    expect(topics![1].name).toBe(topicNameB);
    expect(topics![2].name).toBe(topicNameA);
  });

  it("removeTopic and confirm topic removed", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profileResp = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profileResp.id
    );

    const topicName = faker.company.name();
    const topic = await irysWrite.addTopic(topicName);
    await irysWrite.removeTopic(topicName);
    const allTopics = await irysRead.getAllTopics();

    expect(allTopics.find((t) => t.id === topic.id)).toBeUndefined();
  });
});

describe("WorkLike related tests", () => {
  it("call removeWorkLike and confirm WorkLIke removed", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profileResp = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workResp = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profileResp.id
    );

    await irysWrite.addWorkLike(workResp.id, profileResp.id);

    await irysWrite.removeWorkLike(workResp.id, profileResp.id);
    let count = await irysRead.getWorkLikeCount(workResp.id);
    expect(count).toBe(0);
  });
});

describe("Topic related tests", () => {
  it("getTopicsByWork returns correct topics", async () => {
    const irysCommon = new IrysCommon();
    irysCommon.Network = network;
    irysCommon.Token = token;
    const irysRead = new IrysReadApi(irysCommon);
    const irysWrite: IWriteApi = new IrysWriteApi(irysCommon, irysRead);
    await irysWrite.connect();

    const profile = await irysWrite.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const work = await irysWrite.addWork(
      faker.lorem.words(3),
      faker.lorem.sentence(1),
      faker.lorem.paragraph(1),
      profile.id
    );

    const topica = await irysWrite.addTopic(faker.company.name());
    const topicb = await irysWrite.addTopic(faker.company.name());
    // need to wait for irys cache update
    setTimeout(async () => {
      await irysWrite.addWorkTopic(topica.id, work.id);
      await irysWrite.addWorkTopic(topicb.id, work.id);

      const topics = await irysRead.getTopicsByWork(work.id);
      expect(topics?.length).toBe(2);
      expect(topicb.id).toBe(topics![0].id);
      expect(topica.id).toBe(topics![1].id);
    }, 3000);
  });
});
