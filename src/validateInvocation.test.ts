import {
  createMockExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { integrationConfig } from '../test/config';
import { setupProjectRecording } from '../test/recording';
import { IntegrationConfig, validateInvocation } from './config';

describe('#validateInvocation', () => {
  let recording: Recording;

  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('requires valid config', async () => {
    const executionContext = createMockExecutionContext<IntegrationConfig>({
      instanceConfig: {} as IntegrationConfig,
    });

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      'Config requires all of {userId, apiKey, hostname}',
    );
  });

  /**
   * Testing a successful authorization can be done with recordings
   */
  test.skip('successfully validates invocation', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'validate-invocation',
    });

    // Pass integrationConfig to authenticate with real credentials
    const executionContext = createMockExecutionContext({
      instanceConfig: integrationConfig,
    });

    // successful validateInvocation doesn't throw errors and will be undefined
    await expect(validateInvocation(executionContext)).resolves.toBeUndefined();
  });

  /* Adding `describe` blocks segments the tests into logical sections
   * and makes the output of `yarn test --verbose` provide meaningful
   * to project information to future maintainers.
   */
  describe('fails validating invocation', () => {
    /**
     * Testing failing authorizations can be done with recordings as well.
     * For each possible failure case, a test can be made to ensure that
     * error messaging is expected and clear to end-users
     */
    describe('invalid user credentials', () => {
      test('should throw if hostname is invalid', () => {
        recording = setupProjectRecording({
          directory: __dirname,
          name: 'client-id-auth-error',
          // Many authorization failures will return non-200 responses
          // and `recordFailedRequest: true` is needed to capture these responses
          options: {
            recordFailedRequests: true,
            matchRequestsBy: {
              url: {
                hostname: false,
              },
            },
          },
        });

        // tests validate that invalid configurations throw an error
        // with an appropriate and expected message.
        const regEx =
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\/cjoc/g;
        expect(integrationConfig.hostname).not.toMatch(regEx);
      });

      test.skip('should throw if userId is invalid', async () => {
        recording = setupProjectRecording({
          directory: __dirname,
          name: 'user-id-auth-error',
          // Many authorization failures will return non-200 responses
          // and `recordFailedRequest: true` is needed to capture these responses
          options: {
            recordFailedRequests: true,
            matchRequestsBy: {
              url: {
                hostname: false,
              },
            },
          },
        });

        const executionContext = createMockExecutionContext({
          instanceConfig: {
            userId: 'INVALID',
            apiKey: integrationConfig.apiKey,
            hostname: integrationConfig.hostname,
          },
        });

        expect.assertions(1);
        await validateInvocation(executionContext).catch((err) =>
          expect(err.status).toBe(401),
        );
      });

      test.skip('should throw if apiKey is invalid', async () => {
        recording = setupProjectRecording({
          directory: __dirname,
          name: 'api-key-auth-error',
          options: {
            recordFailedRequests: true,
            matchRequestsBy: {
              url: {
                hostname: false,
              },
            },
          },
        });

        const executionContext = createMockExecutionContext({
          instanceConfig: {
            userId: integrationConfig.userId,
            apiKey: 'INVALID',
            hostname: integrationConfig.hostname,
          },
        });

        expect.assertions(1);
        await validateInvocation(executionContext).catch((err) =>
          expect(err.status).toBe(401),
        );
      });
    });
  });
});
