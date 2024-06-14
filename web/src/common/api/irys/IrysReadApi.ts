import { PAGE_SIZE } from "../../utils/StandardValues";
import { ICommonApi } from "../interfaces/ICommonApi";
import { IReadApi } from "../interfaces/IReadApi";
import { DESC, SEARCH_TX } from "./IrysCommon";
import {
  AppTagNames,
  BaseQueryTags,
  EntityType,
  TopicModel,
} from "./models/ApiModels";
import Query from "@irys/query";

export class IrysReadApi implements IReadApi {
  #irysCommon: ICommonApi;

  constructor(common: ICommonApi) {
    this.#irysCommon = common;
  }

  #irysQuery?: Query;
  get #IrysQuery() {
    if (!this.#irysQuery) {
      this.#irysQuery = new Query({ network: this.#irysCommon.Network });
    }
    return this.#irysQuery;
  }

  async getAllTopics(): Promise<TopicModel[]> {
    const response = await this.#IrysQuery
      .search(SEARCH_TX)
      .tags([
        ...BaseQueryTags,
        { name: AppTagNames.EntityType, values: [EntityType.Topic] },
      ])
      .sort(DESC)
      .limit(PAGE_SIZE);

    return this.#irysCommon.convertQueryToTopics(response) || [];
  }
}
