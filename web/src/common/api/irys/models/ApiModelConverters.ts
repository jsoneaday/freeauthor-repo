import {
  DataUpload,
  ProfileModel,
  ProfileTagNames,
  QueryResponse,
  WorkModel,
  WorkResponseModel,
  WorkResponseModelWithProfile,
  WorkTagNames,
  WorkWithAuthorModel,
} from "./ApiModels";

export function convertModelsToWorkWithAuthor(
  work: WorkModel,
  profileModel: ProfileModel,
  likeCount: number = 0
): WorkWithAuthorModel {
  return new WorkWithAuthorModel(
    work.id,
    work.updated_at,
    work.title,
    work.content,
    work.description,
    work.author_id,
    profileModel.username,
    profileModel.fullname,
    profileModel.description,
    likeCount
  );
}

export function convertModelsToWorkResponseWithAuthor(
  workResponse: WorkResponseModel,
  profileModel: ProfileModel
) {
  return new WorkResponseModelWithProfile(
    workResponse.id,
    workResponse.updated_at,
    workResponse.work_id,
    workResponse.work_title,
    workResponse.response_content,
    workResponse.responder_id,
    profileModel.username,
    profileModel.fullname,
    profileModel.description
  );
}

export function convertQueryToWork(
  response: QueryResponse,
  data: DataUpload
): WorkModel {
  return new WorkModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
    (data as string) ? (data as string) : "",
    response.tags.find((tag) => tag.name == WorkTagNames.AuthorId)?.value || "",
    response.tags.find((tag) => tag.name == WorkTagNames.Description)?.value
  );
}

export function convertQueryToProfile(
  response: QueryResponse,
  data: ArrayBuffer | null
): ProfileModel {
  return new ProfileModel(
    response.id,
    response.timestamp,
    response.tags.find((tag) => tag.name == ProfileTagNames.UserName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.FullName)?.value ||
      "",
    response.tags.find((tag) => tag.name == ProfileTagNames.Description)
      ?.value || "",
    response.tags.find((tag) => tag.name == ProfileTagNames.OwnerAddress)
      ?.value || "",
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkPrimary
    )?.value,
    response.tags.find(
      (tag) => tag.name == ProfileTagNames.SocialLinkSecondary
    )?.value,
    data
  );
}
