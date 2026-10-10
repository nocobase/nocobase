import {
  ApprovalInstruction,
  defineWorkflow,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-dag-flow';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: 'Unsupported approval fixture',
  nodes: [
    ApprovalInstruction.create({
      key: 'managerApproval',
      config: { assignee: 'manager' },
    }),
  ],
});

export default workflow;
