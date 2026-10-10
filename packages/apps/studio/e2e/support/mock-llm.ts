/**
 * A local OpenAI-compatible model for the browser tests and for trying Online mode by hand, so no real model or key is
 * ever used: `GET /v1/models` and `POST /v1/chat/completions` (streamed, with tool calls and usage). Studio reaches it as
 * a model service of the `openai-compatible` provider whose base URL is this server's `/v1`.
 *
 * It answers by a few fixed rules on the request, so a conversation goes the way a person trying Studio expects:
 *
 * It works the way an online agent does, through `nb-studio` in its `bash` tool.
 *
 * - Briefed to hand intake drafts back (intake with AI), it turns the requirement material's lines into drafts and
 *   hands them back with `nb-studio intake drafts`, then says so.
 * - Asked to organize requirements into an operation plan (the New issue dialog's "Let an agent organize"), it turns
 *   the requirement lines into issue rows, the first the parent of the rest, and proposes them with
 *   `nb-studio plan create`, then says so.
 * - A question about knowledge (知识, 文档, 流程, 规范, knowledge, document, process) searches the knowledge base, reads
 *   the first document found and answers from it with a link to its page.
 * - A question about issues (任务, 议题, issue) searches the issues and lists what it found.
 * - Anything else gets a short greeting.
 *
 * Text streams a few characters at a time, so the reply visibly grows in the chat panel.
 *
 * It also embeds (`POST /v1/embeddings`, model `mock-embedding`) and reranks (`POST /v1/rerank`, model `mock-rerank`)
 * deterministically: a text's vector is its words and character bigrams hashed into `EMBEDDING_DIMENSIONS` buckets and
 * normalized, so texts that share words score close, and a rerank orders documents by that similarity.
 *
 * Run it on its own with
 * `node e2e/support/mock-llm.ts [--port <port>] [--delay <ms between pieces, 60>]`; it prints its base URL.
 */
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** The model id the mock offers. */
export const MOCK_MODEL = 'mock-model';
/** The embedding model id the mock offers. */
export const MOCK_EMBEDDING_MODEL = 'mock-embedding';
/** The rerank model id the mock offers. */
export const MOCK_RERANK_MODEL = 'mock-rerank';
/** The size of an embedding unless the request asks for `dimensions`. */
export const EMBEDDING_DIMENSIONS = 256;

/** The words (Latin runs) and character bigrams (of every letter run, CJK included) a text is embedded from. */
function featuresOf(text: string): string[] {
  const runs = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const features: string[] = [];
  for (const run of runs) {
    const characters = [...run];
    if (/^[\p{Script=Latin}\p{N}]+$/u.test(run)) features.push(`w:${run}`);
    if (characters.length === 1) features.push(`c:${run}`);
    for (let at = 0; at + 1 < characters.length; at += 1)
      features.push(`b:${characters[at]}${characters[at + 1]}`);
  }
  return features;
}

/** FNV-1a, 32 bits. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (const character of text) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/** A text's deterministic, normalized vector of `dimensions` numbers. */
export function embed(
  text: string,
  dimensions: number = EMBEDDING_DIMENSIONS,
): number[] {
  const vector: number[] = Array.from({ length: dimensions }, () => 0);
  for (const feature of featuresOf(text)) {
    const value = hash(feature);
    const at = value % dimensions;
    vector[at] = (vector[at] ?? 0) + (value >>> 31 === 1 ? -1 : 1);
  }
  const norm = Math.hypot(...vector);
  if (norm === 0) {
    vector[hash(text) % dimensions] = 1;
    return vector;
  }
  return vector.map((value) => value / norm);
}

/** Two normalized vectors' cosine similarity. */
export function similarity(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let at = 0; at < Math.min(a.length, b.length); at += 1)
    sum += (a[at] ?? 0) * (b[at] ?? 0);
  return sum;
}

const tokensOf = (text: string) => Math.max(1, Math.ceil(text.length / 2));

/** `POST /v1/embeddings`'s answer to an OpenAI-shaped request. */
export function embeddings(request: {
  readonly model?: string;
  readonly input?: unknown;
  readonly dimensions?: unknown;
}): Record<string, unknown> {
  const inputs = (
    Array.isArray(request.input) ? request.input : [request.input ?? '']
  ).map((input) => (typeof input === 'string' ? input : String(input)));
  const dimensions =
    typeof request.dimensions === 'number' &&
    Number.isInteger(request.dimensions) &&
    request.dimensions > 0
      ? request.dimensions
      : EMBEDDING_DIMENSIONS;
  const tokens = inputs.reduce((sum, input) => sum + tokensOf(input), 0);
  return {
    object: 'list',
    model: request.model ?? MOCK_EMBEDDING_MODEL,
    data: inputs.map((input, index) => ({
      object: 'embedding',
      index,
      embedding: embed(input, dimensions),
    })),
    usage: { prompt_tokens: tokens, total_tokens: tokens },
  };
}

