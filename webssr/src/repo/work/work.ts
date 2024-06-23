import { Topic } from "../topic/topic";

export class Work {
  get slug() {
    return this.title.trim().replace(/[A-Z]/g, "_");
  }

  constructor(
    public id: bigint,
    public updatedAt: string,
    public title: string,
    public description: string,
    public content: string,
    public authorId: bigint,
    public userName: string,
    public fullName: string,
    public topics: Topic[],
    public avatar?: ArrayBuffer
  ) {}
}
