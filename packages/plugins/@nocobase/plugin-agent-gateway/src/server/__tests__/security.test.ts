/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AGENT_GATEWAY_LEGACY_PERMISSIONS,
  AGENT_GATEWAY_NODE_TOKEN_HEADER,
  AGENT_GATEWAY_PERMISSION_DEFINITIONS,
  AGENT_GATEWAY_PERMISSIONS,
  AclLike,
  ModelLike,
  NodeAuthContext,
  authenticateNodeToken,
  createApiCallLogSummary,
  createClaimToken,
  createInvitationToken,
  createNodeToken,
  redactArtifactMetadata,
  hashNodeToken,
  redactArtifactText,
  redactDaemonErrorSummary,
  redactEventPayload,
  redactJson,
  redactSnapshotJson,
  redactText,
  registerAgentGatewayAcl,
  toStoredTokenFields,
  verifyClaimToken,
  verifyInvitationToken,
  verifyNodeToken,
} from '../security';

class NodeAuthTestError extends Error {
  constructor(
    public readonly status: number,
    message?: string,
  ) {
    super(message);
  }
}

interface TestNodeAuthContext extends NodeAuthContext {
  getCapturedFilter(): Record<string, unknown> | undefined;
}

function createModel(values: Record<string, unknown>): ModelLike {
  return {
    get(key: string) {
      return values[key];
    },
  };
}

function createNodeAuthContext(options: {
  headerToken?: string;
  authorization?: string;
  node?: ModelLike | null;
}): TestNodeAuthContext {
  let capturedFilter: Record<string, unknown> | undefined;
  const headers: Record<string, string | undefined> = {
    [AGENT_GATEWAY_NODE_TOKEN_HEADER]: options.headerToken,
    authorization: options.authorization,
  };

  return {
    db: {
      getRepository(collectionName: string) {
        expect(collectionName).toBe('agNodes');

        return {
          async findOne(findOptions: { filter: Record<string, unknown> }) {
            capturedFilter = findOptions.filter;
            return options.node || null;
          },
        };
      },
    },
    get(name: string) {
      return headers[name.toLowerCase()];
    },
    state: {},
    throw(status: number, message?: string): never {
      throw new NodeAuthTestError(status, message);
    },
    getCapturedFilter() {
      return capturedFilter;
    },
  };
}

describe('agent gateway token helpers', () => {
  it('generates one-time tokens with purpose-specific hashes and no persisted plaintext helper output', () => {
    const invitationToken = createInvitationToken();
    const nodeToken = createNodeToken();

    expect(invitationToken.token).toMatch(/^ag_inv_/);
    expect(nodeToken.token).toMatch(/^ag_node_/);
    expect(invitationToken.tokenHash).not.toContain(invitationToken.token);
    expect(invitationToken.tokenLast4).toBe(invitationToken.token.slice(-4));
    expect(verifyInvitationToken(invitationToken.token, invitationToken.tokenHash)).toBe(true);
    expect(verifyNodeToken(invitationToken.token, invitationToken.tokenHash)).toBe(false);
    expect(verifyInvitationToken('wrong-token', invitationToken.tokenHash)).toBe(false);
    expect(verifyInvitationToken(invitationToken.token, 'not-a-valid-hash')).toBe(false);

    const storedFields = toStoredTokenFields(invitationToken, 'tokenHash', 'tokenLast4');

    expect(storedFields).toEqual({
      tokenHash: invitationToken.tokenHash,
      tokenLast4: invitationToken.tokenLast4,
    });
    expect(storedFields).not.toHaveProperty('token');
  });

  it('supports claim-token hash verification separately from node tokens', () => {
    const claimToken = createClaimToken();

    expect(claimToken.token).toMatch(/^ag_claim_/);
    expect(verifyClaimToken(claimToken.token, claimToken.tokenHash)).toBe(true);
    expect(verifyNodeToken(claimToken.token, claimToken.tokenHash)).toBe(false);
  });
});

