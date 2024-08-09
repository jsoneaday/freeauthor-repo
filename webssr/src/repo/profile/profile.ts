export class Profile {
  get slug() {
    return this.userName;
  }

  constructor(
    public id: bigint,
    public updatedAt: string,
    public userName: string,
    public fullName: string,
    public description: string,
    public socialLinkPrimary: string,
    public socialLinkSecondary: string,
    public avatarId: bigint
  ) {}
}
