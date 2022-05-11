import fetch, { Response } from 'node-fetch';
import {
  IntegrationProviderAPIError,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './config';
import {
  CloudbeesGroup,
  CloudbeesGroupResponse,
  CloudbeesRole,
  CloudbeesRoleResponse,
  CloudbeesUser,
  CloudbeesUserResponse,
} from './types';
import { retry } from '@lifeomic/attempt';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: IntegrationConfig) {}

  private checkStatus = (response: Response) => {
    if (response.ok) {
      return response;
    } else {
      throw new IntegrationProviderAPIError(response);
    }
  };

  private withBaseUri = (path: string): string =>
    `${this.config.hostname}${path}`;

  private async request<T>(uri: string): Promise<T> {
    try {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.config.userId}:${this.config.apiKey}`,
          ).toString('base64')}`,
        },
      };

      // Handle rate-limiting
      const response = await retry(
        async () => {
          const res: Response = await fetch(uri, options);
          this.checkStatus(res);
          return res;
        },
        {
          delay: 5000,
          maxAttempts: 10,
          handleError: (err, context) => {
            if (
              err.statusCode !== 429 ||
              (err.statusCode >= 500 &&
                err.statusCode < 600 &&
                context.attemptNum > 1)
            )
              context.abort();
          },
        },
      );

      return response.json();
    } catch (err) {
      throw new IntegrationProviderAPIError({
        endpoint: uri,
        status: err.status || err.type,
        statusText: err.statusText || err.code,
      });
    }
  }

  public async verifyAuthentication(): Promise<void> {
    const uri = this.withBaseUri('/casc-bundle/list');
    try {
      await this.request(uri);
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: uri,
        status: err.status,
        statusText: err.statusText,
      });
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<CloudbeesUser>,
  ): Promise<void> {
    const response = await this.request<CloudbeesUserResponse>(
      this.withBaseUri(`/asynchPeople/api/json/?depth=2`),
    );

    for (const user of response.users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<CloudbeesGroup>,
  ): Promise<void> {
    const response = await this.request<CloudbeesGroupResponse>(
      this.withBaseUri(`/groups/api/json/?depth=2`),
    );

    for (const group of response.groups) {
      await iteratee(group);
    }
  }

  /**
   * Iterates each role resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRoles(
    iteratee: ResourceIteratee<CloudbeesRole>,
  ): Promise<void> {
    const response = await this.request<CloudbeesRoleResponse>(
      this.withBaseUri(`/roles/api/json/?depth=1`),
    );

    for (const role of response.roles) {
      await iteratee(role);
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
