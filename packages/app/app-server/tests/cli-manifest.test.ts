import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  apiDocsToken,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  cliToken,
  dataResponse,
  defineApiRoutes,
  deriveAllCliCommands,
  deriveCliCommands,
  deriveCommandWords,
  describeRoute,
  emptyResponse,
  generateApiDocument,
  listResponse,
  type CliCaller,
  type CliCommand,
  type CliService,
} from '../src/router/index.js';

const Issue = z
  .object({ id: z.string(), title: z.string() })
  .meta({ ref: 'TrackerIssue' });

function trackerRouter(): Hono {
  const router = new Hono();
  router.get(
    '/tracker/issues',
    describeRoute({
      tags: ['Tracker'],
      summary: 'List issues',
      operationId: 'trackerListIssues',
      responses: { 200: listResponse(Issue), ...apiErrorResponses },
    }),
    apiValidator(
      'query',
      z.object({
        q: z.string().optional().meta({ description: 'Text to find.' }),
        pageSize: z.coerce.number().int().default(20),
        archived: z.enum(['true', 'false']).optional(),
      }),
    ),
    (context) => context.json({ data: [], meta: {} }),
  );
  router.get(
    '/tracker/issues/:issueId',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Get an issue',
      operationId: 'trackerGetIssue',
      security: [{ apiKeyAuth: [] }, { runToken: [] }],
      responses: { 200: dataResponse(Issue), ...apiErrorResponses },
    }),
    apiValidator('param', z.object({ issueId: z.string() })),
    (context) =>
      context.json({
        data: { id: context.req.valid('param').issueId, title: 'A' },
      }),
  );
  router.post(
    '/tracker/issues/:issueId/comments',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Comment on an issue',
      operationId: 'trackerCreateComment',
      security: [{ apiKeyAuth: [] }, { runToken: [] }],
      responses: { 201: dataResponse(Issue), ...apiErrorResponses },
      ...cliRoute({
        command: 'issue comment add',
        action: 'tracker.issues/comment',
        flags: {
          content: { contentFile: true, fromEnv: 'issueId' },
          parentId: {
            name: 'reply-to',
            env: ['TRACKER_PARENT', { file: 'EVENT_PATH', path: 'comment.id' }],
          },
        },
        uploads: {
          attach: {
            upload: 'trackerUpload',
            field: 'attachmentIds',
            multiple: true,
          },
        },
      }),
    }),
    apiValidator('param', z.object({ issueId: z.string() })),
    apiValidator(
      'json',
      z.strictObject({
        content: z.string().meta({ description: 'Markdown.' }),
        parentId: z.string().optional(),
        attachmentIds: z.array(z.string()).optional(),
      }),
    ),
    (context) => context.json({ data: { id: 'c1', title: '' } }, 201),
  );
  router.post(
    '/tracker/issues/:issueId/close',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Close an issue',
      operationId: 'trackerCloseIssue',
      responses: { 204: emptyResponse(), ...apiErrorResponses },
      ...cliRoute({ confirm: 'Close it?' }),
    }),
    (context) => context.body(null, 204),
  );
  router.post(
    '/tracker/uploads',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Upload a file',
      operationId: 'trackerUpload',
      responses: { 201: dataResponse(z.object({ id: z.string() })) },
      ...cliRoute(false),
    }),
    (context) => context.json({ data: { id: 'f1' } }, 201),
  );
  router.get(
    '/tracker/healthz',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Check health',
      operationId: 'trackerHealthz',
      security: [],
      responses: { 200: dataResponse(z.object({ ok: z.boolean() })) },
    }),
    (context) => context.json({ data: { ok: true } }),
  );
  router.post(
    '/tracker/releases',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Ask for a release upload ticket',
      operationId: 'trackerReleaseTicket',
      responses: { 200: dataResponse(z.object({ url: z.string() })) },
      ...cliRoute({
        command: 'release upload',
        ticketUpload: {
          flag: 'file',
          maxBytes: 1024,
          accept: ['.tar.gz'],
          description: 'The archive.',
        },
      }),
    }),
    apiValidator('json', z.strictObject({ version: z.string() })),
    (context) => context.json({ data: { url: '/upload' } }),
  );
  router.post(
    '/tracker/deploys',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Deploy a release, or an archive streamed to a ticket',
      operationId: 'trackerDeploy',
      responses: { 200: dataResponse(z.object({ url: z.string() })) },
      ...cliRoute({
        command: 'deploy',
        ticketUpload: { flag: 'file', maxBytes: 1024, optional: true },
      }),
    }),
    apiValidator(
      'json',
      z.strictObject({
        release: z.string().optional(),
        file: z.string().optional(),
      }),
    ),
    (context) => context.json({ data: { url: '/upload' } }),
  );
  router.post(
    '/tracker/proposals',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Propose changed documents',
      operationId: 'trackerPropose',
      responses: { 201: dataResponse(z.object({ id: z.string() })) },
      ...cliRoute({
        command: 'doc propose',
        changedFiles: {
          flag: 'changed',
          field: 'files',
          dir: '.tracker/docs',
          manifest: '.manifest.json',
          maxBytes: 100,
          maxFiles: 3,
          accept: ['.md'],
        },
      }),
    }),
    apiValidator(
      'json',
      z.strictObject({
        note: z.string().optional(),
        files: z.array(z.string()).optional(),
      }),
    ),
    (context) => context.json({ data: { id: 'p1' } }, 201),
  );
  router.get('/tracker/internal', describeRoute({ hide: true }), (context) =>
    context.json({}),
  );
  router.get(
    '/tracker/issues/:issueId/file',
    describeRoute({
      tags: ['Tracker'],
      summary: 'Download the file',
      operationId: 'trackerDownload',
      responses: {
        200: {
          description: 'The file.',
          content: {
            'application/octet-stream': { schema: { type: 'string' } },
          },
        },
      },
    }),
    (context) => context.body('x'),
  );
  return router;
}

