// import { render, waitFor, screen } from "@testing-library/react";
// import UserEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { IrysApi } from "./IrysApi";
import { IApi } from "./IApi";
import { faker } from "@faker-js/faker";
import { UploadResponse } from "@irys/sdk/common/types";

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

    const result = await api.addWork(
      faker.lorem.words(3),
      faker.lorem.lines(1),
      faker.lorem.paragraph(1),
      "author123",
      "topic123"
    );

    const work = result as UploadResponse;
    expect(work).not.toBeFalsy();
    expect(work.id).toBeTypeOf("string");
  });

  it("updateWork modifies an existing work", async () => {
    const api: IApi = new IrysApi();
    await api.connect();

    const username = faker.internet.userName();
    const fullname = faker.internet.displayName();
    const profileDesc = faker.lorem.sentences(1);

    const profileResult = await api.addProfile(username, fullname, profileDesc);
    const profileResponse = profileResult as UploadResponse;

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;
    const topicId = "topic123";

    const addResult = await api.addWork(
      title,
      description,
      content,
      authorId,
      topicId
    );
    const addedWork = addResult as UploadResponse;

    const updateAppendage = "123";
    const updateResult = await api.updateWork(
      title + updateAppendage,
      description + updateAppendage,
      content + updateAppendage,
      authorId,
      topicId,
      addedWork.id
    );
    const updatedWork = updateResult as UploadResponse;
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

    const profileResult = await api.addProfile(username, fullname, profileDesc);
    const profileResponse = profileResult as UploadResponse;

    const title = faker.lorem.words(3);
    const description = faker.lorem.lines(1);
    const content = faker.lorem.paragraph(1);
    const authorId = profileResponse.id;
    const topicId = "topic123";

    const addResult = await api.addWork(
      title,
      description,
      content,
      authorId,
      topicId
    );

    const work = addResult as UploadResponse;
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

    const profileResp = await api.addProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(1)
    );
    const profile = profileResp as UploadResponse;

    const workdResp = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );
    const workd = workdResp as UploadResponse;

    const workcResp = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );
    const workc = workcResp as UploadResponse;

    const workbResp = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );
    const workb = workbResp as UploadResponse;

    const workaResp = await api.addWork(
      faker.lorem.words(3),
      desc,
      faker.lorem.paragraph(1),
      profile.id,
      "topic123"
    );
    const worka = workaResp as UploadResponse;

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
});
