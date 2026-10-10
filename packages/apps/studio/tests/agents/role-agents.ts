/** Seeds Studio's built-in role agents into a bridge harness, owned by an initial administrator made for them. */
import frontendDesignerSeed from '../../database/main/seeds/202610100020_studio_frontend_designer.js';
import roleAgentsSeed from '../../database/main/seeds/202610100010_studio_role_agents.js';
import type { BridgeHarness } from './bridge-harness.js';

/** Makes `userId` the installation's initial administrator, whom the built-in agents seeds give their agents to. */
export async function makeRoot(
  h: BridgeHarness,
  userId: string,
): Promise<void> {
  const now = new Date();
  await h.database
    .connection()
    .query.insertInto('authorizationPermissionSetAssignments')
    .values({
      id: `user:${userId}:root`,
      subjectType: 'user',
      subjectId: userId,
      permissionSetKey: 'root',
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

/** Runs the role agents seeds, in their order: the five roles, then the frontend designer. */
export async function runRoleAgentsSeed(h: BridgeHarness): Promise<void> {
  const conn = h.database.connection();
  for (const seed of [roleAgentsSeed, frontendDesignerSeed])
    await seed.run({
      query: conn.query,
      repository: (name: string) => conn.repository(name),
      config: { get: () => undefined },
    } as never);
}