async function trackerDocument() {
  const api = new Hono();
  api.route('/', trackerRouter());
  return generateApiDocument(api, {
    info: { title: 'Tracker', version: '1.0.0' },
    servers: [{ url: '/main' }],
  });
}

const byId = (commands: readonly CliCommand[], id: string): CliCommand => {
  const found = commands.find((command) => command.id === id);
  if (!found) throw new Error(`No command ${id}`);
  return found;
};

describe('command words', () => {
  it('derive from the tag, the path and the method', () => {
    expect(deriveCommandWords('get', '/api/tracker/issues', 'Tracker')).toEqual(
      ['tracker', 'issues', 'list'],
    );
    expect(
      deriveCommandWords('get', '/api/tracker/issues/{issueId}', 'Tracker'),
    ).toEqual(['tracker', 'issues', 'get']);
    expect(
      deriveCommandWords('post', '/api/tracker/issues', 'Tracker'),
    ).toEqual(['tracker', 'issues', 'create']);
    expect(
      deriveCommandWords(
        'post',
        '/api/tracker/issues/{issueId}/close',
        'Tracker',
      ),
    ).toEqual(['tracker', 'issues', 'close']);
    expect(
      deriveCommandWords('patch', '/api/tracker/issues/{issueId}', 'Tracker'),
    ).toEqual(['tracker', 'issues', 'update']);
    expect(
      deriveCommandWords('delete', '/api/tracker/issues/{issueId}', 'Tracker'),
    ).toEqual(['tracker', 'issues', 'delete']);
    expect(
      deriveCommandWords('put', '/api/users/{userId}/roles', 'Users'),
    ).toEqual(['users', 'roles', 'set']);
    expect(
      deriveCommandWords('post', '/api/articles/findMany', 'Articles'),
    ).toEqual(['articles', 'find-many']);
    expect(
      deriveCommandWords(
        'post',
        '/api/tracker/issues/{issueId}/comments',
        'Tracker',
        new Set(['/api/tracker/issues/{issueId}/comments']),
      ),
    ).toEqual(['tracker', 'issues', 'comments', 'create']);
  });
});

