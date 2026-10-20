import { randomUUID } from 'node:crypto';
import { HEADERS } from '@nocobase/agent-protocol';
import type { Auth } from '@nocobase/app-plugin-authentication';
import type { OnlineAgentCredentials } from '../../cli/online-credential.js';
import { callerIdentityOf } from '../../cli/run-credential.js';
import type { CallerIdentity } from '../../core/callers/index.js';
import type { SkillService } from '../../core/skills/skill.service.js';
import { createSandboxProvider } from './provider.js';
import type {
  CommandSurface,
  OnlineAgentSandboxSkillCatalog,
  OnlineAgentSandboxInput,
  OnlineAgentSandboxPreparation,
  OnlineAgentSandboxProvider,
} from './types.js';

/** Own the lease outside the shell; preparation alone never issues a credential. */
export function createAuthenticatedSandboxProvider(deps: {
  skills: SkillService;
  builtinSkills?: OnlineAgentSandboxSkillCatalog;
  auth: Auth;
  credentials: OnlineAgentCredentials;
  bin?: () => string | undefined;
  commandsOf(
    identity: CallerIdentity,
    token: string,
  ): Promise<CommandSurface | undefined>;
}): OnlineAgentSandboxProvider {
  const prepare = async (
    input: OnlineAgentSandboxInput,
  ): Promise<OnlineAgentSandboxPreparation> => {
    let lease: ReturnType<OnlineAgentCredentials['issue']> | undefined;
    const prepared = await createSandboxProvider({
      skills: deps.skills,
      builtinSkills: deps.builtinSkills,
      bin: deps.bin,
      commandsOf: async () => {
        lease = deps.credentials.issue(
          input.context.user.id,
          input.executionId ?? randomUUID(),
        );
        const session = await deps.auth.getSession(
          new Headers({ [HEADERS.runToken]: lease.token }),
        );
        const identity = callerIdentityOf(session ?? undefined);
        if (!identity) throw new Error('OnlineAgent caller is unavailable.');
        return deps.commandsOf(identity, lease.token);
      },
    }).prepare(input);
    return {
      ...prepared,
      async create() {
        try {
          const sandbox = await prepared.create();
          return {
            ...sandbox,
            async dispose() {
              await sandbox.dispose();
              lease?.release();
            },
          };
        } catch (error) {
          lease?.release();
          throw error;
        }
      },
    };
  };
  return {
    prepare,
    async create(input) {
      const prepared = await prepare(input);
      try {
        return await prepared.create();
      } catch (error) {
        prepared.dispose();
        throw error;
      }
    },
  };
}