/** `POST /v1/rerank`'s answer to a Cohere-shaped request: documents by similarity to the query, best first. */
export function reranked(request: {
  readonly model?: string;
  readonly query?: unknown;
  readonly documents?: unknown;
  readonly top_n?: unknown;
}): Record<string, unknown> {
  const query = typeof request.query === 'string' ? request.query : '';
  const documents = (
    Array.isArray(request.documents) ? request.documents : []
  ).map((document) =>
    typeof document === 'string' ? document : JSON.stringify(document),
  );
  const target = embed(query);
  const results = documents
    .map((document, index) => ({
      index,
      relevance_score: Number(
        ((similarity(target, embed(document)) + 1) / 2).toFixed(6),
      ),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score || a.index - b.index);
  const top =
    typeof request.top_n === 'number' && request.top_n > 0
      ? results.slice(0, request.top_n)
      : results;
  const tokens =
    tokensOf(query) +
    documents.reduce((sum, document) => sum + tokensOf(document), 0);
  return {
    model: request.model ?? MOCK_RERANK_MODEL,
    results: top,
    usage: { total_tokens: tokens },
  };
}

interface ToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: { readonly name: string; readonly arguments: string };
}

interface Message {
  readonly role: string;
  readonly content?: unknown;
  readonly tool_calls?: readonly ToolCall[];
  readonly tool_call_id?: string;
}

interface CompletionRequest {
  readonly model?: string;
  readonly stream?: boolean;
  readonly messages?: readonly Message[];
  readonly tools?: readonly {
    readonly function?: { readonly name?: string };
  }[];
}

type Answer =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'call'; readonly name: string; readonly args: unknown };

const textOf = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content))
    return content
      .map((part) =>
        typeof part === 'object' && part !== null && 'text' in part
          ? String((part as { text: unknown }).text)
          : '',
      )
      .join('');
  return '';
};

function parse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The shell command a tool message answers, from the assistant message that called it. */
function commandOf(messages: readonly Message[], message: Message): string {
  for (const earlier of [...messages].reverse())
    for (const call of earlier.tool_calls ?? [])
      if (call.id === message.tool_call_id) {
        const args = parse(call.function.arguments);
        return isRecord(args) && typeof args.command === 'string'
          ? args.command
          : '';
      }
  return '';
}

/** What the conversation searched the knowledge base for (`nb-studio kb search`'s words), or ''. */
function searchedFor(messages: readonly Message[]): string {
  for (const message of [...messages].reverse())
    for (const call of message.tool_calls ?? []) {
      const args = parse(call.function.arguments);
      const found =
        isRecord(args) && typeof args.command === 'string'
          ? /^nb-studio kb search '([^']*)'/u.exec(args.command)
          : null;
      if (found) return found[1] ?? '';
    }
  return '';
}

/** A shell answer's JSON document (`exit code N`, then what `--json` printed). */
function envelopeOf(text: string): Record<string, unknown> | null {
  const json = parse(text.slice(text.indexOf('\n') + 1));
  return isRecord(json) ? json : null;
}

const quote = (text: string): string => `'${text.replaceAll("'", "'\\''")}'`;

/** The requirement lines of an intake brief's material (`<text>…</text>`), as drafts. */
function draftsOf(messages: readonly Message[]): unknown[] {
  const all = messages.map((message) => textOf(message.content)).join('\n');
  const material = /<text>\n?([\s\S]*?)\n?<\/text>/u.exec(all)?.[1] ?? '';
  const lines = material
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*#]+|\d+[.)])\s*/u, '').trim())
    .filter(Boolean)
    .slice(0, 8);
  const [first = '新的需求', ...rest] = lines;
  return [
    { position: 1, parentPosition: null, title: first.slice(0, 120) },
    ...rest.map((title, index) => ({
      position: index + 2,
      parentPosition: 1,
      title: title.slice(0, 120),
    })),
  ];
}

