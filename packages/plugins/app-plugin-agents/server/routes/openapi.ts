/**
 * What the plugin's routes share in the API document: the tag, the credentials that are not a session or an API key
 * (a run token, a runner key, a registration token, a download token) as security schemes, and the requirements built from them.
 */
import { HEADERS } from '@nocobase/agent-protocol';
import {
  apiErrorResponse,
  resolver,
  type ApiDocumentFragment,
  type ApiResponseObject,
  type DescribeRouteOptions,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import type { z } from 'zod';

/** The tag every agents operation is listed under. */
export const tags: string[] = ['Agents'];

/** Security scheme names, in `components.securitySchemes`. */
export const SECURITY_SCHEMES = {
  runToken: 'runToken',
  runnerKey: 'runnerKey',
  registrationToken: 'registrationToken',
  downloadToken: 'downloadToken',
} as const;

/** The schemes, with the headers they travel in, merged into the document by the plugin's provider. */
export function agentsSecurityFragment(): ApiDocumentFragment {
  return {
    owner: '@nocobase/app-plugin-agents',
    namespace: 'agents',
    components: {
      securitySchemes: {
        [SECURITY_SCHEMES.runToken]: {
          type: 'apiKey',
          in: 'header',
          name: HEADERS.runToken,
          description:
            "A run's token, which the runner hands the agent's CLI for the run. It acts as the person who woke the agent, within the agent's business actions, and works only while a runner holds the run.",
        },
        [SECURITY_SCHEMES.runnerKey]: {
          type: 'apiKey',
          in: 'header',
          name: HEADERS.runnerKey,
          description:
            "A runner's key, issued when it registered. Runner protocol requests also send their protocol version in `x-nocobase-protocol`.",
        },
        [SECURITY_SCHEMES.registrationToken]: {
          type: 'apiKey',
          in: 'header',
          name: HEADERS.registrationToken,
          description:
            'An unused one-time registration token from "Add runtime", so the install script can download the runner before it registers with the token.',
        },
        [SECURITY_SCHEMES.downloadToken]: {
          type: 'apiKey',
          in: 'header',
          name: HEADERS.downloadToken,
          description:
            'A short-lived download token a signed-in person created (`POST /api/agents/dist/downloadTokens`), so the install script can download the CLI on a machine where nobody is signed in yet: the CLI alone, for the platform of its first request, a few times within 30 minutes.',
        },
      },
    },
  };
}

/** Only a run token. */
export const runTokenSecurity: OpenAPIV3_1.SecurityRequirementObject[] = [
  { [SECURITY_SCHEMES.runToken]: [] },
];

/** Only a runner key. */
export const runnerKeySecurity: OpenAPIV3_1.SecurityRequirementObject[] = [
  { [SECURITY_SCHEMES.runnerKey]: [] },
];

/** A person (session or API key), or a run token. */
export const personOrRunSecurity: OpenAPIV3_1.SecurityRequirementObject[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { [SECURITY_SCHEMES.runToken]: [] },
];

/** A runner key, a registration token, a download token, or a person (session or API key). */
export const downloadSecurity: OpenAPIV3_1.SecurityRequirementObject[] = [
  { [SECURITY_SCHEMES.runnerKey]: [] },
  { [SECURITY_SCHEMES.registrationToken]: [] },
  { [SECURITY_SCHEMES.downloadToken]: [] },
  { cookieAuth: [] },
  { apiKeyAuth: [] },
];

/** The protocol version header a runner sends with every request. */
export const protocolHeader: OpenAPIV3_1.ParameterObject = {
  in: 'header',
  name: HEADERS.protocol,
  required: false,
  schema: { type: 'integer' },
  description:
    'The runner protocol version the runner speaks. A runner whose protocol this application does not serve is kept connected but given no work, and its run and job reports are refused with `PROTOCOL_UNSUPPORTED`.',
};

/** The errors of a request authenticated by a runner key. */
export const runnerKeyErrors: Readonly<Record<string, ApiResponseObject>> = {
  401: apiErrorResponse(
    401,
    'No runner key, or one that is unknown or revoked, or whose owner is disabled (`RUNNER_KEY_INVALID`, `RUNNER_REVOKED`, `RUNNER_OWNER_DISABLED`).',
  ),
  500: apiErrorResponse(500),
};

/** The errors of a report on a run or a job the runner holds. */
export const heldWorkErrors: Readonly<Record<string, ApiResponseObject>> = {
  ...runnerKeyErrors,
  400: apiErrorResponse(
    400,
    'The work has ended (`RUN_NOT_ACTIVE`), or the runner speaks a protocol this application does not serve (`PROTOCOL_UNSUPPORTED`).',
  ),
  403: apiErrorResponse(
    403,
    'Another runner holds the work (`RUN_NOT_OWNED`).',
  ),
  404: apiErrorResponse(404),
  409: apiErrorResponse(
    409,
    'The lease was lost: the work moved on, and the runner must stop it (`LEASE_LOST`).',
  ),
};

/** A JSON request body documented without being validated by the route itself, which reads it in the handler. */
export function jsonRequestBody(
  schema: z.ZodType,
): NonNullable<DescribeRouteOptions['requestBody']> {
  return {
    required: false,
    content: { 'application/json': { schema: resolver(schema, 'input') } },
  };
}
