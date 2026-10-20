import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';

import {
  BridgeSession,
  type ResolvedAgent,
  type SessionContext,
} from '@nocobase/acp-bridge';
import type { BridgeEvent, SessionTarget } from '@nocobase/acp-bridge/protocol';
import {
  prepareSessionSkill,
  skillsStatus,
  type SkillsEnvironment,
} from '../src/skills.ts';
import { removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('session-skills-');
afterAll(() => removeDir(scratch));

it.each(['claude', 'codex'])(
  'prepares concurrent prewarm, first messages and restored %s sessions',
  async (agentId) => {
    const root = path.join(scratch, agentId);
    const packageRoot = path.join(root, 'package');
    mkdirSync(path.join(packageRoot, 'skills/nb-studio-cli'), {
      recursive: true,
    });
    writeFileSync(
      path.join(packageRoot, 'skills/nb-studio-cli/SKILL.md'),
      'session instructions',
    );
    const environment: SkillsEnvironment = {
      packageRoot,
      cliVersion: '1.0.0',
      bin: 'acme',
      stateHome: path.join(root, 'state'),
      home: path.join(root, 'home'),
      env: { PATH: '' },
    };
    const agent: ResolvedAgent = {
      spec: {
        id: agentId,
        name: agentId,
        launchers: [],
        modes: [],
        signIn: 'test login',
      },
      command: process.execPath,
      args: [
        fileURLToPath(
          new URL(
            '../../../libs/acp-bridge/tests/fixtures/fake-agent.mjs',
            import.meta.url,
          ),
        ),
      ],
    };
    const sessions: BridgeSession[] = [];
    const events: BridgeEvent[] = [];
    const completions = new Map<string, Promise<BridgeEvent>>();
    const finishers = new Map<string, (event: BridgeEvent) => void>();
    let preparing = 0;
    let release!: () => void;
    const together = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prepareSession = async () => {
      if (++preparing === 3) release();
      await together;
      await prepareSessionSkill(environment, agentId);
      return {};
    };
    function start(
      id: string,
      acpSessionId: string | null,
      warm?: SessionContext['warm'],
    ): { session: BridgeSession; target: SessionTarget } {
      const target: SessionTarget = {
        id,
        agentId,
        cwd: root,
        acpSessionId,
        settings: {},
      };
      const session = new BridgeSession(target, {
        client: { name: 'test', version: '1.0.0' },
        env: { PATH: process.env.PATH },
        roots: [root],
        resolve: async () => agent,
        prepareSession,
        warm,
        emit: (event) => {
          events.push(event);
          if (event.kind === 'turnEnded')
            finishers.get(event.promptId)?.(event);
        },
        stateChanged: () => undefined,
      });
      sessions.push(session);
      return { session, target };
    }
    function prompt(one: ReturnType<typeof start>, id: string): void {
      completions.set(
        id,
        new Promise<BridgeEvent>((resolve) => {
          finishers.set(id, resolve);
        }),
      );
      one.session.handle({
        type: 'prompt',
        session: one.target,
        promptId: id,
        content: [{ type: 'text', text: 'hi' }],
      });
    }
    async function ended(id: string): Promise<void> {
      expect(await completions.get(id)).toMatchObject({
        kind: 'turnEnded',
        error: null,
      });
    }
    try {
      const discovery = start('draft', null);
      const warming = discovery.session.discover();
      const fresh = start('new', null);
      const restored = start('restored', 's-earlier');
      prompt(fresh, 'new-first');
      prompt(restored, 'restored-first');
      await Promise.all([warming, ended('new-first'), ended('restored-first')]);
      const warm = discovery.session.release();
      expect(warm?.process.alive).toBe(true);
      await discovery.session.close();
      const warmed = start('draft', null, Promise.resolve(warm));
      prompt(warmed, 'warm-first');
      await ended('warm-first');
      for (let i = 0; i < 3; i++) {
        const rapid = start(`rapid-${i}`, null);
        prompt(rapid, `rapid-first-${i}`);
        await ended(`rapid-first-${i}`);
      }
      expect(events.filter((event) => event.kind === 'turnEnded')).toHaveLength(
        6,
      );
      expect(
        (await skillsStatus(environment, [agentId])).targets.find(
          (target) => target.registered,
        ),
      ).toMatchObject({ upToDate: true });
    } finally {
      release();
      await Promise.all(sessions.map((session) => session.close()));
    }
  },
);
