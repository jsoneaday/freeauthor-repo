import { PrismaClient, WorkTopic } from "@prisma/client";

export class WorkRepo {
  #client: PrismaClient;

  constructor(client: PrismaClient) {
    this.#client = client;
  }

  async insertWork(
    title: string,
    description: string,
    content: string,
    authorId: bigint,
    topicIds: bigint[]
  ) {
    return await this.#client.$transaction(async (tx) => {
      const work = await tx.work.create({
        data: {
          title,
          description,
          content,
          authorId,
        },
      });

      const topicData: { workId: bigint; topicId: bigint }[] = new Array(
        topicIds.length
      );
      for (let i = 0; i < topicIds.length; i++) {
        topicData[i] = {
          workId: work.id,
          topicId: topicIds[i],
        };
      }
      await tx.workTopic.createMany({
        data: topicData,
      });

      return work;
    });
  }

  async updateWork(
    workId: bigint,
    title: string,
    description: string,
    content: string,
    /// the topics here are considered adds,
    /// if any already exist it will get skipped else it is added
    topicIds: bigint[]
  ) {
    return await this.#client.$transaction(async (tx) => {
      await tx.work.update({
        where: {
          id: workId,
        },
        data: {
          title,
          description,
          content,
        },
      });

      const existingWorkTopics = await tx.workTopic.findMany({
        select: { topicId: true },
        where: {
          workId: {
            equals: workId,
          },
          topicId: {
            in: topicIds,
          },
        },
      });

      const existingWorkTopicIds = new Set(
        existingWorkTopics.map((wt) => wt.topicId)
      );
      const workTopicsToAdd = new Set<bigint>();
      for (let i = 0; i < topicIds.length; i++) {
        if (!existingWorkTopicIds.has(topicIds[i])) {
          workTopicsToAdd.add(topicIds[i]);
        }
      }
      await tx.workTopic.createMany({
        data: Array.from(workTopicsToAdd).map((topicId) => ({
          workId,
          topicId,
        })),
      });
    });
  }

  async selectWork(workId: bigint) {
    return await this.#client.work.findFirst({
      where: {
        id: {
          equals: workId,
        },
      },
    });
  }
}
