import { IRYS_DATA_URL, NETWORK, TOKEN } from "../../Env";
import { ICommonApi } from "../interfaces/ICommonApi";
import {
  ActionName,
  ActionType,
  DataUpload,
  EntityType,
  FollowerTagNames,
  QueryResponse,
  Tag,
  TopicModel,
  TopicTagNames,
  WorkLikeTagNames,
  WorkTagNames,
  WorkTopicTagNames,
} from "./models/ApiModels";

export const DESC = "DESC";
//const ASC = "ASC";
export const SEARCH_TX = "irys:transactions";

export class IrysCommon implements ICommonApi {
  #network = NETWORK;
  get Network() {
    return this.#network;
  }
  set Network(val: string) {
    this.#network = val;
  }

  #token = TOKEN;
  get Token() {
    return this.#token;
  }
  set Token(val: string) {
    this.#token = val;
  }

  /// Assumed sort by last inserted record first (i.e. timestamp),
  /// as its possible after a remove a new insert is then done
  #getNonRemovedResponses(entityType: EntityType, responses: QueryResponse[]) {
    const nonRemovedResponses: QueryResponse[] = [];

    // see if each response is already in final list and add it if not
    for (let i = 0; i < responses.length; i++) {
      const responseToCheck = responses[i];

      if (
        !this.#containsMatchingResponse(
          responseToCheck,
          nonRemovedResponses,
          entityType
        )
      ) {
        nonRemovedResponses.push(responseToCheck);
      }
    }

    // after getting list of unique records remove the nodes tagged Remove
    return nonRemovedResponses.filter(
      (resp) =>
        !resp.tags.find(
          (tag) => tag.name === ActionName && tag.value === ActionType.Remove
        )
    );
  }

  /// if all tags have matching names
  #containsMatchingResponse(
    responseToCheck: QueryResponse,
    searchResponses: QueryResponse[],
    entityType: EntityType
  ) {
    const checkTags = responseToCheck.tags;
    for (const searchResponse of searchResponses) {
      let matchCount = 0;

      for (const checkTag of checkTags) {
        let currentTagMatches = false;

        for (const searchTag of searchResponse.tags) {
          if (this.tagsMatchByEntityType(entityType, checkTag, searchTag)) {
            currentTagMatches = true;
            break;
          }
        }
        if (currentTagMatches) {
          matchCount += 1;
        }
      }
      if (checkTags.length === matchCount) {
        return true;
      }
    }
    return false;
  }

  async convertQueryToTopics(
    queryResponse: QueryResponse[]
  ): Promise<TopicModel[]> {
    const _queryResp = this.removeDeletedRecords(
      queryResponse,
      EntityType.Topic
    );
    const topics: TopicModel[] = new Array(_queryResp.length);
    for (let i = 0; i < _queryResp.length; i++) {
      topics[i] = {
        id: _queryResp[i].id,
        updated_at: _queryResp[i].timestamp,
        name:
          _queryResp[i].tags.find((tag) => tag.name === TopicTagNames.TopicName)
            ?.value || "",
      };
    }
    return topics;
  }

  /// Arweave has no way of actually deleting records
  /// This set of function will filter for records that have NOT
  /// been tagged as remove (deleted)
  removeDeletedRecords(
    response: QueryResponse[] | null,
    entityType: EntityType
  ): QueryResponse[] {
    return !response ? [] : this.#getNonRemovedResponses(entityType, response);
  }

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
