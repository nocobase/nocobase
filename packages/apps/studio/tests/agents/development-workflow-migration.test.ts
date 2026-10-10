// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { describe, expect } from 'vitest';

import { AI_REVIEW_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';

const require = createRequire(import.meta.url);
const sources: readonly MigrationSource[] = [
  ...['authentication', 'authorization', 'agents', 'projects'].map((name) => ({
    packageName: `@nocobase/app-plugin-${name}`,
    directory: path.join(
      path.dirname(
        require.resolve(`@nocobase/app-plugin-${name}/package.json`),
      ),
      'database/migrations',
    ),
  })),
  {
    packageName: 'studio-workflow-upgrade-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const parse = (value: unknown): any =>
  typeof value === 'string' ? JSON.parse(value) : value;
const originalDefinition = {
  states: [
    { key: 'custom', name: 'Custom', category: 'started', color: 'blue' },
  ],
  transitions: [],
};

for (const previousDefault of ['software', 'manual', null]) {
  describe(`preserves projects with previous default ${previousDefault ?? 'unset'}`, () => {
    describeMigration('202610210010_studio_ai_reviewed_development', {
      sources,
      before: async ({ connection }) => {
        const query = connection.query;
        const now = new Date();
        await query
          .insertInto('pmWorkflows')
          .values([
            {
              id: 'software',
              name: 'Software development',
              builtInKey: 'software',
              description: 'Original owner workflow',
              isDefault: previousDefault === 'software',
              definition: JSON.stringify(originalDefinition),
              revision: 4,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'manual',
              name: 'AI 评审开发流程',
              builtInKey: null,
              description: 'Custom review instructions',
              isDefault: previousDefault === 'manual',
              definition: JSON.stringify(originalDefinition),
              revision: 7,
              createdAt: now,
              updatedAt: now,
            },
          ])
          .execute();
        await query
          .insertInto('pmProjects')
          .values([
            {
              id: 'implicit',
              name: 'Follows default',
              workflowId: null,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'explicit',
              name: 'Explicit workflow',
              workflowId: 'manual',
              createdAt: now,
              updatedAt: now,
            },
          ])
          .execute();
      },
      up: async ({ connection }) => {
        const query = connection.query;
        const workflows = await query
          .selectFrom('pmWorkflows')
          .selectAll()
          .execute();
        expect(
          workflows
            .filter((row) => Boolean(row.isDefault))
            .map((row) => row.builtInKey),
        ).toEqual(['aiReviewedDevelopment']);
        const ai = workflows.find(
          (row) => row.builtInKey === 'aiReviewedDevelopment',
        )!;
        // The self-contained historical definition and the registered template must agree.
        expect(parse(ai.definition)).toEqual(
          JSON.parse(JSON.stringify(AI_REVIEW_TEMPLATE.definition)),
        );
        const owner = workflows.find((row) => row.id === 'software')!;
        expect(owner.name).toBe('Owner-approved development');
        expect(owner.description).toContain('The owner approves every design');
        expect(parse(owner.definition)).toEqual(originalDefinition);
        const manual = workflows.find((row) => row.id === 'manual')!;
        expect(manual.description).toContain('Custom review instructions');
        expect(manual.description).toContain('可切换到内置「AI 评审开发」');
        expect(parse(manual.definition)).toEqual(originalDefinition);
        const projects = await query
          .selectFrom('pmProjects')
          .select(['id', 'workflowId'])
          .execute();
        expect(projects.find((row) => row.id === 'explicit')?.workflowId).toBe(
          'manual',
        );
        expect(projects.find((row) => row.id === 'implicit')?.workflowId).toBe(
          previousDefault ?? 'studio-preserved-default-workflow',
        );
      },
      down: async ({ connection }) => {
        const query = connection.query;
        const workflows = await query
          .selectFrom('pmWorkflows')
          .selectAll()
          .execute();
        expect(workflows).toHaveLength(2);
        expect(
          workflows.find((row) => Boolean(row.isDefault))?.id ?? null,
        ).toBe(previousDefault);
        expect(workflows.find((row) => row.id === 'software')?.name).toBe(
          'Software development',
        );
        expect(workflows.find((row) => row.id === 'manual')?.description).toBe(
          'Custom review instructions',
        );
        expect(
          (
            await query
              .selectFrom('pmProjects')
              .select(['workflowId'])
              .where('id', '=', 'implicit')
              .executeTakeFirst()
          )?.workflowId,
        ).toBeNull();
      },
    });
  });
}
