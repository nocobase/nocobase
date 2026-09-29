import {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
  type WorkflowSourceAst,
  type ContextOf,
} from '@nocobase/app-plugin-workflow/dsl';

import type { run as calculateReport } from './server/calculate-report';
import type { run as hasMetrics } from './server/has-metrics';
import type { run as loadMetrics } from './server/load-metrics';
import type { run as saveReport } from './server/save-report';

const loadMetricsHandler = defineHandler<typeof loadMetrics>(
  './server/load-metrics',
);
const hasMetricsHandler = defineHandler<typeof hasMetrics>(
  './server/has-metrics',
);
const calculateReportHandler = defineHandler<typeof calculateReport>(
  './server/calculate-report',
);
const saveReportHandler = defineHandler<typeof saveReport>(
  './server/save-report',
);

const source = workflow({
  key: 'example-analytics-report',
  title: 'Example: Analytics daily report',
  description:
    'Read the analytics database and save a daily report in the application database. Try 2026-09-08; a date without data ends successfully without saving.',
  input: {
    schema: {
      type: 'object',
      required: ['date'],
      properties: {
        date: {
          type: 'string',
          title: 'Report date (YYYY-MM-DD or previous-day in Asia/Singapore)',
          anyOf: [{ minLength: 10, maxLength: 10 }, { enum: ['previous-day'] }],
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
        minimumRows: {
          type: 'number',
          title: 'Minimum rows before a report is written',
          default: 1,
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
      key: 'loadMetrics',
      title: 'Read analytics metrics',
    }).run(loadMetricsHandler),
  )
  .addNode(
    createConditionInstruction({
      key: 'hasData',
      title: 'Are there enough metrics for this date?',
    })
      .check(hasMetricsHandler)
      .branch({
        no: [
          createTerminateInstruction({
            key: 'noData',
            title: 'No data: finish without a report',
          }).outcome('success'),
        ],
      }),
  )
  .addNode(
    createRunInstruction({
      key: 'calculateReport',
      title: 'Calculate daily report',
    }).run(calculateReportHandler),
  )
  .addNode(
    createRunInstruction({
      key: 'saveReport',
      title: 'Save one report per date',
    }).run(saveReportHandler),
  );

// Keep member-level indirection so handler signatures can refer to this workflow.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