describe('deriveCliCommands', () => {
  it('describes every documented operation, leaving out hidden ones and x-cli: false', async () => {
    const commands = deriveAllCliCommands(await trackerDocument(), {
      identitySchemes: { runToken: 'run' },
    });
    expect(commands.map((command) => command.id)).toEqual([
      'deploy',
      'doc:propose',
      'issue:comment:add',
      'release:upload',
      'tracker:healthz:list',
      'tracker:issues:close',
      'tracker:issues:file:list',
      'tracker:issues:get',
      'tracker:issues:list',
    ]);
    // A route that takes no credential is a person's, not a run's.
    expect(byId(commands, 'tracker:healthz:list').identities).toEqual([
      'person',
    ]);
  });

  it('builds arguments, flags, uploads, body and output from the operation', async () => {
    const commands = deriveAllCliCommands(await trackerDocument(), {
      identitySchemes: { runToken: 'run' },
    });
    const add = byId(commands, 'issue:comment:add');
    expect(add).toMatchObject({
      method: 'POST',
      path: '/main/api/tracker/issues/{issueId}/comments',
      body: { media: 'application/json' },
      output: { kind: 'data' },
      identities: ['person', 'run'],
      action: 'tracker.issues/comment',
    });
    expect(add.parameters).toEqual([
      {
        name: 'issueId',
        field: 'issueId',
        in: 'path',
        position: 0,
        type: 'string',
        required: true,
      },
      {
        name: 'content',
        field: 'content',
        in: 'body',
        type: 'string',
        required: true,
        description: 'Markdown.',
        contentFile: true,
        fromEnv: 'issueId',
      },
      {
        name: 'reply-to',
        field: 'parentId',
        in: 'body',
        type: 'string',
        required: false,
        env: ['TRACKER_PARENT', { file: 'EVENT_PATH', path: 'comment.id' }],
      },
      {
        name: 'attach',
        field: 'attachmentIds',
        in: 'file',
        type: 'string[]',
        required: false,
        upload: {
          method: 'POST',
          path: '/main/api/tracker/uploads',
          part: 'file',
          field: 'attachmentIds',
          multiple: true,
        },
      },
    ]);

    const list = byId(commands, 'tracker:issues:list');
    expect(list.output.kind).toBe('list');
    expect(list.identities).toEqual(['person']);
    expect(list.parameters).toEqual([
      expect.objectContaining({
        name: 'q',
        in: 'query',
        description: 'Text to find.',
      }),
      expect.objectContaining({
        name: 'page-size',
        field: 'pageSize',
        type: 'integer',
        default: 20,
      }),
      expect.objectContaining({ name: 'archived', type: 'boolean' }),
    ]);
    expect(byId(commands, 'tracker:issues:close')).toMatchObject({
      output: { kind: 'empty' },
      confirm: 'Close it?',
    });
    expect(byId(commands, 'tracker:issues:file:list').output.kind).toBe(
      'download',
    );
  });

  it('leaves out what an exclusion matches, by tag, path or operation', async () => {
    const document = await trackerDocument();
    const ids = (exclude: Parameters<typeof deriveAllCliCommands>[1]) =>
      deriveAllCliCommands(document, exclude).map((command) => command.id);
    expect(ids({ exclude: [{ tags: ['Tracker'] }] })).toEqual([]);
    expect(
      ids({
        exclude: [
          { paths: ['/api/tracker/issues/'] },
          { operationIds: ['trackerHealthz', 'trackerPropose'] },
        ],
      }),
    ).toEqual(['deploy', 'release:upload', 'tracker:issues:list']);
  });

  it('takes a body without fields from a file, unless it allows none', async () => {
    const api = new Hono();
    for (const [name, body] of [
      ['empty', z.strictObject({})],
      ['open', z.object({}).catchall(z.unknown())],
    ] as const)
      api.post(
        `/tracker/${name}`,
        describeRoute({
          tags: ['Tracker'],
          summary: name,
          operationId: `tracker${name}`,
          responses: { 204: emptyResponse(), ...apiErrorResponses },
        }),
        apiValidator('json', body),
        (context) => context.body(null, 204),
      );
    const commands = deriveAllCliCommands(
      await generateApiDocument(api, {
        info: { title: 'Tracker', version: '1.0.0' },
      }),
    );
    expect(byId(commands, 'tracker:empty:create').body).toEqual({
      media: 'application/json',
      required: true,
    });
    expect(byId(commands, 'tracker:open:create').body).toEqual({
      media: 'application/json',
      file: 'body',
      required: true,
    });
  });

  it('describes a ticket upload and changed files as file inputs', async () => {
    const commands = deriveAllCliCommands(await trackerDocument());
    expect(byId(commands, 'release:upload').parameters).toContainEqual({
      name: 'file',
      field: 'file',
      in: 'file',
      type: 'string',
      required: true,
      description: 'The archive.',
      ticket: { maxBytes: 1024, accept: ['.tar.gz'] },
    });
    // An optional file's name fills the body field named like it, which is no flag of its own.
    expect(
      byId(commands, 'deploy').parameters.filter(
        (parameter) => parameter.name === 'file',
      ),
    ).toEqual([
      {
        name: 'file',
        field: 'file',
        in: 'file',
        type: 'string',
        required: false,
        ticket: { maxBytes: 1024, optional: true },
      },
    ]);
    const propose = byId(commands, 'doc:propose');
    // The field the files fill is not a flag of its own.
    expect(propose.parameters.map((parameter) => parameter.name)).toEqual([
      'note',
      'changed',
    ]);
    expect(propose.parameters[1]).toEqual({
      name: 'changed',
      field: 'files',
      in: 'file',
      type: 'boolean',
      required: false,
      changed: {
        dir: '.tracker/docs',
        manifest: '.manifest.json',
        maxBytes: 100,
        maxFiles: 3,
        accept: ['.md'],
      },
    });
  });

  it("keeps a caller to its identity's commands and the actions it holds", async () => {
    const document = await trackerDocument();
    const run: CliCaller = {
      kind: 'run',
      userId: 'u1',
      displayName: 'Agent',
      runId: 'r1',
      actions: new Set(),
    };
    const ids = (caller: CliCaller) =>
      deriveCliCommands(document, caller, {
        identitySchemes: { runToken: 'run' },
      }).commands.map((command) => command.id);
    expect(ids(run)).toEqual(['tracker:issues:get']);
    expect(
      ids({ ...run, actions: new Set(['tracker.issues/comment']) }),
    ).toEqual(['issue:comment:add', 'tracker:issues:get']);
    const manifest = deriveCliCommands(document, run);
    expect(manifest.identity).toEqual({
      kind: 'run',
      userId: 'u1',
      displayName: 'Agent',
      runId: 'r1',
      actions: [],
    });
    expect(manifest.etag).toMatch(/^[0-9a-f]{32}$/u);
  });

  it('says why each command a caller is not offered is withheld', async () => {
    const document = await trackerDocument();
    const manifest = deriveCliCommands(
      document,
      {
        kind: 'run',
        userId: 'u1',
        displayName: 'Agent',
        runId: 'r1',
        actions: new Set(['tracker.other/read']),
      },
      { identitySchemes: { runToken: 'run' } },
    );
    expect(manifest.identity.actions).toEqual(['tracker.other/read']);
    expect(
      manifest.withheld.find((command) => command.id === 'issue:comment:add'),
    ).toEqual({
      id: 'issue:comment:add',
      summary: 'Comment on an issue',
      reason: 'action',
      identities: ['person', 'run'],
      action: 'tracker.issues/comment',
    });
    expect(
      manifest.withheld.find((command) => command.id === 'tracker:issues:list'),
    ).toMatchObject({ reason: 'identity', identities: ['person'] });
    expect(manifest.withheld.map((command) => command.id)).not.toContain(
      'tracker:issues:get',
    );
  });
});

