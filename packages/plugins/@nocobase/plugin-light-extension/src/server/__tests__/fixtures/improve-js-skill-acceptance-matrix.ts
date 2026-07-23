/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ImproveJSSkillAcceptanceLane = 'nocobase-server' | 'client-v2' | 'nocobase-skills';

export interface ImproveJSSkillAcceptanceEvidence {
  lane?: ImproveJSSkillAcceptanceLane;
  repository: 'nocobase' | 'skills';
  file: string;
  testName: string;
  command: string;
}

export interface ImproveJSSkillAcceptanceScenario {
  id: string;
  title: string;
  lane: ImproveJSSkillAcceptanceLane;
  stage: string;
  problemCode: string;
  recoveryAction: string;
  expectedResult: 'pass';
  evidence: ImproveJSSkillAcceptanceEvidence[];
}

const postgresServerPrefix =
  'DB_DIALECT=postgres DB_HOST=127.0.0.1 DB_PORT=5432 DB_DATABASE=nocobase_test_improve_js_skill DB_USER=nocobase DB_PASSWORD=nocobase';

function serverCommand(file: string) {
  return `${postgresServerPrefix} yarn test ${file} --run`;
}

function clientCommand(file: string) {
  return `yarn test ${file} --run`;
}

const acceptanceFile =
  'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/improve-js-skill.acceptance.test.ts';
const flowSurfaceContractFile =
  'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/flow-surfaces.js-page-contract.test.ts';
const moveSourceFile = 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-source.test.ts';

