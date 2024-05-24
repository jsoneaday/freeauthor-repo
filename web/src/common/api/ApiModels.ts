export const BaseTags = [
  { name: "App", value: "FreeAuth" },
  { name: "Version", value: "1.0" },
];

export type QueryResponse = {
  id: string;
  receipt: {
    deadlineHeight: number;
    signature: string;
    timestamp: number;
    version: string;
  };
  tags: {
    name: string;
    value: string;
  }[];
  address: string;
  token: string;
  signature: string;
  timestamp: number;
};

export type QueryResponseWithData = QueryResponse & {
  data: undefined | null | string | ArrayBuffer;
};

export interface Entity {
  id: string;
  updated_at: number;
}

export type Tag = {
  name: string;
  value: string;
};

export type Avatar = {
  file: File;
  fileExtension: string;
};

/// The content
export class WorkModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public title: string,
    public content: string,
    public author_id: string,
    public description: string | undefined
  ) {}
}

export class WorkWithAuthorModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public title: string,
    public content: string,
    public description: string | undefined,
    public author_id: string,
    public username: string,
    public fullname: string,
    public profileDesc: string
  ) {}
}

/// Details about the author
export class ProfileModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public username: string,
    public fullname: string,
    public description: string,
    public owner_address: string,
    public social_link_primary: string | undefined,
    public social_link_second: string | undefined
  ) {}
}

/// Profile follower and the Profile being followed
export class FollowModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public follower_id: string,
    public followed_id: string
  ) {}
}

/// Content category
export class TopicModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public name: string
  ) {}
}

export class WorkTopicModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public topic_id: string,
    public work_id: string
  ) {}
}

export class WorkLikeModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public work_id: string,
    public liker_id: string
  ) {}
}

// export class WorkResponse implements Entity {
//   constructor(
//     public id: string,
//     public updated_at: number,
//     public content: string,
//     public work_id: number,
//     public responder_id: number
//   ) {}
// }

/// Response comment
export class WorkResponseModel implements Entity {
  constructor(
    public id: string,
    public updated_at: number,
    public work_id: string,
    public work_title: string,
    public response_content: string,
    public responder_id: string,
    public username: string,
    public fullname: string,
    public profileDesc: string
  ) {}
}
