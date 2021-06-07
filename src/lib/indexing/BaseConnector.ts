import { gql } from "@apollo/client/core";
import { DocumentNode } from "graphql";
import { IndexingService } from "../../services/indexing/IndexingService";

export interface Connector<ResponseT, ParamsT> {
  request(
    indexingService: IndexingService,
    vars?: ParamsT
  ): Promise<{ data: ResponseT } | ResponseT>;
}

export abstract class BaseConnector<ResponseT, ParamsT>
  implements Connector<ResponseT, ParamsT> {
  abstract query: DocumentNode;

  async request(indexingService: IndexingService, variables?: ParamsT) {
    return await indexingService.genericRequest(this.query, variables || {});
  }

  fragments = {
    taskStartResponse: gql`
      fragment TaskStartResponseFields on TaskStartResponse {
        taskName
        token
        success
      }
    `,
  } as const;
}

export class EmptyConnector extends BaseConnector<never, any> {
  query = gql`
    query {
      ping
    }
  `;
}
