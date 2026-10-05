import {
  apiErrorResponse,
  type ApiResponseObject,
} from '@nocobase/app-server/router';

/** The tag every AI employee operation is listed under in the API document. */
export const tags: string[] = ['AiEmployee'];

/** The `413` of a route that takes a body, answered before the body is parsed. */
export const bodyTooLargeResponse: ApiResponseObject = apiErrorResponse(
  413,
  'The request body exceeds the route limit (`BODY_TOO_LARGE`).',
);

const STREAM_FRAMES = [
  'The run is answered as server-sent events once the request has been checked. Each frame is one `data:` line holding a JSON object, followed by a blank line:',
  '',
  '```',
  'data: {"sessionId":"…","username":"…","from":"main-agent","type":"content","body":"Hello"}',
  '',
  '```',
  '',
  '`type` is one of `stream_start`, `content` (`body` is a text delta), `reasoning` (`body` is `{ status: "start" | "content" | "stop", content }`), `web_search`, `tool_call_chunks` (`body` is the partial tool calls), `tool_calls` (`body` is `{ toolCalls }`), `tool_call_status` (`body` is the status of one call), `new_message`, `sub_agent_completed` and `stream_end`. `sessionId`, `username`, `from` and `metadata` name the conversation the frame belongs to, which is a sub-agent conversation while an employee delegates.',
  '',
  'The status is `200` once the stream has opened, so a failure after that point is a frame `{ "type": "error", "body": "<message>", "code"?: "<code>" }` followed by the end of the stream. `code` is the agent failure where there is one: `CONFIGURATION_ERROR`, `MODEL_RESPONSE_ERROR`, `GRAPH_RECURSION_ERROR`, `EMPTY_RESPONSE`, `PROVIDER_ERROR`, `PERSISTENCE_ERROR` or `ABORTED`. Everything the request itself gets wrong is answered before the stream opens, in the standard error body.',
].join('\n');

/** The `200` of a run: a `text/event-stream` whose frame format the description spells out. */
export function runStreamResponse(extra?: string): ApiResponseObject {
  return {
    description: extra ? `${STREAM_FRAMES}\n\n${extra}` : STREAM_FRAMES,
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          description: 'Server-sent events, one JSON object per `data:` line.',
        },
      },
    },
  };
}
