export const BaseTags = [
  { name: "App", value: "FreeAuth" },
  { name: "Version", value: "1.0" },
];

/// This type includes example values
export type TxValidationMetadata = {
  id: string; // 'rSRGhJcUhdvEdF278JAYb45GHf1MYm0573pFLO0FbEs',
  token: string; // 'solana',
  currency: string; // 'solana',
  address: string; // "AdxpGAw3sFdUib8gjzSDgbXKAJGVSCxpu6LWEn8W2zJT";
  owner: string; // "jzEzluY1rMB7BA9mbhkJ_vckq18hENlVA9DMhrRTjhA";
  signature: string; // "_EQlsDgZa01WZsOBV7zsYYsvNtaT4JEO9jotxuD7clqUlusvJ2akmpjfP07NxDcRc38OBUsT3GOhidkpXA1UDw";
  target: string;
  tags: Tag[];
  anchor: string; // "bXp4OWxKZmNBQU9mRXFjRkwzb25ZOFRuaTNVMVJuMks";
  data_size: string; // "59";
  raw_size: string; // "418";
  signature_type: string; // "4";
  fee: string; // "27257";
  receipt: {
    version: string; // "1.0.0";
    signature: string; // "Fsq4cVtHA8psljOa6ukTJaPeVGsKqgXkkQpMyQ6eD1U0cXiCcdZNDwGaaYyRSw7bJ_soqhE1VW5RsUw_j2ipK_e7AM6Rtmvdj-jUiMMS2HlAaTn9AWOz5SH-B13Yy5IOkKu5t1hyxoXwus7VBapyU5phLRRJ-XlHHeEoRJ2XH9hN76CoWMQ6Y4h75XFyyXHo1oEeD3Y8LtXbsGrv-r3RyTfY3JYXeWhovCSrVq6-hvFGhDTuzoJlibjXqSXgfHxdgexuMZ82LW7I_UAyP7_pmBwyyYftxAUFNeDsEfUjOvqhJIVmcNjbt2n2afEr3NseD47rziXs3b_QB3U1nif6e5f_txi9E4e7grSo58dJ6p05l06XhJ_Gx9I-z3PtPrHA3WY_D7ekzxAIh9cLxcU7ftvJRs2m0H1BFoOY_pvJoY5zYAXYUxgVHxNhyoJYRjHpJxuTj1ryri7QqMSaLvA1o8dslfmyHu7toeaMfP1QfMFa9hVbYFBXIKgw75Pwt3LxCZRvcoacnw53WcKdgUIRVoa3G0bSGcEtb0rSKphI61vE0uHOdWmqLL4CuRmUrvyQnCaS0ToIFGxIukoQNSjCyuFS1mVj2w4iTW31Ku8G6PEUNz0JYxtbNo1EnllGym1nGRY2AWC55mdEARr3tUja_fvSF0jqwSP86vdZxH7lWSk";
    timestamp: string; // "1716775900192";
    deadlineHeight: string; // "1436503";
  };
};

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
    /// description is used to search on
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
