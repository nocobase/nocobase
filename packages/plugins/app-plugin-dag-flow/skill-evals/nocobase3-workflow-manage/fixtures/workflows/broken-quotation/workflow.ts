import {
  defineWorkflow,
  RunInstruction,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-dag-flow';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: 'Broken quotation fixture',
  inputSchema: {
    type: 'object',
    properties: {
      quotationId: { type: 'string', format: 'uuid' },
    },
  },
  nodes: [
    RunInstruction.create({
      key: 'loadQuotation',
      config: { module: './server/load-quotation' },
    }),
  ],
});

export default workflow;
