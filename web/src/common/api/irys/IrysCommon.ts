import { IRYS_DATA_URL } from "../../Env";
import { ICommonApi } from "../interfaces/ICommonApi";
import {
  DataUpload,
  EntityType,
  FollowerTagNames,
  Tag,
  TopicTagNames,
  WorkLikeTagNames,
  WorkTagNames,
  WorkTopicTagNames,
} from "./models/ApiModels";

export class IrysCommon implements ICommonApi {
  async getData(entityTxId: string, isTextData: boolean): Promise<DataUpload> {
    const response = await fetch(`${IRYS_DATA_URL}/${entityTxId}`);

    if (response.ok) {
      if (isTextData) {
        return await response.text();
      }
      return await response.arrayBuffer();
    }
    return null;
  }

  tagsMatchByEntityType(
    entityType: EntityType,
    checkTag: Tag,
    searchTag: Tag
  ): boolean {
    if (entityType === EntityType.WorkTopic) {
      if (
        checkTag.name === WorkTopicTagNames.WorkId ||
        checkTag.name === WorkTopicTagNames.TopicId
      ) {
        if (
          checkTag.name === searchTag.name &&
          checkTag.value === searchTag.value
        ) {
          return true;
        }
      } else if (checkTag.name === searchTag.name) {
        return true;
      }
    } else if (entityType === EntityType.Topic) {
      if (checkTag.name === TopicTagNames.TopicName) {
        if (
          checkTag.name === searchTag.name &&
          checkTag.value === searchTag.value
        ) {
          return true;
        }
      } else if (checkTag.name === searchTag.name) {
        return true;
      }
    } else if (entityType === EntityType.Work) {
      if (
        checkTag.name === WorkTagNames.Title ||
        checkTag.name === WorkTagNames.Description ||
        checkTag.name === WorkTagNames.AuthorId
      ) {
        if (
          checkTag.name === searchTag.name &&
          checkTag.value === searchTag.value
        ) {
          return true;
        }
      } else if (checkTag.name === searchTag.name) {
        return true;
      }
    } else if (entityType === EntityType.Follow) {
      if (
        checkTag.name === FollowerTagNames.FollowedId ||
        checkTag.name === FollowerTagNames.FollowerId
      ) {
        if (
          checkTag.name === searchTag.name &&
          checkTag.value === searchTag.value
        ) {
          return true;
        }
      } else if (checkTag.name === searchTag.name) {
        return true;
      }
    } else if (entityType === EntityType.WorkLike) {
      if (
        checkTag.name === WorkLikeTagNames.WorkId ||
        checkTag.name === WorkLikeTagNames.LikerId
      ) {
        if (
          checkTag.name === searchTag.name &&
          checkTag.value === searchTag.value
        ) {
          return true;
        }
      } else if (checkTag.name === searchTag.name) {
        return true;
      }
    }

    return false;
  }
}
