import {
  resolver,
  type ApiDocumentTransform,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import type { z } from 'zod';

/** Describe the Demo-only storage policy on the existing Users operations, without adding shadow routes. */
export function describeDemoPreferences(
  keys: readonly string[],
  valueSchema: z.ZodString,
): ApiDocumentTransform {
  return async (document) => {
    const prefix = '/api/users/me/preferences';
    const collection = document.paths?.[prefix];
    const item = document.paths?.[`${prefix}/{key}`];
    const policy = `In Demo Mode, ${keys.map((key) => `\`${key}\``).join(', ')} use application-scoped browser-session cookies instead of account storage. Send the returned cookies on subsequent requests, including after switching accounts. Missing or deleted choices return the site's defaults; historical account values are ignored. Other keys retain account storage and the demo write guard. This applies to clients of this API; controls using only localStorage are unaffected.`;
    const validation =
      'For those three keys, the value must be a non-empty string of at most 100 ASCII letters, digits, dots, underscores or dashes; invalid values return 400 INVALID_PREFERENCE_VALUE. Other keys accept JSON under the existing Users limits.';
    for (const [operation, description] of [
      [collection?.get, policy],
      [item?.put, `${policy} ${validation}`],
      [item?.delete, policy],
    ] as const) {
      if (operation)
        operation.description =
          `${operation.description ?? ''} ${description}`.trim();
    }
    if (collection?.patch)
      collection.patch.description = `Updates the supplied keys and returns every preference. ${policy} ${validation} Account-backed keys are written in one transaction. A rejected batch issues no preference cookies.`;

    const { schema } = await resolver(valueSchema, 'input').toOpenAPISchema();
    const properties = Object.fromEntries(keys.map((key) => [key, schema]));
    const body = collection?.patch?.requestBody;
    if (body && !('$ref' in body)) {
      const json: OpenAPIV3_1.MediaTypeObject | undefined =
        body.content['application/json'];
      if (json?.schema)
        json.schema = { allOf: [json.schema, { type: 'object', properties }] };
    }
    const input = item?.put?.requestBody;
    if (input && !('$ref' in input)) input.description = validation;
    // The value restriction depends on the path parameter, which OpenAPI cannot express as a body-only schema.
    for (const parameter of item?.put?.parameters ?? []) {
      if (
        !('$ref' in parameter) &&
        parameter.in === 'path' &&
        parameter.name === 'key'
      )
        parameter.description =
          `${parameter.description ?? ''} ${validation}`.trim();
    }
    for (const [operation, status] of [
      [collection?.patch, '200'],
      [item?.put, '200'],
      [item?.delete, '204'],
    ] as const) {
      const response = operation?.responses?.[status];
      if (!response || '$ref' in response) continue;
      response.headers = {
        ...response.headers,
        'Set-Cookie': {
          description:
            'One session cookie per changed presentation key; deletion expires that key. No preference cookie is issued for other keys or a failed request.',
          schema: { type: 'string' },
        },
      };
    }
    for (const operation of [collection?.get, collection?.patch]) {
      const response = operation?.responses?.['200'];
      if (!response || '$ref' in response) continue;
      const json: OpenAPIV3_1.MediaTypeObject | undefined =
        response.content?.['application/json'];
      const choices: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties,
        required: [...keys],
      };
      if (json?.schema)
        json.schema = {
          allOf: [
            json.schema,
            { type: 'object', properties: { data: choices } },
          ],
        };
    }
  };
}