export const improveJSSkillAcceptanceMatrix: ImproveJSSkillAcceptanceScenario[] = [
  {
    id: '01',
    title: 'new JS Block defaults to an Inline Workspace',
    lane: 'nocobase-server',
    stage: 'host-create-and-workspace-bootstrap',
    problemCode: 'WORKSPACE_BOOTSTRAP_FAILED',
    recoveryAction: 'retry the same Host write without creating a Light Extension Repository',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: acceptanceFile,
        testName: 'uses public Host and runJSSources actions for default Inline JS Block and JS Page workspaces',
        command: serverCommand(acceptanceFile),
      },
    ],
  },
  {
    id: '02',
    title: 'Create JS page saves a complete multi-file Inline Workspace',
    lane: 'nocobase-server',
    stage: 'create-js-page-open-preview-save',
    problemCode: 'RUNJS_COMPILE_FAILED',
    recoveryAction: 'repair preview diagnostics and repeat compilePreview before the full-snapshot save',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: acceptanceFile,
        testName: 'uses public Host and runJSSources actions for default Inline JS Block and JS Page workspaces',
        command: serverCommand(acceptanceFile),
      },
      {
        repository: 'nocobase',
        file: flowSurfaceContractFile,
        testName: 'creates a JS Page host with one $label workspace bootstrap call',
        command: serverCommand(flowSurfaceContractFile),
      },
    ],
  },
  {
    id: '03',
    title: 'Host and Workspace creation is idempotent',
    lane: 'nocobase-server',
    stage: 'host-idempotency-reservation',
    problemCode: 'FLOW_SURFACE_IDEMPOTENCY_CONFLICT',
    recoveryAction: 'reuse the same key only for the same request or choose a new key for a changed request',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: acceptanceFile,
        testName: 'uses public Host and runJSSources actions for default Inline JS Block and JS Page workspaces',
        command: serverCommand(acceptanceFile),
      },
      {
        repository: 'nocobase',
        file: flowSurfaceContractFile,
        testName: 'replays a scoped idempotent JS Page create and rejects an inconsistent request',
        command: serverCommand(flowSurfaceContractFile),
      },
    ],
  },
  {
    id: '04',
    title: 'compile failure preserves source Head, artifact, and binding',
    lane: 'nocobase-server',
    stage: 'compile-before-publish',
    problemCode: 'RUNJS_COMPILE_FAILED',
    recoveryAction: 'fix diagnostics and retry from the unchanged Head and owner binding',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts',
        testName: 'rejects a save when compilation fails and keeps the previous source and runtime',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts',
        ),
      },
      {
        repository: 'nocobase',
        file: moveSourceFile,
        testName: 'does not bind or sync references when JS Page compilation fails',
        command: serverCommand(moveSourceFile),
      },
    ],
  },
  {
    id: '05',
    title: 'stale 409 recovery opens latest, merges, previews, and saves',
    lane: 'client-v2',
    stage: 'stale-head-save-recovery',
    problemCode: 'BASE_COMMIT_OUTDATED',
    recoveryAction: 'openLatest, perform a path-level three-way merge, compilePreview, then save with fresh CAS tokens',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/client-v2/vsc-file/runjs-studio/__tests__/RunJSStudioProvider.test.tsx',
        testName: 'opens latest, three-way merges, recompiles, and saves with fresh CAS after a stale Head',
        command: clientCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/client-v2/vsc-file/runjs-studio/__tests__/RunJSStudioProvider.test.tsx',
        ),
      },
    ],
  },
  {
    id: '06',
    title: 'Settings defaults, Host overrides, ctx.settings, and Page or Block parity remain equivalent',
    lane: 'client-v2',
    stage: 'settings-resolution-and-host-persistence',
    problemCode: 'LIGHT_EXTENSION_SETTINGS_INVALID',
    recoveryAction: 'repair the descriptor or clear the invalid Host override to restore its default',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: 'packages/core/client-v2/src/flow/models/base/PageModel/__tests__/JSPageSource.test.tsx',
        testName: 'keeps settings isolated between pages bound to the same entry',
        command: clientCommand(
          'packages/core/client-v2/src/flow/models/base/PageModel/__tests__/JSPageSource.test.tsx',
        ),
      },
      {
        repository: 'nocobase',
        lane: 'nocobase-server',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/SettingsResolverService.test.ts',
        testName: 'reports nested validation failures at the field level',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/SettingsResolverService.test.ts',
        ),
      },
    ],
  },
  {
    id: '07',
    title: 'explicit externalization reuses the application default Repository and isolates Host settings',
    lane: 'nocobase-server',
    stage: 'externalize-destination-and-binding',
    problemCode: 'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT',
    recoveryAction: 'replay the identical move with the same key or use a new key after changing the request',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: acceptanceFile,
        testName: 'normalizes explicit externalization through the public lightExtensions resource',
        command: serverCommand(acceptanceFile),
      },
      {
        repository: 'nocobase',
        file: moveSourceFile,
        testName: 'returns the persisted result when a completed move operation is replayed',
        command: serverCommand(moveSourceFile),
      },
      {
        lane: 'client-v2',
        repository: 'nocobase',
        file: 'packages/core/client-v2/src/flow/models/base/PageModel/__tests__/JSPageSource.test.tsx',
        testName: 'keeps settings isolated between pages bound to the same entry',
        command: clientCommand(
          'packages/core/client-v2/src/flow/models/base/PageModel/__tests__/JSPageSource.test.tsx',
        ),
      },
    ],
  },
  {
    id: '08',
    title: 'tenant, permission, traversal, package, server, migration, and ACL writes are rejected',
    lane: 'nocobase-server',
    stage: 'public-resource-authorization-and-workspace-validation',
    problemCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    recoveryAction: 'remove the forbidden path or dependency and retry through the allowlisted public resource',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/file-service.test.ts',
        testName: 'rejects delete changes outside the light-extension source whitelist before writing to vsc storage',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/file-service.test.ts',
        ),
      },
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/raw-resource-bypass.test.ts',
        testName: 'rejects direct runJSSources preview and save paths for light-extension repositories',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/raw-resource-bypass.test.ts',
        ),
      },
      {
        repository: 'nocobase',
        file: moveSourceFile,
        testName: 'requires host write permission before changing the destination',
        command: serverCommand(moveSourceFile),
      },
    ],
  },
  {
    id: '09',
    title: 'Entry identity survives directory rename and move back without losing settings',
    lane: 'nocobase-server',
    stage: 'entry-relocation-and-return-inline',
    problemCode: 'LIGHT_EXTENSION_BINDING_OUTDATED',
    recoveryAction: 'refresh the Entry by identity and retry against the current binding',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts',
        testName: 'preserves entryId and runtime bindings when an entry directory is renamed',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts',
        ),
      },
      {
        repository: 'nocobase',
        file: 'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-to-inline.test.ts',
        testName: 'moves a JS Page inline with its snapshot and settings while removing the active reference',
        command: serverCommand(
          'packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/move-to-inline.test.ts',
        ),
      },
    ],
  },
  {
    id: '10',
    title: 'JS Page rejects ordinary composition while Root Page behavior remains available',
    lane: 'nocobase-server',
    stage: 'page-capability-routing',
    problemCode: 'FLOW_SURFACE_JS_PAGE_OPERATION_UNSUPPORTED',
    recoveryAction:
      'author source through runJSSources or target an ordinary Root Page for tabs, blocks, and blueprints',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: flowSurfaceContractFile,
        testName: 'rejects tab, block, compose and blueprint authoring with a stable JS page error',
        command: serverCommand(flowSurfaceContractFile),
      },
    ],
  },
  {
    id: '11',
    title: 'partial Host, Repository, and bootstrap failures recover without orphan bindings',
    lane: 'nocobase-server',
    stage: 'transactional-bootstrap-and-binding',
    problemCode: 'WORKSPACE_BOOTSTRAP_FAILED',
    recoveryAction: 'retry the reserved operation after rollback or reclaim the recorded failed attempt',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'nocobase',
        file: flowSurfaceContractFile,
        testName: 'rolls back a JS Page host and idempotency reservation when bootstrap throws',
        command: serverCommand(flowSurfaceContractFile),
      },
      {
        repository: 'nocobase',
        file: moveSourceFile,
        testName: 'keeps destination and host writes under one rejected transaction when binding fails',
        command: serverCommand(moveSourceFile),
      },
    ],
  },
  {
    id: '12',
    title: 'Skill routing detects Create JS page, Inline Workspace, Settings-first, and no-preview rules',
    lane: 'nocobase-skills',
    stage: 'skill-docs-consistency',
    problemCode: 'DOCS_CONSISTENCY_ASSERTION_FAILED',
    recoveryAction: 'repair the canonical source documentation and rerun the complete Node skill lane',
    expectedResult: 'pass',
    evidence: [
      {
        repository: 'skills',
        file: 'skills/nocobase-ui-builder/runtime/tests/docs-consistency.test.js',
        testName: 'new complete JS surfaces use the inline Workspace contract',
        command:
          'node --test skills/nocobase-ui-builder/runtime/tests/*.test.js skills/nocobase-ui-builder/scripts/*.test.mjs',
      },
    ],
  },
];
