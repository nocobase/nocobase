/**
 * An issue Studio creates for a chosen agent (a project's init issue, a CI task) is executed by the project manager,
 * which hands it to that agent: the project manager's run is claimed, it mentions the agent, and the agent's run is
 * claimed. Answers the agent's claim payload.
 */
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import type { BridgeHarness } from '../agents/bridge-harness.js';

export async function claimHandedOver(
  h: BridgeHarness,
  agentId: string,
): Promise<any> {
  const managed = await h.claimOne();
  if (managed?.agent?.id !== PROJECT_MANAGER_ID)
    throw new Error('The project manager’s run was not claimed first.');
  await h.projects.comments.post(
    { type: 'agent', id: PROJECT_MANAGER_ID },
    managed.subject.key as string,
    { content: `Next: wait.\n\n[@Coder](mention://agent/${agentId}) do it.` },
  );
  const payload = await h.claimOne();
  if (payload?.agent?.id !== agentId)
    throw new Error('The agent’s run was not claimed.');
  return payload;
}
