import { PrismaClient } from "@prisma/client";

export class TopicRepo {
  #client: PrismaClient;

  constructor(client: PrismaClient) {
    this.#client = client;
  }

  async insertTopic(name: string) {
    return await this.#client.topic.create({
      data: {
        name,
      },
    });
  }
}