/** The requirement lines of an intake request's fenced `Requirements:` block, as plan rows. */
function planRowsOf(text: string): unknown[] {
  const material =
    /Requirements:\n(`{3,})\n([\s\S]*?)\n\1/u.exec(text)?.[2] ?? '';
  const lines = material
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*#]+|\d+[.)])\s*/u, '').trim())
    .filter(Boolean)
    .slice(0, 8);
  const [first = '新的需求', ...rest] = lines;
  return [
    {
      op: 'issue.create',
      ref: 'parent',
      params: { title: first.slice(0, 120) },
    },
    ...rest.map((title) => ({
      op: 'issue.create',
      params: { title: title.slice(0, 120), parentIssueId: { ref: 'parent' } },
    })),
  ];
}

const KNOWLEDGE = /知识|文档|流程|规范|knowledge|document|process/iu;
const ISSUES = /任务|议题|\bissues?\b/iu;
/** Words a knowledge question is searched by, the first one the question contains (case-insensitively). */
const KNOWLEDGE_WORDS = [
  '发布',
  '评审',
  '提交',
  '前端',
  '组件',
  '规范',
  '流程',
  'release',
  'review',
  'commit',
  'frontend',
  'component',
];

/** What to answer, by the fixed rules above. */
export function decide(request: CompletionRequest): Answer {
  const messages = request.messages ?? [];
  const tools = new Set(
    (request.tools ?? []).map((tool) => tool.function?.name ?? ''),
  );
  const last = messages.at(-1);
  if (!last) return { kind: 'text', text: '你好。' };
  const run = (command: string): Answer => ({
    kind: 'call',
    name: 'bash',
    args: { command },
  });
  if (last.role === 'tool') {
    const command = commandOf(messages, last);
    const result = envelopeOf(textOf(last.content));
    const data = isRecord(result?.result) ? result.result.data : undefined;
    if (result && isRecord(result.error))
      return {
        kind: 'text',
        text: `这一步没有成功：${String(result.error.message ?? '')}`,
      };
    if (command.includes('nb-studio intake drafts'))
      return {
        kind: 'text',
        text: '草稿已交给你审阅，确认后即可创建任务。',
      };
    if (command.includes('nb-studio plan create'))
      return { kind: 'text', text: '计划已提交，请确认后执行。' };
    if (command.startsWith('nb-studio kb search')) {
      const hits = Array.isArray(data) ? data.filter(isRecord) : [];
      const slug = hits[0]?.slug;
      if (typeof slug === 'string')
        return run(`nb-studio kb read ${quote(slug)} --json`);
      return { kind: 'text', text: '知识库里没有找到相关的文档。' };
    }
    if (command.startsWith('nb-studio kb read') && isRecord(data)) {
      const title = typeof data.title === 'string' ? data.title : '文档';
      const url = typeof data.url === 'string' ? data.url : '';
      const content = typeof data.content === 'string' ? data.content : '';
      const asked = searchedFor(messages);
      const lines = content
        .split('\n')
        .map((part) => part.replace(/^[#>*\-\s]+/u, '').trim())
        .filter((part) => part.length > 0 && part !== title);
      // The line that answers what was searched for, else the first one.
      const line =
        lines.find(
          (part) =>
            asked !== '' &&
            part.includes(asked) &&
            part.length > asked.length + 4,
        ) ??
        lines[0] ??
        '';
      return {
        kind: 'text',
        text: `根据知识库文档 [${title}](${url})：${line}`,
      };
    }
    if (command.startsWith('nb-studio issue search')) {
      const rows = Array.isArray(data) ? data.filter(isRecord) : [];
      return {
        kind: 'text',
        text:
          rows.length === 0
            ? '没有找到相关的任务。'
            : [
                `找到 ${rows.length} 个任务：`,
                ...rows
                  .slice(0, 5)
                  .map(
                    (row) =>
                      `- ${String(row.identifier ?? '')} ${String(row.title ?? '')}`,
                  ),
              ].join('\n'),
      };
    }
    return { kind: 'text', text: '好的，已经完成。' };
  }
  if (!tools.has('bash'))
    return {
      kind: 'text',
      text: '你好！我是项目助理，可以帮你查询项目、任务和知识库。',
    };
  const system = textOf(messages[0]?.content);
  if (system.includes('nb-studio intake drafts --file'))
    return run(
      `cat > /tmp/drafts.json <<'EOF'\n${JSON.stringify({ drafts: draftsOf(messages) })}\nEOF\nnb-studio intake drafts --file /tmp/drafts.json --json`,
    );
  const question = textOf(last.content);
  if (question.includes('propose it to me with `plan create --file`'))
    return run(
      `cat > /tmp/plan.json <<'EOF'\n${JSON.stringify({ title: '整理需求', rows: planRowsOf(question) })}\nEOF\nnb-studio plan create --file /tmp/plan.json --json`,
    );
  if (KNOWLEDGE.test(question))
    return run(
      `nb-studio kb search ${quote(KNOWLEDGE_WORDS.find((word) => question.toLowerCase().includes(word)) ?? '规范')} --json`,
    );
  if (ISSUES.test(question))
    return run('nb-studio issue search --limit 5 --json');
  return {
    kind: 'text',
    text: '你好！我是项目助理，可以帮你查询项目、任务和知识库。',
  };
}

function chunk(
  model: string,
  delta: Record<string, unknown>,
  finish: string | null,
): string {
  return `data: ${JSON.stringify({
    id: 'chatcmpl-mock',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta, finish_reason: finish }],
  })}\n\n`;
}

const pause = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

async function body<T = CompletionRequest>(
  request: IncomingMessage,
): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const data of request) chunks.push(data as Buffer);
  return (parse(Buffer.concat(chunks).toString('utf8')) ?? {}) as T;
}

export interface MockLlm {
  /** The base URL an LLM service names, ending in `/v1`. */
  readonly url: string;
  close(): Promise<void>;
}

export async function startMockLlm(port = 0, delayMs = 60): Promise<MockLlm> {
  const server: Server = createServer((request, response) => {
    void (async () => {
      if (request.method === 'GET' && request.url?.endsWith('/models')) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            object: 'list',
            data: [MOCK_MODEL, MOCK_EMBEDDING_MODEL, MOCK_RERANK_MODEL].map(
              (id) => ({ id, object: 'model' }),
            ),
          }),
        );
        return;
      }
      if (request.method === 'POST' && request.url?.endsWith('/embeddings')) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(embeddings(await body(request))));
        return;
      }
      if (request.method === 'POST' && request.url?.endsWith('/rerank')) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(reranked(await body(request))));
        return;
      }
      if (
        request.method !== 'POST' ||
        !request.url?.endsWith('/chat/completions')
      ) {
        response.writeHead(404).end();
        return;
      }
      const completion = await body(request);
      const model = completion.model ?? MOCK_MODEL;
      const answer = decide(completion);
      const prompt = JSON.stringify(completion.messages ?? []).length;
      const usage = {
        prompt_tokens: Math.ceil(prompt / 4),
        completion_tokens:
          answer.kind === 'text' ? Math.ceil(answer.text.length / 2) + 1 : 12,
      };
      if (!completion.stream) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            id: 'chatcmpl-mock',
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: answer.kind === 'text' ? answer.text : '',
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              ...usage,
              total_tokens: usage.prompt_tokens + usage.completion_tokens,
            },
          }),
        );
        return;
      }
      response.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      response.write(chunk(model, { role: 'assistant', content: '' }, null));
      if (answer.kind === 'text') {
        const characters = [...answer.text];
        for (let at = 0; at < characters.length; at += 3) {
          response.write(
            chunk(
              model,
              { content: characters.slice(at, at + 3).join('') },
              null,
            ),
          );
          await pause(delayMs);
        }
      } else {
        response.write(
          chunk(
            model,
            {
              tool_calls: [
                {
                  index: 0,
                  id: `call_${Date.now().toString(36)}`,
                  type: 'function',
                  function: {
                    name: answer.name,
                    arguments: JSON.stringify(answer.args),
                  },
                },
              ],
            },
            null,
          ),
        );
      }
      response.write(
        chunk(model, {}, answer.kind === 'text' ? 'stop' : 'tool_calls'),
      );
      response.write(
        `data: ${JSON.stringify({
          id: 'chatcmpl-mock',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [],
          usage: {
            ...usage,
            total_tokens: usage.prompt_tokens + usage.completion_tokens,
          },
        })}\n\n`,
      );
      response.end('data: [DONE]\n\n');
    })().catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
  });
  await new Promise<void>((resolve) =>
    server.listen(port, '127.0.0.1', resolve),
  );
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/v1`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

// `node e2e/support/mock-llm.ts [--port <port>]`
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const option = (name: string, fallback: number) => {
    const at = process.argv.indexOf(name);
    return at > 0 ? Number(process.argv[at + 1]) : fallback;
  };
  void startMockLlm(option('--port', 0), option('--delay', 60)).then((mock) => {
    console.log(mock.url);
  });
}
