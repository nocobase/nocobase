/**
 * A project whose workflow makes a person moving an issue from In progress to Done wait for the project lead's
 * approval. The Software development template asks for no approval, so the tests that need a status change waiting for
 * a decision make one: a copy of the default workflow with that transition added, on a new project.
 */
import { unique, type Api } from './fixtures.ts';

interface Workflow {
  readonly id: string;
  readonly isDefault: boolean;
  readonly revision: number;
  readonly definition: { readonly transitions: readonly unknown[] };
}

/** `api` is signed in as an administrator, who may edit workflows and create projects. */
export async function projectWithDoneApproval(
  api: Api,
  leadUserId: string,
): Promise<{ id: string; name: string }> {
  const workflows = await api.get<Workflow[]>('projects/workflows');
  const base = workflows.find((workflow) => workflow.isDefault);
  const workflow = await api.post<Workflow>('projects/workflows', {
    name: `完成需审批 ${unique()}`,
    copyFrom: base?.id ?? null,
  });
  await api.patch(`projects/workflows/${workflow.id}`, {
    revision: workflow.revision,
    definition: {
      ...workflow.definition,
      transitions: [
        ...workflow.definition.transitions,
        {
          from: 'in_progress',
          to: 'done',
          actors: ['user'],
          approval: { approvers: ['projectLead'] },
        },
      ],
    },
  });
  return api.post<{ id: string; name: string }>('projects', {
    name: `审批项目 ${unique()}`,
    visibility: 'everyone',
    leadUserId,
    workflowId: workflow.id,
  });
}
