// import { render, waitFor, screen } from "@testing-library/react";
// import UserEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { IrysApi } from "./IrysApi";
import { IApi } from "./IApi";
import { faker } from "@faker-js/faker";

describe("IrysApi Work tests", () => {
  beforeEach(async () => {
    const api: IApi = new IrysApi();
    await api.connect();

    let balance = await api.balance();
    console.log("current balance:", balance);
    if (balance < 0.001) {
      await api.arbitraryFund(40_000);
      console.log("40_000 funding added, new balance:", await api.balance());
    }
  });

  it("addWork adds a new work", async () => {
    const api: IApi = new IrysApi();
    await api.connect();

    const work = await api.addWork(
      faker.lorem.words(3),
      faker.lorem.lines(1),
      faker.lorem.paragraph(1),
      "author123",
      "topic123"
    );

    expect(work).not.toBeFalsy();
    expect(work.id).toBeTypeOf("string");
  });

  it("updateWork modifies an existing work", async () => {
    const api: IApi = new IrysApi();
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
    const topicId = "topic123";

    const addedWork = await api.addWork(
      title,
      description,
      content,
      authorId,
      topicId
    );

    const updateAppendage = "123";
    const updatedWork = await api.updateWork(
      title + updateAppendage,
      description + updateAppendage,
      content + updateAppendage,
      authorId,
      topicId,
      addedWork.id
    );
    const getResult = await api.getWork(updatedWork.id);

    expect(getResult?.title).toBe(title + updateAppendage);
    expect(getResult?.description).toBe(description + updateAppendage);
    expect(getResult?.content).toBe(content + updateAppendage);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("getWork gets back a saved new work", async () => {
    const api: IApi = new IrysApi();
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
    const topicId = "topic123";

    const work = await api.addWork(
      title,
      description,
      content,
      authorId,
      topicId
    );

    const getResult = await api.getWork(work.id);
    expect(getResult?.title).toBe(title);
    expect(getResult?.description).toBe(description);
    expect(getResult?.content).toBe(content);
    expect(getResult?.author_id).toBe(authorId);
  });

  it("addWork for multiple items and use searchWorksTop to get back top liked results", async () => {
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const worka = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
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
    const api: IApi = new IrysApi();
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
      profile.id,
      "topic123"
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );

    const searchResult = await api.searchWorks(desc, 2);
    expect(workb.id).toBe(searchResult!.workModels[0].id);
    expect(workc.id).toBe(searchResult!.workModels[1].id);
  });

  it("addWork for multiple items and use searchWorks to page twice", async () => {
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
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
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
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
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const workd = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const workc = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );
    await api.addWorkLike(workc.id, profile.id);
    await api.addWorkLike(workc.id, profile.id);
    await api.addWorkLike(workc.id, profile.id);

    const workb = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );
    await api.addWorkLike(workb.id, profile.id);
    await api.addWorkLike(workb.id, profile.id);

    const worka = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
    );

    const searchResult = await api.getAuthorWorksTop(profile.id, 10);
    expect(workc.id).toBe(searchResult!.workModels[0].id);
    expect(workb.id).toBe(searchResult!.workModels[1].id);
    expect(worka.id).toBe(searchResult!.workModels[2].id);
    expect(workd.id).toBe(searchResult!.workModels[3].id);
  });

  it("getOwnersProfile gets profile of profile just created", async () => {
    const api: IApi = new IrysApi();
    await api.connect();

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );

    const ownersProfile = await api.getOwnersProfile();
    expect(profile.id).toBe(ownersProfile?.profileModels[0].id);
  });

  it("getWorkResponses returns the expected paged responses", async () => {
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

    const profile = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const work = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      topicId
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

  it("getWorkResponsesByProfile returns the expected paged responses", async () => {
    const api: IApi = new IrysApi();
    await api.connect();
    const desc = faker.lorem.lines(1);
    const topicId = "topic123";

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
      profileWorkOwner.id,
      topicId
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

  it.only("addFollow adds one follow record", async () => {
    const api = new IrysApi();
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
});
