import { IRYS_GRAPHQL_URL } from "../../Env";
import { IApi } from "../interfaces/IApi";
import { IGraphql } from "../interfaces/IGraphql";
import { ICommonApi } from "../interfaces/ICommonApi";
import {
  convertModelsToWorkResponseWithAuthor,
  convertModelsToWorkWithAuthor,
} from "./models/ApiModelConverters";
import {
  ActionName,
  ActionType,
  DataUpload,
  EntityType,
  FollowModel,
  FollowerTagNames,
  IrysGraphqlEdge,
  IrysGraphqlResponse,
  IrysGraphqlResponseNode,
  IrysGraphqlVariables,
  PagedProfileModel,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  ProfileTagNames,
  TopicModel,
  TopicTagNames,
  WorkModel,
  WorkResponderTagNames,
  WorkResponseModel,
  WorkResponseModelWithProfile,
  WorkTagNames,
  WorkTopicModel,
  WorkTopicTagNames,
  WorkWithAuthorModel,
} from "./models/ApiModels";

export class IrysGraphql implements IGraphql {
  #irysCommon: ICommonApi;
  #irysApi: IApi;

  constructor(uploaddata: ICommonApi, irysApi: IApi) {
    this.#irysCommon = uploaddata;
    this.#irysApi = irysApi;
  }

  async queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null> {
    const query = this.#buildQuery(variables);
    const result = await fetch(IRYS_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (result.ok) {
      return await result.json();
    }
    return null;
  }

  #buildQuery(variables: IrysGraphqlVariables) {
    let outerVariable = "";
    let innerVariable = "";

    if (variables.tags) {
      outerVariable = "$tags: [TagFilter!]!";
      innerVariable = `
        tags: $tags        
      `;
    }
    if (variables.ids) {
      outerVariable += ", $ids: [String!]!";
      innerVariable += `
        ids: $ids
      `;
    }
    if (variables.limit) {
      outerVariable += ", $limit: Int!";
      innerVariable += `
        limit: $limit
      `;
    }
    if (variables.cursor) {
      outerVariable += ", $cursor: String!";
      innerVariable += `
        after: $cursor
      `;
    }
    // sorting is always by timestamp
    if (variables.order) {
      innerVariable += `
        order: ${variables.order} 
      `;
    } else {
      innerVariable += `
        order: DESC 
      `;
    }

    let query = `
      query Get(${outerVariable}) {
        transactions(
          ${innerVariable}          
        ) {
          edges {
            node {
              id
              address
              token
              receipt {
                deadlineHeight
                signature
                version
              }
              tags {
                name
                value
              }
              timestamp
            }
            cursor
          }
        }
      }
    `;
    return query;
  }

  /// Assumed sort by last inserted record first (i.e. timestamp),
  /// as its possible after a remove a new insert is then done
  #getNonRemovedEdges(entityType: EntityType, sourceEdges: IrysGraphqlEdge[]) {
    const nonRemovedEdges: IrysGraphqlEdge[] = [];

    // see if each edge is already in final list and add it if not
    for (let i = 0; i < sourceEdges.length; i++) {
      const edgeToCheck = sourceEdges[i];

      if (
        !this.#containsMatchingEdge(edgeToCheck, nonRemovedEdges, entityType)
      ) {
        nonRemovedEdges.push(edgeToCheck);
      }
    }

