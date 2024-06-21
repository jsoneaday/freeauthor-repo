import { PrismaClient } from "@prisma/client";

export class ProfileRepo {
  #client: PrismaClient;

  constructor(client: PrismaClient) {
    this.#client = client;
  }

  async insertProfile(
    userName: string,
    fullName: string,
    description: string,
    ownerAddress: string,
    socialLinkPrimary: string | undefined,
    socialLinkSecondary: string | undefined,
    avatar: Buffer | undefined
  ) {
    return await this.#client.$transaction(async (tx) => {
      let avatarId: bigint | undefined;
      if (avatar) {
        const avatarResult = await this.#client.profileAvatar.create({
          data: {
            avatar,
          },
        });
        avatarId = avatarResult.id;
      }

      return await this.#client.profile.create({
        data: {
          userName,
          fullName,
          description,
          ownerAddress,
          socialLinkPrimary,
          socialLinkSecondary,
          avatarId,
        },
      });
    });
  }
}
