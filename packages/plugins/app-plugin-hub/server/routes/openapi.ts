import {
  apiErrorResponse,
  apiErrorResponses,
  type ApiResponseObject,
} from '@nocobase/app-server/router';

/** The tag every Hub operation is listed under in the API document. */
export const tags: string[] = ['Hub'];

/** What the description of a route says about publishing keys, by what the route accepts. */
export function publishingKeyNote(
  scope: 'upload-release' | 'deploy' | 'any',
): string {
  return scope === 'any'
    ? 'A Hub publishing key bound to the App may call this as well, as `Authorization: Bearer hub_app_…`, with either scope.'
    : `A Hub publishing key bound to the App may call this as well, as \`Authorization: Bearer hub_app_…\`, with the \`${scope}\` scope.`;
}

/**
 * The errors every Hub route can answer, with the Hub's own reasons for `401` and `403`: a publishing key the Hub does
 * not accept, or one sent to a route that takes none. Every Hub route refuses a publishing key it does not take, so
 * each can answer `403`.
 */
export const hubErrorResponses: Readonly<
  Record<'401' | '403' | '500', ApiResponseObject>
> = Object.freeze({
  ...apiErrorResponses,
  '401': apiErrorResponse(
    401,
    'No session (`UNAUTHENTICATED`), or a publishing key that is unknown, disabled, expired or not bound to the App (`INVALID_API_KEY`).',
  ),
  '403': apiErrorResponse(
    403,
    'The caller lacks the Hub permission (`PERMISSION_DENIED`), or a publishing key was sent to a route that takes none (`API_KEY_FORBIDDEN`).',
  ),
});

/** The `404` of a route on one App. */
export const appNotFoundResponse: ApiResponseObject = apiErrorResponse(
  404,
  'No App has this ID (`APP_NOT_FOUND`).',
);