    // after getting list of unique records remove the nodes tagged Remove
    return nonRemovedEdges.filter(
      (edge) =>
        !edge.node.tags.find(
          (tag) => tag.name === ActionName && tag.value === ActionType.Remove
        )
    );
  }

  /// if all tags have matching names
  #containsMatchingEdge(
    edgeToCheck: IrysGraphqlEdge,
    searchEdges: IrysGraphqlEdge[],
    entityType: EntityType
  ) {
    const checkTags = edgeToCheck.node.tags;
    for (const searchEdge of searchEdges) {
      let matchCount = 0;

      for (const checkTag of checkTags) {
        let currentTagMatches = false;

        for (const searchEdgeTag of searchEdge.node.tags) {
          if (
            this.#irysCommon.tagsMatchByEntityType(
              entityType,
              checkTag,
              searchEdgeTag
            )
          ) {
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

  /// Arweave has no way of actually deleting records
  /// This set of function will filter for records that have NOT
  /// been tagged as remove (deleted)
  removeDeletedRecords(
    response: IrysGraphqlResponse | null,
    entityType: EntityType
  ): IrysGraphqlResponse {
    const cleanedList: IrysGraphqlResponse = {
      data: {
        transactions: {
          edges: !response
            ? []
            : this.#getNonRemovedEdges(
                entityType,
                response.data.transactions.edges
              ),
        },
      },
    };

    return cleanedList;
  }

  async convertGqlResponseNodeToWorkResponse(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkResponseModelWithProfile> {
    const data = await this.#irysCommon.getData(gqlResponse.id, false);
    const workResponse = this.convertGqlNodeToWorkResponse(
      gqlResponse,
      data as string | null
    );
    const profile = await this.#irysApi.getProfile(workResponse.responder_id);
    if (!profile) {
      throw new Error(
        `Responder ${workResponse.responder_id} for work response cannot be found`
      );
    }
    return convertModelsToWorkResponseWithAuthor(workResponse, profile);
  }

  async convertGqlResponseToWorkResponse(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkResponseModel | null> {
    if (!searchResults) {
      return null;
    }
    const edgeLength = searchResults.data.transactions.edges.length;
    let workResponseModel: WorkResponseModelWithProfile[] = new Array(
      edgeLength
    );
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      workResponseModel[i] = await this.convertGqlResponseNodeToWorkResponse(
        edge.node
      );
    }
    return {
      workResponseModels: workResponseModel,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async convertGqlResponseNodeToProfile(gqlResponse: IrysGraphqlResponseNode) {
    const data = await this.#irysCommon.getData(gqlResponse.id, false);
    return this.convertGqlNodeToProfile(
      gqlResponse,
      data as ArrayBuffer | null
    );
  }

  async convertGqlResponseToProfile(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedProfileModel | null> {
    if (!searchResults) {
      return null;
    }
    const edgeLength = searchResults.data.transactions.edges.length;
    let profileModels: ProfileModel[] = new Array(edgeLength);
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      profileModels[i] = await this.convertGqlResponseNodeToProfile(edge.node);
    }
    return {
      profileModels,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async convertGqlResponseToWorkWithAuthor(
    searchResults: IrysGraphqlResponse | null
  ): Promise<PagedWorkWithAuthorModel | null> {
    if (!searchResults) {
      return null;
    }

    const _searchResults = this.removeDeletedRecords(
      searchResults,
      EntityType.Work
    );
    const edgeLength = _searchResults.data.transactions.edges.length;
    let workModels: WorkWithAuthorModel[] = new Array(edgeLength);
    for (let i = 0; i < edgeLength; i++) {
      const edge = _searchResults?.data.transactions.edges[i];
      workModels[i] = await this.convertGqlResponseNodeToWorkWithAuthor(
        edge.node
      );
    }
    return {
      workModels,
      cursor:
        _searchResults.data.transactions.edges[edgeLength - 1]?.cursor || "",
    };
  }

  async convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkWithAuthorModel> {
    const data = await this.#irysCommon.getData(gqlResponse.id, true);
    const workModel = this.convertGqlNodeToWork(gqlResponse, data);
    const likeCount = await this.#irysApi.getWorkLikeCount(workModel.id);
    const profileModel = await this.#irysApi.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
  }

  convertGqlResponseToTopic(
    response: IrysGraphqlResponse | null
  ): TopicModel[] {
    const _response = this.removeDeletedRecords(response, EntityType.Topic);
    const count = _response?.data.transactions.edges.length || 0;

    const topics: TopicModel[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const node = _response?.data.transactions.edges[i].node;
      if (!node) throw new Error("Topic item is null");
      topics[i] = {
        id: node.id,
        updated_at: node.timestamp,
        name:
          node.tags.find((tag) => tag.name === TopicTagNames.TopicName)
            ?.value || "",
      };
    }
    return topics;
  }

  convertGqlResponseToWorkTopic(
    response: IrysGraphqlResponse | null
  ): WorkTopicModel[] {
    const _response = this.removeDeletedRecords(response, EntityType.WorkTopic);
    const count = _response?.data.transactions.edges.length || 0;
    const topics: WorkTopicModel[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const node = _response?.data.transactions.edges[i].node;
      if (!node) throw new Error("Topic item is null");
      topics[i] = {
        id: node.id,
        updated_at: node.timestamp,
        work_id:
          node.tags.find((tag) => tag.name === WorkTopicTagNames.WorkId)
            ?.value || "",
        topic_id:
          node.tags.find((tag) => tag.name === WorkTopicTagNames.TopicId)
            ?.value || "",
      };
    }
    return topics;
  }

  convertGqlResponseToFollow(
    response: IrysGraphqlResponse | null
  ): FollowModel[] {
    const _responses = this.removeDeletedRecords(response, EntityType.Follow);
    const count = _responses.data.transactions.edges.length;
    const follows: FollowModel[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const node = _responses.data.transactions.edges[i].node;
      follows[i] = {
        id: node.id,
        updated_at: node.timestamp,
        follower_id:
          node.tags.find((tag) => tag.name === FollowerTagNames.FollowerId)
            ?.value || "",
        followed_id:
          node.tags.find((tag) => tag.name === FollowerTagNames.FollowedId)
            ?.value || "",
      };
    }
    return follows;
  }

  convertGqlNodeToWorkResponse(
    response: IrysGraphqlResponseNode,
    data: string | null
  ): WorkResponseModel {
    return new WorkResponseModel(
      response.id,
      response.timestamp,
      response.tags.find((tag) => tag.name == WorkResponderTagNames.WorkId)
        ?.value || "",
      response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
      data || "",
      response.tags.find((tag) => tag.name == WorkResponderTagNames.ResponderId)
        ?.value || ""
    );
  }

  convertGqlNodeToProfile(
    response: IrysGraphqlResponseNode,
    data: ArrayBuffer | null
  ): ProfileModel {
    return new ProfileModel(
      response.id,
      response.timestamp,
      response.tags.find((tag) => tag.name == ProfileTagNames.UserName)
        ?.value || "",
      response.tags.find((tag) => tag.name == ProfileTagNames.FullName)
        ?.value || "",
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

  convertGqlNodeToWork(
    response: IrysGraphqlResponseNode,
    data: DataUpload
  ): WorkModel {
    return new WorkModel(
      response.id,
      response.timestamp,
      response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
      (data as string) ? (data as string) : "",
      response.tags.find((tag) => tag.name == WorkTagNames.AuthorId)?.value ||
        "",
      response.tags.find((tag) => tag.name == WorkTagNames.Description)?.value
    );
  }
}
