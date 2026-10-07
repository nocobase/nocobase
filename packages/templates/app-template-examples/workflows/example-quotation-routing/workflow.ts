import {
  createConditionInstruction,
  createRunInstruction,
  createWaitInstruction,
  defineHandler,
  workflow,
  type WorkflowSourceAst,
  type ContextOf,
} from '@nocobase/app-plugin-workflow/dsl';

import type { run as calculate } from './server/calculate.js';
import type { run as createReviewTask } from './server/create-review-task.js';
import type { run as needsReview } from './server/needs-review.js';
import type { run as recordRoute } from './server/record-route.js';
import type { run as summarize } from './server/summarize.js';

const calculateHandler = defineHandler<typeof calculate>('./server/calculate');
const createReviewTaskHandler = defineHandler<typeof createReviewTask>(
  './server/create-review-task',
);
const needsReviewHandler = defineHandler<typeof needsReview>(
  './server/needs-review',
);
const recordRouteHandler = defineHandler<typeof recordRoute>(
  './server/record-route',
);
const summarizeHandler = defineHandler<typeof summarize>('./server/summarize');

const source = workflow({
  key: 'example-quotation-routing',
  title: 'Example: Quotation routing',
  description:
    'Calculate and route a quotation, create a human review task, and continue after its decision. No orders are changed.',
  input: {
    schema: {
      type: 'object',
      required: ['quotationId', 'amountCents'],
      properties: {
        quotationId: {
          type: 'string',
          title: 'Quotation reference (try Q-100)',
          minLength: 1,
          maxLength: 64,
        },
        amountCents: {
          type: 'integer',
          title: 'Amount in cents (try 50000 or 150000)',
          minimum: 0,
          maximum: 100000000,
        },
      },
      additionalProperties: false,
    },
    form: './client/inputForm.tsx',
  },
  parameters: {
    schema: {
      type: 'object',
      properties: {
        reviewThresholdCents: {
          type: 'number',
          title: 'Manual follow-up threshold in cents',
          default: 100000,
        },
      },
      additionalProperties: false,
    },
    form: './client/parametersForm.tsx',
  },
});

const flow = source
  .addNode(
    createRunInstruction({
      key: 'calculate',
      title: 'Calculate quotation',
      description:
        'Validate the quotation input and return its identifier and total in cents.',
    }).run(calculateHandler),
  )
  .addNode(
    createConditionInstruction({
      key: 'needsFollowUp',
      title: 'At or above the review threshold?',
      description:
        'Compare the calculated total with the review threshold and select manual follow-up or standard classification.',
    })
      .check(needsReviewHandler)
      .yes([
        createRunInstruction({
          key: 'manualFollowUp',
          title: 'Flag for manual follow-up',
          description:
            'Log and return the manual follow-up classification without changing an order.',
        }).run(recordRouteHandler),
      ])
      .no([
        createRunInstruction({
          key: 'standardRouting',
          title: 'Use standard processing',
          description:
            'Log and return the standard classification without changing an order.',
        }).run(recordRouteHandler),
      ]),
  )
  .addNode(
    createRunInstruction({
      key: 'createReviewTask',
      title: 'Create review task',
      description:
        'Create one application-owned human review task for this quotation run before waiting for its decision.',
    }).run(createReviewTaskHandler),
  )
  .addNode(
    createWaitInstruction<{
      taskId: number;
      reviewerId: string;
      confirmedBy: string;
      decision: 'approved' | 'rejected';
      comment: string;
    }>(
      {
        key: 'awaitRoutingConfirmation',
        title: 'Wait for human review',
        description:
          'Pause both quotation routes until a signed-in person submits the review task decision.',
      },
      {
        type: 'object',
        properties: {
          taskId: { type: 'integer' },
          reviewerId: { type: 'string' },
          confirmedBy: { type: 'string' },
          decision: { type: 'string', enum: ['approved', 'rejected'] },
          comment: { type: 'string' },
        },
        required: [
          'taskId',
          'reviewerId',
          'confirmedBy',
          'decision',
          'comment',
        ],
        additionalProperties: false,
      },
    ),
  )
  .addNode(
    createRunInstruction({
      key: 'summarize',
      title: 'Summarize selected route',
      description:
        'Return the quotation identifier, total, selected route and submitted human review result.',
    }).run(summarizeHandler),
  );

// Keep member-level indirection so handler signatures can refer to this workflow.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
