// import { render, waitFor, screen } from "@testing-library/react";
// import UserEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { IrysApi } from "./IrysApi";
import { IApi } from "./IApi";
import { faker } from "@faker-js/faker";
import { UploadResponse } from "@irys/sdk/common/types";

describe("IrysApi tests", () => {
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
});