describe('agent gateway node token authentication', () => {
  it('authenticates an active node by token hash and records a machine subject', async () => {
    const token = createNodeToken();
    const node = createModel({
      id: 'node-id-1',
      nodeKey: 'node-1',
      nodeTokenHash: token.tokenHash,
      tokenLast4: token.tokenLast4,
      status: 'active',
    });
    const ctx = createNodeAuthContext({
      headerToken: token.token,
      node,
    });

    const result = await authenticateNodeToken(ctx);

    expect(result.node).toBe(node);
    expect(ctx.getCapturedFilter()).toEqual({
      nodeTokenHash: hashNodeToken(token.token),
    });
    expect(ctx.state.agentGatewaySubject).toEqual({
      type: 'machine',
      nodeId: 'node-id-1',
      nodeKey: 'node-1',
      tokenLast4: token.tokenLast4,
    });
    expect(ctx.state.agentGatewayAuth).toEqual({
      authenticatedBy: 'node-token',
      subject: ctx.state.agentGatewaySubject,
    });
  });

  it('also accepts bearer authorization without requiring a user login context', async () => {
    const token = createNodeToken();
    const node = createModel({
      id: 'node-id-2',
      nodeKey: 'node-2',
      nodeTokenHash: token.tokenHash,
      status: 'active',
    });
    const ctx = createNodeAuthContext({
      authorization: `Bearer ${token.token}`,
      node,
    });

    await expect(authenticateNodeToken(ctx)).resolves.toMatchObject({
      subject: {
        type: 'machine',
        nodeKey: 'node-2',
      },
    });
  });

  it('rejects missing, invalid, and inactive node tokens', async () => {
    const token = createNodeToken();
    const inactiveNode = createModel({
      id: 'node-id-3',
      nodeKey: 'node-3',
      nodeTokenHash: token.tokenHash,
      status: 'disabled',
    });

    await expect(authenticateNodeToken(createNodeAuthContext({}))).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      authenticateNodeToken(
        createNodeAuthContext({
          headerToken: 'invalid-token',
          node: null,
        }),
      ),
    ).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      authenticateNodeToken(
        createNodeAuthContext({
          headerToken: token.token,
          node: inactiveNode,
        }),
      ),
    ).rejects.toMatchObject({
      status: 403,
    });
  });
});

describe('agent gateway ACL registration', () => {
  it('registers all agent gateway permission snippets with stable names and action shapes', () => {
    const snippets: Array<{ name: string; actions: string[] | readonly string[] }> = [];
    const acl: AclLike = {
      registerSnippet(snippet) {
        snippets.push(snippet);
      },
    };

    registerAgentGatewayAcl(acl);

    expect(snippets.map((snippet) => snippet.name).sort()).toEqual(
      [...Object.values(AGENT_GATEWAY_PERMISSIONS), ...Object.values(AGENT_GATEWAY_LEGACY_PERMISSIONS)].sort(),
    );
    expect(snippets).toHaveLength(AGENT_GATEWAY_PERMISSION_DEFINITIONS.length);
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.manage)?.actions).toEqual(
      expect.arrayContaining([
        'agentGateway:manage',
        'agentGateway:readRuns',
        'agentGateway:readTerminal',
        'agentGateway:readArtifacts',
        'agentGateway:readRawLogs',
        'agNodes:*',
        'agDispatchBindings:*',
      ]),
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.dispatch)?.actions).toEqual([
      'agentGateway:dispatch',
    ]);
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_LEGACY_PERMISSIONS.dispatch)?.actions).toEqual([
      'agentGateway:dispatch',
    ]);
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRuns)?.actions).toEqual(
      expect.arrayContaining(['agentGateway:readRuns', 'agRuns:list']),
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRuns)?.actions).not.toContain(
      'agRuns:get',
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRun)?.actions).toEqual(
      expect.arrayContaining(['agentGateway:readRun', 'agentGateway:readRuns', 'agRuns:list', 'agRuns:get']),
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRun)?.actions).not.toContain(
      'agentGateway:readRawLogs',
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRunDetails)?.actions).toEqual(
      expect.arrayContaining([
        'agentGateway:readRun',
        'agentGateway:readRuns',
        'agentGateway:readRunDetails',
        'agRuns:list',
        'agRuns:get',
      ]),
    );
    expect(
      snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRunDetails)?.actions,
    ).not.toContain('agentGateway:readSessionMessages');
    expect(
      snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRunDetails)?.actions,
    ).not.toContain('agentGateway:readTerminal');
    expect(
      snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.readRunDetails)?.actions,
    ).not.toContain('agentGateway:readRawLogs');
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.manage)?.actions).toEqual(
      expect.arrayContaining(['agentGateway:cancelRun', 'agentGateway:interruptRun', 'agentGateway:terminateRun']),
    );
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.cancelRun)?.actions).toEqual([
      'agentGateway:cancelRun',
      'agRuns:get',
    ]);
    expect(snippets.find((snippet) => snippet.name === AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw)?.actions).toEqual(
      [],
    );
  });
});

