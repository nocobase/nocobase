import {
  ConditionInstruction,
  defineWorkflow,
  RunInstruction,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: 'Fixture quotation decision',
  inputSchema: {
    type: 'object',
    required: ['quotationId', 'amount'],
    properties: {
      quotationId: { type: 'string', minLength: 1 },
      amount: { type: 'number', minimum: 0 },
    },
    additionalProperties: false,
  },
  parameters: {
    approvalLimit: { type: 'number', default: 100000 },
  },
  nodes: [
    RunInstruction.create({
      key: 'calculateRisk',
      config: {
        module: './server/calculate-risk',
        args: { amount: '{{$input.amount}}' },
      },
      result: {
        type: 'object',
        required: ['score'],
        properties: { score: { type: 'number' } },
        additionalProperties: false,
      },
    }),
    ConditionInstruction.create({
      key: 'needsApproval',
      config: {
        module: './server/check-approval',
      },
    }).branch({
      yes: [
        RunInstruction.create({
          key: 'requestApproval',
          config: { module: './server/request-approval' },
        }),
      ],
      no: [],
    }),
    RunInstruction.create({
      key: 'recordDecision',
      config: { module: './server/record-decision' },
    }),
  ],
});

export default workflow;
