import {
  ConditionInstruction,
  defineWorkflow,
  RunInstruction,
  type WorkflowSourceAst,
} from '@nocobase/app-plugin-workflow';

const workflow: WorkflowSourceAst = defineWorkflow({
  title: 'Existing order fulfillment',
  inputSchema: {
    type: 'object',
    required: ['orderId'],
    properties: {
      orderId: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  nodes: [
    RunInstruction.create({
      key: 'loadOrder',
      config: {
        module: './server/load-order',
        args: { orderId: '{{$input.orderId}}' },
      },
      result: {
        type: 'object',
        required: ['inStock'],
        properties: { inStock: { type: 'boolean' } },
        additionalProperties: false,
      },
    }),
    ConditionInstruction.create({
      key: 'hasStock',
      config: {
        module: './server/check-stock',
      },
    }).branch({
      yes: [
        RunInstruction.create({
          key: 'reserveInventory',
          config: {
            module: './server/reserve-inventory',
            args: { orderId: '{{$input.orderId}}' },
          },
        }),
      ],
      no: [
        RunInstruction.create({
          key: 'markBackorder',
          config: {
            module: './server/mark-backorder',
            args: { orderId: '{{$input.orderId}}' },
          },
        }),
      ],
    }),
    RunInstruction.create({
      key: 'recordOutcome',
      config: {
        module: './server/record-outcome',
        args: { orderId: '{{$input.orderId}}' },
      },
    }),
  ],
});

export default workflow;