const config = new AppConfig();
await config.loadAll();
config.mergeDefaults({
  app: {
    name: 'main',
    publicBasePath: '/main',
    internalBasePath: '',
    publicApiUrl: '/main/api',
  },
});

function createApp(configure?: (cli: CliService) => void): Application {
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/app' }),
  });
  app.addRoutes(defineApiRoutes(() => trackerRouter()));
  app.registerProviders();
  configure?.(app.container.resolve(cliToken));
  return app;
}

const person: CliCaller = {
  kind: 'person',
  userId: 'u1',
  displayName: 'Ada',
  actions: new Set(['tracker.issues/comment']),
};

describe('GET /api/cli/manifest', () => {
  it('answers 404 when no caller resolver is registered', async () => {
    const app = createApp();
    await app.start();
    const response = await app.fetch(
      new Request('http://localhost/api/cli/manifest'),
    );
    expect(response.status).toBe(404);
  });

  it('answers 401 when no resolver recognizes the caller', async () => {
    const app = createApp((cli) => {
      cli.addCaller(() => undefined);
    });
    await app.start();
    const response = await app.fetch(
      new Request('http://localhost/api/cli/manifest'),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { reason: 'CLI_UNAUTHENTICATED' },
    });
  });

  it("answers the caller's manifest with an etag", async () => {
    const app = createApp((cli) => {
      cli.addCaller((context) =>
        context.req.header('x-who') === 'ada' ? person : undefined,
      );
    });
    await app.start();
    const response = await app.fetch(
      new Request('http://localhost/api/cli/manifest', {
        headers: { 'x-who': 'ada' },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { etag: string; commands: CliCommand[] };
    };
    expect(body.data.commands.map((command) => command.id)).toEqual([
      'deploy',
      'doc:propose',
      'issue:comment:add',
      'release:upload',
      'tracker:healthz:list',
      'tracker:issues:close',
      'tracker:issues:file:list',
      'tracker:issues:get',
      'tracker:issues:list',
    ]);
    expect(response.headers.get('etag')).toBe(`"${body.data.etag}"`);

    const again = await app.fetch(
      new Request('http://localhost/api/cli/manifest', {
        headers: { 'x-who': 'ada', 'if-none-match': `"${body.data.etag}"` },
      }),
    );
    expect(again.status).toBe(304);
  });

  it('answers the caller’s commands as an agent-readable reference', async () => {
    const app = createApp((cli) => {
      cli.addCaller(() => ({ ...person, actions: new Set<string>() }));
      cli.describe({ bin: 'tracker', title: 'Tracker' });
    });
    await app.start();
    const response = await app.fetch(
      new Request('http://localhost/api/cli/llms.txt'),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^text\/plain/u);
    const text = await response.text();
    expect(text).toMatch(/^# Tracker command line/u);
    expect(text).toContain(
      '- `tracker tracker issues get <issueId>`: Get an issue',
    );
    expect(text).toContain(
      '- `issue comment add`: needs `tracker.issues/comment`',
    );
  });

  it('keeps what the application excludes off the manifest', async () => {
    const app = createApp((cli) => {
      cli.addCaller(() => person);
      cli.exclude({ paths: ['/api/tracker/issues/'] });
    });
    await app.start();
    const response = await app.fetch(
      new Request('http://localhost/api/cli/manifest'),
    );
    const body = (await response.json()) as {
      data: { commands: CliCommand[] };
    };
    expect(body.data.commands.map((command) => command.id)).not.toContain(
      'tracker:issues:get',
    );
  });

  it('lists the identity schemes the document declares in the manifest route security', async () => {
    const app = createApp((cli) => {
      cli.addCaller(() => person);
      cli.addIdentityScheme('runToken', 'run');
      cli.addIdentityScheme('undeclaredToken', 'run');
    });
    const docs = app.container.resolve(apiDocsToken);
    docs.addFragment({
      owner: 'tracker',
      components: {
        securitySchemes: {
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' },
          runToken: { type: 'apiKey', in: 'header', name: 'x-run-token' },
        },
      },
      security: [{ apiKeyAuth: [] }],
    });
    await app.start();
    const document = await docs.getDocument();
    expect(document.paths?.['/api/cli/manifest']?.get?.security).toEqual([
      { apiKeyAuth: [] },
      { runToken: [] },
    ]);
  });
});
