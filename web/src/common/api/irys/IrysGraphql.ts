import { IRYS_GRAPHQL_URL } from "../../Env";
import { IApi } from "../interfaces/IApi";
import { IGraphql } from "../interfaces/IGraphql";
import { IUploadData } from "../interfaces/IUploadData";
import {
  convertModelsToWorkResponseWithAuthor,
  convertModelsToWorkWithAuthor,
} from "./models/ApiModelConverters";
import {
  ActionTagName,
  ActionTagType,
  DataUpload,
  EntityType,
  IrysGraphqlEdge,
  IrysGraphqlResponse,
  IrysGraphqlResponseNode,
  IrysGraphqlVariables,
  PagedProfileModel,
  PagedWorkResponseModel,
  PagedWorkWithAuthorModel,
  ProfileModel,
  ProfileTagNames,
  Tag,
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
  #uploadData: IUploadData;
  #irysApi: IApi;

  constructor(uploaddata: IUploadData, irysApi: IApi) {
    this.#uploadData = uploaddata;
    this.#irysApi = irysApi;
  }

  async queryGraphQL(
    variables: IrysGraphqlVariables
  ): Promise<IrysGraphqlResponse | null> {
    const query = this.#buildQuery(variables.limit, variables.cursor);
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

  #buildQuery(limit?: number, cursor?: string) {
    let outerVariable = "$tags: [TagFilter!]!";
    let innerVariable = `
      tags: $tags      
      order: DESC 
    `;
    if (limit) {
      outerVariable = "$tags: [TagFilter!]!, $limit: Int!";
      innerVariable = `
        tags: $tags
        limit: $limit
        order: DESC
      `;
    }
    if (cursor) {
      outerVariable = "$tags: [TagFilter!]!, $limit: Int!, $cursor: String!";
      innerVariable = `
        tags: $tags
        limit: $limit
        order: DESC
        after: $cursor
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

  async convertGqlResponseNodeToWorkResponse(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkResponseModelWithProfile> {
    const data = await this.#uploadData.getData(gqlResponse.id, false);
    const workResponse = this.convertGqlQueryToWorkResponse(
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
    const data = await this.#uploadData.getData(gqlResponse.id, false);
    return this.convertGqlQueryToProfile(
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
    const edgeLength = searchResults.data.transactions.edges.length;
    let workModels: WorkWithAuthorModel[] = new Array(edgeLength);
    for (let i = 0; i < edgeLength; i++) {
      const edge = searchResults?.data.transactions.edges[i];
      workModels[i] = await this.convertGqlResponseNodeToWorkWithAuthor(
        edge.node
      );
    }
    return {
      workModels,
      cursor:
        searchResults.data.transactions.edges[edgeLength - 1].cursor || "",
    };
  }

  async convertGqlResponseNodeToWorkWithAuthor(
    gqlResponse: IrysGraphqlResponseNode
  ): Promise<WorkWithAuthorModel> {
    const data = await this.#uploadData.getData(gqlResponse.id, true);
    const workModel = this.convertGqlQueryToWork(gqlResponse, data);
    const likeCount = await this.#irysApi.getWorkLikeCount(workModel.id);
    const profileModel = await this.#irysApi.getProfile(workModel.author_id);

    if (!profileModel) {
      throw new Error(`Profile with id ${workModel.author_id} not found!`);
    }
    return convertModelsToWorkWithAuthor(workModel, profileModel, likeCount);
  }

  /// Assumed sort by last inserted record first (i.e. timestamp),
  /// as its possible after a remove a new insert is then done
  #getNonRemovedEdges(entityType: EntityType, sourceEdges: IrysGraphqlEdge[]) {
    const nonRemovedEdges: IrysGraphqlEdge[] = [];

    // see if each edge is already in final list and add it if not
    for (let i = 0; i < sourceEdges.length; i++) {
      const currentEdge = sourceEdges[i];

      if (
        !this.#containsMatchingEdge(currentEdge, nonRemovedEdges, entityType)
      ) {
        nonRemovedEdges.push(currentEdge);
      }
    }

    // after getting list of unique records remove the nodes tagged Remove
    return nonRemovedEdges.filter(
      (edge) =>
        !edge.node.tags.find(
          (tag) =>
            tag.name === ActionTagName && tag.value === ActionTagType.Remove
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
            this.#checkEqualityByEntityType(entityType, checkTag, searchEdgeTag)
          ) {
            currentTagMatches = true;
            break;
          }
        }
        if (currentTagMatches) {
          matchCount += 1;
        }
      }
      if (checkTags.length !== matchCount) {
        return true;
      }
    }
    return false;
  }

  #checkEqualityByEntityType(
    entityType: EntityType,
    checkTag: Tag,
    searchTag: Tag
  ) {
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
    }
    return false;
  }

  #removeDeletedRecords(
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

  convertGqlQueryToWorkResponse(
    response: IrysGraphqlResponseNode,
    data: string | null
  ): WorkResponseModel {
    return new WorkResponseModel(
      response.id,
      response.timestamp,
      response.tags.find((tag) => tag.name == WorkTagNames.WorkId)?.value || "",
      response.tags.find((tag) => tag.name == WorkTagNames.Title)?.value || "",
      data || "",
      response.tags.find((tag) => tag.name == WorkResponderTagNames.ResponderId)
        ?.value || ""
    );
  }

  convertGqlQueryToProfile(
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

  convertGqlQueryToWork(
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

  convertGqlQueryToTopic(response: IrysGraphqlResponse | null): TopicModel[] {
    const count = response?.data.transactions.edges.length || 0;

    const topics: TopicModel[] = new Array(count);
    for (let i = 0; i < count; i++) {
      const node = response?.data.transactions.edges[i].node;
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

  convertGqlQueryToWorkTopic(
    response: IrysGraphqlResponse | null,
    entityType: EntityType
  ): WorkTopicModel[] {
    const _response = this.#removeDeletedRecords(response, entityType);
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
}
