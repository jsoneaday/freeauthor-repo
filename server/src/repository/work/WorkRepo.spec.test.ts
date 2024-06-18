import { describe, it } from "node:test";
import { readFile } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "url";
import assert from "node:assert";
import { Repository } from "../Repository.js";
import { faker } from "@faker-js/faker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Work tests", () => {
  it("insertWork creates a new work", async () => {
    const repo = new Repository();
    const title = faker.lorem.sentence(6);
    const description = faker.lorem.sentence(10);
    const content = faker.lorem.sentences(2);
    const filePath = join(__dirname, "__test__/longhair.jpg");
    let avatar: Buffer | undefined = undefined;
    readFile(filePath, (err, data) => {
      avatar = data;
    });

    const author = await repo.Profile.insertProfile(
      faker.internet.userName(),
      faker.internet.displayName(),
      faker.lorem.sentence(5),
      faker.lorem.sentence(6),
      faker.internet.url(),
      faker.internet.url(),
      avatar
    );

    const topic = await repo.Topic.insertTopic(faker.company.name());

    const work = await repo.Work.insertWork(
      title,
      description,
      content,
      author.id,
      [BigInt(topic.id)]
    );

    const workTopics = await repo.WorkTopic.selectWorkTopicsByWork(work.id);

    assert.equal(work.title, title);
    assert.equal(work.description, description);
    assert.equal(work.content, content);
    assert.equal(work.authorId, author.id);
    assert.equal(workTopics[0].workId, work.id);
    assert.equal(workTopics[0].topicId, topic.id);
  });
});
