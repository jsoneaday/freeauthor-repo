import { Work } from "@prisma/client";

export class WorkWithAuthorModel {
  constructor(
    public id: bigint,
    public createdAt: Date,
    public updatedAt: Date,
    public title: string,
    public content: string,
    /// description is used to search on
    public description: string,
    public authorId: bigint,
    public username: string,
    public fullname: string,
    public profileDesc: string,
    public likes: number
  ) {}
}
