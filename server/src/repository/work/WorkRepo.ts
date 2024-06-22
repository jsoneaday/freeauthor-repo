import { PrismaClient } from "@prisma/client";
import { WorkImageRepo } from "./workImage/WorkImageRepo.js";
import { WorkImageItem } from "./workImage/WorkImage.js";

export class WorkRepo {
  #client: PrismaClient;
  #workImageRepo: WorkImageRepo;

  constructor(client: PrismaClient, workImageRepo: WorkImageRepo) {
    this.#client = client;
    this.#workImageRepo = workImageRepo;
  }

  async insertWork(
    title: string,
    description: string,
    content: string,
    authorId: bigint,
    topicIds: bigint[],
    images?: WorkImageItem[]
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

      await this.#workImageRepo.insertWorkImages(images, work.id, tx);

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
    topicIds: bigint[],
    images?: WorkImageItem[]
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

      await this.#workImageRepo.insertWorkImages(images, workId, tx);
    });
  }

  async selectWork(workId: bigint) {
    return await this.#client.work.findFirst({
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        author: {
          select: {
            userName: true,
            fullName: true,
            description: true,
          },
        },
        workLikes: {
          select: {
            id: true,
            workId: true,
            liker: {
              select: {
                id: true,
                userName: true,
                fullName: true,
              },
            },
          },
        },
      },
      where: {
        id: {
          equals: workId,
        },
      },
    });
  }
}
