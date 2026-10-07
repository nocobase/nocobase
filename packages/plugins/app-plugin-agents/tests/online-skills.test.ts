/**
 * An online run's skills and shell: the system prompt lists its skills by name and description, `skill` reads one,
 * `bash` reads its files read-only at `/skills/<slug>/`, refuses binary files and writes outside `/tmp`, and stays
 * within its deadline, its output cap and the skill text a run mounts. Its CLI answers like the real one, a plan the
 * application requires included.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  cliCommand,
  createServerExecutor,
  MOUNT_MAX_BYTES,
  onlineTools,
  TOOL_OUTPUT_MAX,
  type ModelEvent,
  type ModelRequest,
  type OnlineSkill,
} from '../server/online/index.js';
import { createHarness, skillMd, type Harness } from './harness.js';
import { scriptedModels } from '../server/online/scripted.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]);

const output = async (
  tools: ReturnType<typeof onlineTools>,
  name: string,
  args: unknown,
) => {
  const tool = tools.find((item) => item.spec.name === name)!;
  return tool.invoke(args);
};

describe('online skills', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  it("lists the run's skills in its prompt and reads them through its tools", async () => {
    h = await createHarness();
    const logo = await h.services.skills.upload(PNG);
    const skill = await h.services.skills.create('alice', {
      content: skillMd(
        'release-notes',
        'How we write release notes.',
        '# Release notes\n\nGroup changes by area.',
      ),
      files: [
        { path: 'template.md', content: '## Added\n\n## Fixed\n' },
        { path: 'scripts/draft.sh', content: 'echo draft\n', executable: true },
        { path: 'assets/logo.png', hash: logo.id },
      ],
    });
    await h.services.online.services.create({
      title: 'Mock',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:9/v1',
      models: [{ value: 'm1', label: 'Model one' }],
    });
    const agentId = await h.createAgent({
      name: 'PM',
      type: 'online',
      modelEntries: [{ modelService: 'mock', model: 'm1' }],
      skillIds: [skill.id],
    });
    const conversation = await h.services.conversations.create('alice', {
      agentId,
    });
    await h.services.conversations.send('alice', conversation.id, {
      content: 'Write the notes.',
    });
    const requests: ModelRequest[] = [];
    const results: string[] = [];
    const calls: [string, unknown][] = [
      ['skill', { name: 'release-notes' }],
      ['bash', { command: 'cat /skills/release-notes/template.md' }],
      ['bash', { command: 'echo x > /skills/release-notes/new.md' }],
      ['bash', { command: 'cat /skills/release-notes/assets/logo.png' }],
      [
        'bash',
        {
          command:
            'test -x /skills/release-notes/scripts/draft.sh && echo executable',
        },
      ],
    ];
    let step = 0;
    const executor = createServerExecutor(
      {
        clock: h.services.clock,
        claims: h.services.claims,
        reports: h.services.reports,
        runs: h.services.runs,
        conversations: h.services.conversations,
        commands: () => Promise.resolve(undefined),
        skill: async (run) => ({
          ...(await h!.services.skills.snapshot(run.slug, run.hash)),
          name: run.name,
          description: run.description,
        }),
        gateway: scriptedModels(
          async function* (request): AsyncGenerator<ModelEvent> {
            requests.push(request);
            const last = request.messages.at(-1);
            if (last?.role === 'tool') results.push(String(last.content));
            const next = calls[step++];
            if (next) {
              yield {
                type: 'toolCall',
                call: { id: `c${step}`, name: next[0], args: next[1] },
              };
              yield {
                type: 'finish',
                reason: 'toolCalls',
                model: 'm1',
                usage: { inputTokens: 1, outputTokens: 1 },
              };
              return;
            }
            yield { type: 'text', delta: 'Done.' };
            yield {
              type: 'finish',
              reason: 'stop',
              model: 'm1',
              usage: { inputTokens: 1, outputTokens: 1 },
            };
          },
        ),
        signal: h.services.runners.signal,
      },
      { holderId: 'server:test' },
    );
    await executor.drain();

    const system = String(requests[0]!.messages[0]!.content);
    expect(system).toContain('<name>release-notes</name>');
    expect(system).toContain(
      '<description>How we write release notes.</description>',
    );
    expect(system).toContain("A skill's scripts cannot be executed here");
    // The prompt names the skill; its body is read on demand.
    expect(system).not.toContain('Group changes by area.');
    expect(requests[0]!.tools?.map((tool) => tool.name)).toEqual([
      'skill',
      'bash',
    ]);
    expect(results[0]).toContain('Group changes by area.');
    expect(results[0]).toContain(
      '/skills/release-notes/assets/logo.png (8 bytes, binary, not readable here)',
    );
    expect(results[0]).toContain('script, cannot be run here');
    expect(results[1]).toBe('exit code 0\n## Added\n\n## Fixed');
    expect(results[2]).toMatch(/^exit code 1\n[\s\S]*read-only file system/u);
    expect(results[3]).toContain(
      'is a binary file (8 bytes): it is listed but cannot be read here.',
    );
    expect(results[4]).toBe('exit code 0\nexecutable');
  });

  it('bounds what a command may take and print', async () => {
    const skill: OnlineSkill = {
      slug: 'big',
      hash: 'h',
      name: 'Big',
      description: 'Large.',
      markdown: '---\nname: big\n---\n',
      files: [
        {
          path: 'a.txt',
          size: MOUNT_MAX_BYTES - 1024,
          executable: false,
          text: 'a'.repeat(MOUNT_MAX_BYTES - 1024),
        },
        {
          path: 'b.txt',
          size: 4096,
          executable: false,
          text: 'b'.repeat(4096),
        },
      ],
    };
    const tools = onlineTools([skill]);
    expect(
      (await output(tools, 'bash', { command: 'wc -c < /skills/big/a.txt' }))
        .output,
    ).toContain(String(MOUNT_MAX_BYTES - 1024));
    expect(
      (await output(tools, 'bash', { command: 'cat /skills/big/b.txt' }))
        .output,
    ).toContain('past the 5 MB of skill text a run mounts');
    const long = await output(tools, 'bash', {
      command: 'seq 1 9000',
    });
    expect(long.output.length).toBeLessThan(TOOL_OUTPUT_MAX + 200);
    expect(long.output).toContain('(cut: the result was');
    // Scratch under /tmp only.
    expect(
      (
        await output(tools, 'bash', {
          command: 'echo hi > /tmp/a.txt && cat /tmp/a.txt',
        })
      ).output,
    ).toBe('exit code 0\nhi');
    expect(
      (await output(tools, 'bash', { command: 'curl https://example.com' })).ok,
    ).toBe(false);
    const slow = await output(tools, 'bash', { command: 'sleep 30' });
    expect(slow.ok).toBe(false);
    expect(slow.output).toContain('deadline');
  }, 20_000);

  it('says when the application requires a plan, with the plan exit code', async () => {
    const [bash] = onlineTools(
      [],
      [
        cliCommand({
          bin: 'acme',
          commands: [
            {
              id: 'issue:update',
              summary: 'Update an issue.',
              method: 'PATCH',
              path: '/api/issues/{issueId}',
              parameters: [
                {
                  name: 'issue',
                  field: 'issueId',
                  in: 'path',
                  position: 0,
                  type: 'string',
                  required: true,
                },
                {
                  name: 'status',
                  field: 'status',
                  in: 'body',
                  type: 'string',
                  required: false,
                },
              ],
              body: { media: 'application/json' },
              output: { kind: 'data' },
              identities: ['run'],
            },
          ],
          send: () =>
            Promise.resolve(
              Response.json(
                {
                  error: {
                    code: 409,
                    domain: 'issues',
                    reason: 'PLAN_REQUIRED',
                    status: 'FAILED_PRECONDITION',
                    message: 'Closing an issue needs a plan.',
                    metadata: { reasons: ['finish'] },
                  },
                },
                { status: 409 },
              ),
            ),
        }),
      ],
    );
    const answer = await bash!.invoke({
      command: 'acme issue update PM-1 --status done',
    });
    expect(answer.ok).toBe(false);
    expect(answer.output).toMatch(/^exit code 7\n/u);
    expect(answer.output).toContain(
      'Error: Closing an issue needs a plan. (PLAN_REQUIRED)',
    );
    expect(answer.output).toContain('acme plan create --file /tmp/plan.json');
  });
});