describe('agent gateway redaction utilities', () => {
  it('redacts nested JSON objects, arrays, and case-insensitive sensitive keys', () => {
    const redacted = redactJson({
      Authorization: 'Bearer NODE_TOKEN_SECRET',
      nodeToken: 'ag_node_NODE_TOKEN_SECRET',
      claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
      invitationToken: 'ag_inv_INVITATION_TOKEN_SECRET',
      nested: {
        password: 'PASSWORD_SECRET',
        accessKeySecret: 'ACCESS_SECRET',
        secretAccessKey: 'SECRET_ACCESS_KEY',
        xApiKey: 'X_API_KEY_SECRET',
        items: [{ api_key: 'API_SECRET' }, { private_key: 'PRIVATE_SECRET' }],
      },
      safe: 'visible',
    }) as {
      Authorization: string;
      nodeToken: string;
      claimToken: string;
      invitationToken: string;
      nested: {
        password: string;
        accessKeySecret: string;
        secretAccessKey: string;
        xApiKey: string;
        items: Array<Record<string, string>>;
      };
      safe: string;
    };
    const serialized = JSON.stringify(redacted);

    expect(redacted.Authorization).toBe('[REDACTED]');
    expect(redacted.nodeToken).toBe('[REDACTED]');
    expect(redacted.claimToken).toBe('[REDACTED]');
    expect(redacted.invitationToken).toBe('[REDACTED]');
    expect(redacted.nested.password).toBe('[REDACTED]');
    expect(redacted.nested.accessKeySecret).toBe('[REDACTED]');
    expect(redacted.nested.secretAccessKey).toBe('[REDACTED]');
    expect(redacted.nested.xApiKey).toBe('[REDACTED]');
    expect(redacted.nested.items[0].api_key).toBe('[REDACTED]');
    expect(redacted.safe).toBe('visible');
    expect(serialized).not.toContain('NODE_TOKEN_SECRET');
    expect(serialized).not.toContain('CLAIM_TOKEN_SECRET');
    expect(serialized).not.toContain('INVITATION_TOKEN_SECRET');
    expect(serialized).not.toContain('PASSWORD_SECRET');
    expect(serialized).not.toContain('ACCESS_SECRET');
    expect(serialized).not.toContain('SECRET_ACCESS_KEY');
    expect(serialized).not.toContain('X_API_KEY_SECRET');
    expect(serialized).not.toContain('API_SECRET');
    expect(serialized).not.toContain('PRIVATE_SECRET');
  });

  it('redacts raw Agent Gateway token prefixes from event, artifact, and daemon error text', () => {
    const eventPayload = redactEventPayload({
      output: 'runner received ag_node_EVENT_TOKEN_SECRET',
      command: 'EVENT_COMMAND_SECRET',
      cwd: '/tmp/EVENT_CWD_SECRET',
      env: {
        SECRET: 'EVENT_ENV_SECRET',
      },
    });
    const artifactText = redactArtifactText(
      'artifact contains ag_claim_ARTIFACT_TOKEN_SECRET command=ARTIFACT_COMMAND_SECRET cwd=/tmp/ARTIFACT_CWD_SECRET env.SECRET=ARTIFACT_ENV_SECRET privateKey=ARTIFACT_PRIVATE_KEY x-api-key=ARTIFACT_API_KEY {"privateKey":"ARTIFACT_JSON_PRIVATE_KEY","x-api-key":"ARTIFACT_JSON_API_KEY","secretAccessKey":"keep \\"ARTIFACT_ESCAPED_SECRET\\" hidden"}',
    );
    const artifactMetadata = redactArtifactMetadata({
      externalUrl: 'https://daemon.example/ARTIFACT_EXTERNAL_URL_SECRET',
      safeNested: {
        href: 'https://daemon.example/ARTIFACT_HREF_SECRET',
        note: 'see https://daemon.example/ARTIFACT_INLINE_URL_SECRET',
      },
      commandPath: 'ARTIFACT_COMMAND_PATH_SECRET',
    });
    const snapshotJson = redactSnapshotJson({
      command: 'SNAPSHOT_COMMAND_SECRET',
      cwd: '/tmp/SNAPSHOT_CWD_SECRET',
      env: {
        SECRET: 'SNAPSHOT_ENV_SECRET',
      },
    });
    const errorSummary = redactDaemonErrorSummary(
      'daemon failed with ag_inv_ERROR_TOKEN_SECRET secretAccessKey=ERROR_SECRET_ACCESS_KEY AWS_ACCESS_KEY_ID=ERROR_AWS_KEY {"secretAccessKey":"ERROR_JSON_SECRET_ACCESS_KEY","privateKey":"abc\\"ERROR_ESCAPED_PRIVATE_KEY"}',
    );
    const serialized = JSON.stringify({
      eventPayload,
      artifactText,
      artifactMetadata,
      snapshotJson,
      errorSummary,
    });

    expect(serialized).not.toContain('EVENT_TOKEN_SECRET');
    expect(serialized).not.toContain('EVENT_COMMAND_SECRET');
    expect(serialized).not.toContain('EVENT_CWD_SECRET');
    expect(serialized).not.toContain('EVENT_ENV_SECRET');
    expect(serialized).not.toContain('ARTIFACT_TOKEN_SECRET');
    expect(serialized).not.toContain('ARTIFACT_COMMAND_SECRET');
    expect(serialized).not.toContain('ARTIFACT_CWD_SECRET');
    expect(serialized).not.toContain('ARTIFACT_ENV_SECRET');
    expect(serialized).not.toContain('ARTIFACT_PRIVATE_KEY');
    expect(serialized).not.toContain('ARTIFACT_API_KEY');
    expect(serialized).not.toContain('ARTIFACT_JSON_PRIVATE_KEY');
    expect(serialized).not.toContain('ARTIFACT_JSON_API_KEY');
    expect(serialized).not.toContain('ARTIFACT_ESCAPED_SECRET');
    expect(serialized).not.toContain('ARTIFACT_EXTERNAL_URL_SECRET');
    expect(serialized).not.toContain('ARTIFACT_HREF_SECRET');
    expect(serialized).not.toContain('ARTIFACT_INLINE_URL_SECRET');
    expect(serialized).not.toContain('ARTIFACT_COMMAND_PATH_SECRET');
    expect(serialized).not.toContain('SNAPSHOT_COMMAND_SECRET');
    expect(serialized).not.toContain('SNAPSHOT_CWD_SECRET');
    expect(serialized).not.toContain('SNAPSHOT_ENV_SECRET');
    expect(serialized).not.toContain('ERROR_TOKEN_SECRET');
    expect(serialized).not.toContain('ERROR_SECRET_ACCESS_KEY');
    expect(serialized).not.toContain('ERROR_AWS_KEY');
    expect(serialized).not.toContain('ERROR_JSON_SECRET_ACCESS_KEY');
    expect(serialized).not.toContain('ERROR_ESCAPED_PRIVATE_KEY');
  });

  it('redacts bearer tokens, authorization headers, cookies, and key-value secrets in text', () => {
    const redacted = redactText(
      [
        'Authorization: Bearer NODE_TOKEN_SECRET',
        'Cookie: session=COOKIE_SECRET',
        'Set-Cookie: agent=SET_COOKIE_SECRET',
        'password=PASSWORD_SECRET api_key=API_SECRET',
      ].join('\n'),
    );

    expect(redacted).toContain('Authorization: [REDACTED]');
    expect(redacted).toContain('Cookie: [REDACTED]');
    expect(redacted).toContain('Set-Cookie: [REDACTED]');
    expect(redacted).not.toContain('NODE_TOKEN_SECRET');
    expect(redacted).not.toContain('COOKIE_SECRET');
    expect(redacted).not.toContain('SET_COOKIE_SECRET');
    expect(redacted).not.toContain('PASSWORD_SECRET');
    expect(redacted).not.toContain('API_SECRET');
  });

  it('builds API call log summaries without plaintext token, prompt, auth, cookie, or secret values', () => {
    const longSecretTail = `privateKey="${'prefix '.repeat(500)}LONG_TRUNCATED_SECRET_TAIL hidden"`;
    const longJsonSecretTail = `privateKey="${'json prefix '.repeat(500)}LONG_JSON_TRUNCATED_SECRET_TAIL hidden"`;
    const longErrorMessageSecretTail = `privateKey="${'error prefix '.repeat(
      500,
    )}LONG_ERROR_MESSAGE_TRUNCATED_SECRET_TAIL hidden"`;
    const error = new Error(`request failed systemPrompt=ERROR_OBJECT_MESSAGE_PROMPT ${longErrorMessageSecretTail}`);
    Object.assign(error, {
      config: {
        headers: {
          authorization: 'Bearer ERROR_OBJECT_AUTH_TOKEN',
        },
        data: {
          messageContent: 'ERROR_OBJECT_MESSAGE_CONTENT_PROMPT',
        },
      },
      response: {
        data: {
          secretAccessKey: 'ERROR_OBJECT_SECRET_ACCESS_KEY',
          nodeToken: 'ERROR_OBJECT_NODE_TOKEN',
        },
      },
    });
    const summary = createApiCallLogSummary({
      method: 'POST',
      path: '/agent/run?token=QUERY_TOKEN_SECRET&prompt=QUERY_PROMPT_SECRET&payload={"systemPrompt":"QUERY_JSON_PROMPT_SECRET"}',
      statusCode: 500,
      durationMs: 12,
      headers: {
        authorization: 'Bearer HEADER_TOKEN_SECRET',
        cookie: 'sid=COOKIE_SECRET',
      },
      query: {
        token: 'QUERY_TOKEN_SECRET',
        prompt: 'QUERY_PROMPT_SECRET',
        systemPrompt: 'QUERY_SYSTEM_PROMPT_SECRET',
        nodeToken: 'QUERY_NODE_TOKEN_SECRET',
        secretAccessKey: 'QUERY_SECRET_ACCESS_KEY',
        xApiKey: 'QUERY_X_API_KEY_SECRET',
      },
      body: {
        prompt: 'BODY_PROMPT_SECRET',
        input: 'BODY_INPUT_PROMPT_SECRET',
        inputText: 'BODY_INPUT_TEXT_PROMPT_SECRET',
        instructions: 'BODY_INSTRUCTIONS_PROMPT_SECRET',
        systemPrompt: 'BODY_SYSTEM_PROMPT_SECRET',
        messageContent: 'BODY_MESSAGE_CONTENT_PROMPT_SECRET',
        messages: [
          {
            role: 'user',
            content: 'BODY_MESSAGE_PROMPT_SECRET',
          },
        ],
        claimToken: 'BODY_CLAIM_TOKEN_SECRET',
        note: longJsonSecretTail,
        resultSummary: {
          command: 'BODY_RESULT_COMMAND_SECRET',
          commandPath: 'BODY_RESULT_COMMAND_PATH_SECRET',
          cwd: '/tmp/BODY_RESULT_CWD_SECRET',
          env: {
            SECRET: 'BODY_RESULT_ENV_SECRET',
          },
        },
        errorSummary:
          'command=BODY_ERROR_COMMAND_SECRET cwd=/tmp/BODY_ERROR_CWD_SECRET env.SECRET=BODY_ERROR_ENV_SECRET',
        nested: {
          secret: 'BODY_SECRET',
        },
      },
      error:
        'request failed systemPrompt=ERROR_PROMPT_SECRET {"systemPrompt":"ERROR_JSON_PROMPT_SECRET","inputText":"keep \\"ERROR_ESCAPED_PROMPT\\" hidden","privateKey":"ERROR_JSON_PRIVATE_KEY"} secretAccessKey=ERROR_SECRET_ACCESS_KEY Authorization: Bearer ERROR_TOKEN_SECRET cookie=ERROR_COOKIE_SECRET',
    });
    const errorObjectSummary = createApiCallLogSummary({
      error,
    });
    const longTextSummary = createApiCallLogSummary({
      error: longSecretTail,
    });
    const serialized = JSON.stringify(summary);
    const serializedErrorObject = JSON.stringify(errorObjectSummary);
    const serializedLongText = JSON.stringify(longTextSummary);

    expect(serialized).not.toContain('QUERY_TOKEN_SECRET');
    expect(serialized).not.toContain('QUERY_PROMPT_SECRET');
    expect(serialized).not.toContain('QUERY_JSON_PROMPT_SECRET');
    expect(serialized).not.toContain('QUERY_SYSTEM_PROMPT_SECRET');
    expect(serialized).not.toContain('QUERY_NODE_TOKEN_SECRET');
    expect(serialized).not.toContain('QUERY_SECRET_ACCESS_KEY');
    expect(serialized).not.toContain('QUERY_X_API_KEY_SECRET');
    expect(serialized).not.toContain('HEADER_TOKEN_SECRET');
    expect(serialized).not.toContain('COOKIE_SECRET');
    expect(serialized).not.toContain('BODY_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_INPUT_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_INPUT_TEXT_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_INSTRUCTIONS_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_SYSTEM_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_MESSAGE_CONTENT_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_MESSAGE_PROMPT_SECRET');
    expect(serialized).not.toContain('BODY_CLAIM_TOKEN_SECRET');
    expect(serialized).not.toContain('BODY_RESULT_COMMAND_SECRET');
    expect(serialized).not.toContain('BODY_RESULT_COMMAND_PATH_SECRET');
    expect(serialized).not.toContain('BODY_RESULT_CWD_SECRET');
    expect(serialized).not.toContain('BODY_RESULT_ENV_SECRET');
    expect(serialized).not.toContain('BODY_ERROR_COMMAND_SECRET');
    expect(serialized).not.toContain('BODY_ERROR_CWD_SECRET');
    expect(serialized).not.toContain('BODY_ERROR_ENV_SECRET');
    expect(serialized).not.toContain('LONG_JSON_TRUNCATED_SECRET_TAIL');
    expect(serialized).not.toContain('BODY_SECRET');
    expect(serialized).not.toContain('ERROR_PROMPT_SECRET');
    expect(serialized).not.toContain('ERROR_JSON_PROMPT_SECRET');
    expect(serialized).not.toContain('ERROR_ESCAPED_PROMPT');
    expect(serialized).not.toContain('ERROR_JSON_PRIVATE_KEY');
    expect(serialized).not.toContain('ERROR_SECRET_ACCESS_KEY');
    expect(serialized).not.toContain('ERROR_TOKEN_SECRET');
    expect(serialized).not.toContain('ERROR_COOKIE_SECRET');

    expect(serializedErrorObject).not.toContain('ERROR_OBJECT_MESSAGE_PROMPT');
    expect(serializedErrorObject).not.toContain('LONG_ERROR_MESSAGE_TRUNCATED_SECRET_TAIL');
    expect(serializedErrorObject).not.toContain('ERROR_OBJECT_AUTH_TOKEN');
    expect(serializedErrorObject).not.toContain('ERROR_OBJECT_MESSAGE_CONTENT_PROMPT');
    expect(serializedErrorObject).not.toContain('ERROR_OBJECT_SECRET_ACCESS_KEY');
    expect(serializedErrorObject).not.toContain('ERROR_OBJECT_NODE_TOKEN');
    expect(serializedLongText).not.toContain('LONG_TRUNCATED_SECRET_TAIL');
  });
});
