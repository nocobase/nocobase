/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { buildJsTemplateSettingsDefinition } from '@nocobase/runjs/js-template/schema';
import type {
  RunJSExternalSourceBinding,
  RunJSLegacySource,
  RunJSRuntimeWriteResult,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAdapterRegistry,
  RunJSSourceLocator,
} from '@nocobase/runjs/workspace/server';
import { buildRunJSSourceRepositoryIdentity, isVscError } from '@nocobase/runjs/workspace/server';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';
import { uid } from '@nocobase/utils';

import {
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SOURCE_MODE,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../../constants';
import { createJsTemplateBaseTemplate } from '../../shared/default-template';
import { isJsTemplateError, JsTemplateError } from '../../shared/errors';
import {
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateSourceBinding';
import type {
  JsTemplate,
  JsTemplateFileChange,
  SaveAsJsTemplateInput,
  SaveAsJsTemplateOriginBinding,
  SaveAsJsTemplateResult,
  SaveAsJsTemplateWorkspaceFile,
  JsTemplateRuntimeSourceBinding,
  JsTemplateTreeEntryInput,
} from '../../shared/types';
import { JsTemplateService } from './JsTemplateService';
import { JsTemplateFileService } from './JsTemplateFileService';
import { getUsageOwnerAdapterByUse } from './JsTemplateUsageOwnerRegistry';
import type { JsTemplateUsageService } from './JsTemplateUsageService';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import {
  JsTemplateCompileService,
  type JsTemplatePreparedInitialWorkspace,
  type JsTemplatePreparedSave,
} from './JsTemplateCompileService';
import { isSourceCodeFile, normalizeSourceWorkspacePath, rewriteRelativeImports } from './sourceRelocation';
import {
  JsTemplateSourceOperationStore,
  type JsTemplateSourceOperationReservation,
} from './JsTemplateSourceOperationStore';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const INLINE_ENTRY_DESCRIPTOR_PATH = 'src/client/entry.json';
const ENTRY_ROOTS: Record<JsTemplateKind, string> = {
  'js-block': 'src/client/js-blocks',
  'js-page': 'src/client/js-pages',
  'js-field': 'src/client/js-fields',
  'js-action': 'src/client/js-actions',
  'js-item': 'src/client/js-items',
};

export interface SaveAsJsTemplateServiceContext extends JsTemplateServiceContext {
  adapterContext: RunJSSourceAdapterContext;
}

type AdapterRegistryProvider = () => RunJSSourceAdapterRegistry | null;

type FlowModelRepositoryLike = {
  findModelById: (
    uidValue: string,
    options?: { transaction?: Transaction; includeAsyncNode?: boolean },
  ) => Promise<Record<string, unknown> | null>;
};

interface SaveAsJsTemplateSourceSnapshotInput {
  locator: RunJSSourceLocator;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  expectedOwnerFingerprint: string;
}

export interface SaveAsJsTemplateSourceSnapshotValidator {
  assertCurrent(input: SaveAsJsTemplateSourceSnapshotInput, transaction?: Transaction): Promise<void>;
}

export class PersistentSaveAsJsTemplateSnapshotValidator implements SaveAsJsTemplateSourceSnapshotValidator {
  constructor(private readonly db: Database) {}

  async assertCurrent(input: SaveAsJsTemplateSourceSnapshotInput, transaction?: Transaction): Promise<void> {
    const repository = await this.db.getRepository('vscFileRepositories').findOne({
      filterByTk: input.sourceRepoId,
      transaction,
    });
    if (!repository) {
      throw sourceSnapshotOutdated(input, null);
    }

    const identity = buildRunJSSourceRepositoryIdentity(input.locator);
    if (
      repository.get('ownerType') !== identity.ownerType ||
      repository.get('ownerId') !== identity.ownerId ||
      repository.get('name') !== identity.name
    ) {
      throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'RunJS source repository belongs to another host', {
        details: { sourceRepoId: input.sourceRepoId },
      });
    }

    const currentHeadCommitId = readNullableModelString(repository, 'headCommitId');
    if (currentHeadCommitId !== input.sourceHeadCommitId || repository.get('status') === 'archived') {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
    if (!input.sourceHeadCommitId) {
      return;
    }

    const commit = await this.db.getRepository('vscFileCommits').findOne({
      filter: {
        id: input.sourceHeadCommitId,
        repoId: input.sourceRepoId,
      },
      transaction,
    });
    if (!commit) {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
    const metadata = commit.get('metadata');
    const headOwnerFingerprint = isRecord(metadata) ? metadata.ownerFingerprint : undefined;
    if (
      typeof headOwnerFingerprint === 'string' &&
      headOwnerFingerprint &&
      headOwnerFingerprint !== input.expectedOwnerFingerprint
    ) {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
  }
}

type ExternalBindingAdapter = RunJSSourceAdapter & {
  writeExternalBinding: (input: {
    locator: RunJSSourceLocator;
    binding: RunJSExternalSourceBinding;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }) => Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
};

export class SaveAsJsTemplateService {
  private readonly sourceOperationStore: JsTemplateSourceOperationStore;

  constructor(
    private readonly db: Database,
    private readonly projectService: JsTemplateProjectService,
    private readonly fileService: JsTemplateFileService,
    private readonly templateService: JsTemplateService,
    private readonly runtimeCompileService: JsTemplateCompileService,
    private readonly usageService: JsTemplateUsageService,
    private readonly getAdapterRegistry: AdapterRegistryProvider,
    private readonly applicationName = 'main',
    private readonly sourceSnapshotValidator: SaveAsJsTemplateSourceSnapshotValidator = new PersistentSaveAsJsTemplateSnapshotValidator(
      db,
    ),
    private readonly auditService: JsTemplateAuditService = new JsTemplateAuditService(db),
  ) {
    this.sourceOperationStore = new JsTemplateSourceOperationStore(db, applicationName);
  }

  async saveAsJsTemplate(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
  ): Promise<SaveAsJsTemplateResult> {
    let operation: JsTemplateSourceOperationReservation | undefined;
    try {
      const idempotencyKey = assertSaveAsJsTemplateInputSupported(input);
      const descriptor = createSaveAsJsTemplateOperationDescriptor(input, idempotencyKey);
      const inspected = await this.sourceOperationStore.inspect(descriptor);
      if (inspected.replayResult) {
        await this.assertCanReplaySaveAsJsTemplate(input, ctx);
        return inspected.replayResult;
      }
      const claimed = await this.sourceOperationStore.claim(descriptor);
      if (claimed.replayResult) {
        await this.assertCanReplaySaveAsJsTemplate(input, ctx);
        return claimed.replayResult;
      }
      operation = claimed.reservation;
      await this.assertCanStartSaveAsJsTemplate(input, ctx);
      if (input.destination.type === 'existing') {
        return await this.saveAsJsTemplateToExistingProject(input, ctx, operation);
      }
      return await this.saveAsJsTemplateToNewProject(input, ctx, operation);
    } catch (error) {
      await this.sourceOperationStore.fail(operation, error);
      throw normalizeSaveAsJsTemplateError(error);
    }
  }

  private async assertCanStartSaveAsJsTemplate(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
  ): Promise<void> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext };
    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input));
  }

  private async assertCanReplaySaveAsJsTemplate(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
  ): Promise<void> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    await adapter.assertCanWrite({
      locator: input.locator,
      ctx: { ...ctx.adapterContext, sourceTransition: 'external-binding-replay' },
    });
  }

  private async saveAsJsTemplateToExistingProject(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
    operation?: JsTemplateSourceOperationReservation,
  ): Promise<SaveAsJsTemplateResult> {
    if (input.destination.type !== 'existing') {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Existing Source Project destination is required');
    }
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    const prepareAdapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext };
    await adapter.assertCanWrite({ locator: input.locator, ctx: prepareAdapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: prepareAdapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    const kind = resolveJsTemplateKind(input.locator, legacy);
    const originSettingsSchema = await this.loadOriginSettingsSchema(input.originBinding, kind, input.locator, ctx);
    const templateFiles = createJsTemplateWorkspaceFromRunJS({
      files: input.files,
      entryPath: input.entryPath,
      kind,
      templateName: input.templateName,
      templateTitle: input.templateTitle,
      category: resolveSavedTemplateCategory(kind, legacy),
      settingsSchema: originSettingsSchema,
    });
    const entryKey = getRelocatedEntryKey(templateFiles, kind, input.templateName);
    await this.projectService.assertApplicationOwnership(input.destination.projectId, this.applicationName, ctx);
    const current = await this.fileService.pull({
      projectId: input.destination.projectId,
      includeContent: 'none',
    });
    assertDestinationProjectEnabled(current.project);
    this.assertDestinationTemplateAvailable(
      input.destination.projectId,
      kind,
      input.templateName,
      entryKey,
      templateFiles,
      current.files || [],
      await this.templateService.listTemplates(input.destination.projectId),
    );
    const prepared = await this.runtimeCompileService.prepareSaveSource(
      {
        projectId: input.destination.projectId,
        expectedHeadCommitId: current.commit?.id || null,
        message: buildSaveAsCommitMessage(input),
        files: templateFiles,
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'js-template-save-as-js-template',
      },
    );
    return this.db.sequelize.transaction(async (transaction) => {
      const result = await this.commitExistingSave(input, ctx, adapter, kind, entryKey, prepared, transaction);
      await this.recordSaveAsSuccessAudit(input, result, ctx, transaction);
      await this.sourceOperationStore.complete(operation, result, transaction);
      return result;
    });
  }

  private async commitExistingSave(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
    adapter: ExternalBindingAdapter,
    kind: JsTemplateKind,
    entryKey: string,
    prepared: JsTemplatePreparedSave,
    transaction: Transaction,
  ): Promise<SaveAsJsTemplateResult> {
    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext, transaction };
    const serviceContext: JsTemplateServiceContext = { ...ctx, transaction };
    await lockFlowModel(this.db, getFlowModelUid(input.locator), transaction);
    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const currentLegacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, currentLegacy.ownerFingerprint);
    await this.assertOriginBindingCurrent(input.originBinding, kind, input.locator, serviceContext);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input), transaction);
    const saved = await this.runtimeCompileService.commitPreparedSave(prepared, serviceContext);
    const template = await this.requireTemplate(saved.project.id, kind, entryKey, serviceContext);
    const binding = buildSourceBinding(saved.project, template, kind);
    const writeResult = await adapter.writeExternalBinding({
      locator: input.locator,
      binding: serializeJsTemplateRunJSPersistence(binding),
      baseOwnerFingerprint: input.expectedOwnerFingerprint,
      ctx: adapterContext,
    });
    const ownerFingerprint =
      writeResult.ownerFingerprint || (await adapter.getFingerprint({ locator: input.locator, ctx: adapterContext }));
    await this.usageService.syncFlowModelUsagesForNodeTree(
      { rootUid: getFlowModelUid(input.locator), action: 'jsTemplates.saveAsJsTemplate' },
      serviceContext,
    );
    return { project: saved.project, template, binding, ownerFingerprint };
  }

  private assertDestinationTemplateAvailable(
    projectId: string,
    kind: JsTemplateKind,
    entryDirectory: string,
    entryKey: string,
    templateFiles: JsTemplateFileChange[],
    currentFiles: Array<{ path: string }>,
    templates: JsTemplate[],
  ): void {
    const entryRoot = getEntryRoot(kind, entryDirectory);
    if (currentFiles.some((file) => file.path === entryRoot || file.path.startsWith(`${entryRoot}/`))) {
      throw templateConflict(projectId, kind, entryDirectory);
    }
    if (templates.some((template) => template.kind === kind && template.templateName === entryKey)) {
      throw templateConflict(projectId, kind, entryKey);
    }
    if (!templateFiles.some((file) => file.path.startsWith(`${entryRoot}/`))) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Saved JS Template workspace is incomplete');
    }
  }

  private async saveAsJsTemplateToNewProject(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
    operation?: JsTemplateSourceOperationReservation,
  ): Promise<SaveAsJsTemplateResult> {
    if (input.destination.type !== 'new') {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'New Source Project destination is required');
    }
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }

    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }

    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext };
    const serviceContext: JsTemplateServiceContext = { ...ctx };

    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input));

    const kind = resolveJsTemplateKind(input.locator, legacy);
    const category = resolveSavedTemplateCategory(kind, legacy);
    const originSettingsSchema = await this.loadOriginSettingsSchema(
      input.originBinding,
      kind,
      input.locator,
      serviceContext,
    );
    const templateFiles = createJsTemplateWorkspaceFromRunJS({
      files: input.files,
      entryPath: input.entryPath,
      kind,
      templateName: input.templateName,
      templateTitle: input.templateTitle,
      category,
      settingsSchema: originSettingsSchema,
    });
    const entryKey = getRelocatedEntryKey(templateFiles, kind, input.templateName);
    const commitMessage = buildSaveAsCommitMessage(input);
    const projectId = `jtp_${uid()}`;
    const initialFiles = [...createJsTemplateBaseTemplate(), ...templateFiles.map(toInitialTreeEntry)];
    const prepared = await this.runtimeCompileService.prepareInitialWorkspace(
      { projectId, files: initialFiles },
      {
        ...serviceContext,
        requestSource: ctx.requestSource || 'js-template-save-as-js-template-prepare',
      },
    );

    return this.db.sequelize.transaction(async (transaction) => {
      const result = await this.commitNewSave(
        input,
        ctx,
        adapter,
        kind,
        entryKey,
        projectId,
        initialFiles,
        commitMessage,
        prepared,
        transaction,
      );
      await this.recordSaveAsSuccessAudit(input, result, ctx, transaction);
      await this.sourceOperationStore.complete(operation, result, transaction);
      return result;
    });
  }

  private async commitNewSave(
    input: SaveAsJsTemplateInput,
    ctx: SaveAsJsTemplateServiceContext,
    adapter: ExternalBindingAdapter,
    preparedKind: JsTemplateKind,
    entryKey: string,
    projectId: string,
    initialFiles: JsTemplateTreeEntryInput[],
    commitMessage: string,
    prepared: JsTemplatePreparedInitialWorkspace,
    transaction: Transaction,
  ): Promise<SaveAsJsTemplateResult> {
    if (input.destination.type !== 'new') {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'New Source Project destination is required');
    }
    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext, transaction };
    const serviceContext: JsTemplateServiceContext = { ...ctx, transaction };
    if (input.originBinding) {
      await lockFlowModel(this.db, getFlowModelUid(input.locator), transaction);
    }
    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const currentLegacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, currentLegacy.ownerFingerprint);
    await this.assertOriginBindingCurrent(input.originBinding, preparedKind, input.locator, serviceContext);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input), transaction);
    if (resolveJsTemplateKind(input.locator, currentLegacy) !== preparedKind) {
      throw new JsTemplateError(
        'JS_TEMPLATE_BINDING_OUTDATED',
        'RunJS source kind changed before it could be saved as a JS Template',
      );
    }

    const project = await this.projectService.createProjectForCompositeUseCase(
      {
        name: input.destination.name,
        title: input.destination.title,
        description: input.destination.description,
        initialFiles,
        message: commitMessage,
      },
      serviceContext,
      { projectId },
    );
    if (!project.headCommitId) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Created JS Template has no source commit');
    }
    const compiled = await this.runtimeCompileService.applyPreparedInitialWorkspace(prepared, project.headCommitId, {
      ...serviceContext,
      requestSource: ctx.requestSource || 'js-template-save-as-js-template-commit',
    });
    const template = await this.requireTemplate(compiled.project.id, preparedKind, entryKey, serviceContext);
    const binding = buildSourceBinding(compiled.project, template, preparedKind);
    const writeResult = await adapter.writeExternalBinding({
      locator: input.locator,
      binding: serializeJsTemplateRunJSPersistence(binding),
      baseOwnerFingerprint: input.expectedOwnerFingerprint,
      ctx: adapterContext,
    });
    const ownerFingerprint =
      writeResult.ownerFingerprint || (await adapter.getFingerprint({ locator: input.locator, ctx: adapterContext }));
    await this.usageService.syncFlowModelUsagesForNodeTree(
      { rootUid: getFlowModelUid(input.locator), action: 'jsTemplates.saveAsJsTemplate' },
      serviceContext,
    );
    return { project: compiled.project, template, binding, ownerFingerprint };
  }

  private async recordSaveAsSuccessAudit(
    input: SaveAsJsTemplateInput,
    result: SaveAsJsTemplateResult,
    ctx: SaveAsJsTemplateServiceContext,
    transaction: Transaction,
  ): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      projectId: result.project.id,
      action: 'saveAsJsTemplate',
      result: 'success',
      requestId: ctx.requestId || randomUUID(),
      actorUserId: ctx.actorUserId,
      message: 'RunJS source saved as a JS Template',
      details: {
        destinationType: input.destination.type,
        templateId: result.template.id,
        kind: result.template.kind,
      },
      transaction,
    });
  }

  private async requireTemplate(
    projectId: string,
    kind: JsTemplateKind,
    templateName: string,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplate> {
    const templates = await this.templateService.listTemplates(projectId, ctx);
    const template = templates.find(
      (candidate) =>
        candidate.kind === kind && candidate.templateName === templateName && candidate.healthStatus === 'ready',
    );
    if (!template) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', 'Saved JS Template was not created', {
        details: { projectId, kind, templateName },
      });
    }
    return template;
  }

  private async loadOriginSettingsSchema(
    originBinding: SaveAsJsTemplateOriginBinding | undefined,
    kind: JsTemplateKind,
    locator: RunJSSourceLocator,
    ctx: JsTemplateServiceContext,
  ): Promise<Record<string, unknown> | null> {
    if (!originBinding || originBinding.kind !== kind) {
      return null;
    }
    await this.assertOriginBindingCurrent(originBinding, kind, locator, ctx);
    try {
      const originTemplate = await this.templateService.getTemplate(originBinding.templateId, ctx);
      if (originTemplate.projectId !== originBinding.projectId || originTemplate.kind !== kind) {
        return null;
      }
      return originTemplate.settingsSchema;
    } catch (error) {
      if (isJsTemplateError(error) && error.code === 'JS_TEMPLATE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  private async assertOriginBindingCurrent(
    originBinding: SaveAsJsTemplateOriginBinding | undefined,
    kind: JsTemplateKind,
    locator: RunJSSourceLocator,
    ctx: JsTemplateServiceContext,
  ): Promise<void> {
    if (!originBinding) {
      return;
    }
    const currentBinding = await readCurrentHostBinding(this.db, locator, ctx.transaction);
    if (
      !currentBinding ||
      originBinding.kind !== kind ||
      currentBinding.projectId !== originBinding.projectId ||
      currentBinding.templateId !== originBinding.templateId ||
      currentBinding.kind !== originBinding.kind
    ) {
      throw new JsTemplateError(
        'JS_TEMPLATE_BINDING_OUTDATED',
        'The requested origin binding does not match the current JS Template Host binding',
      );
    }
    await this.projectService.assertApplicationOwnership(originBinding.projectId, this.applicationName, ctx);
  }
}

function assertDestinationProjectEnabled(project: SaveAsJsTemplateResult['project']): void {
  if (project.lifecycleStatus === 'enabled') {
    return;
  }
  throw new JsTemplateError(
    'JS_TEMPLATE_PROJECT_DISABLED',
    'Disabled JS Template projects cannot receive a saved Template Entry',
    { details: { projectId: project.id, lifecycleStatus: project.lifecycleStatus } },
  );
}

export function createJsTemplateWorkspaceFromRunJS(input: {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  kind: JsTemplateKind;
  templateName: string;
  templateTitle?: string | null;
  category?: string | null;
  settingsSchema?: Record<string, unknown> | null;
}): JsTemplateFileChange[] {
  if (!JS_TEMPLATE_KEY_PATTERN.test(input.templateName)) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Template name must be a lowercase slug');
  }

  const sourceFiles = input.files
    .map((file) => ({ ...file, path: normalizeSourceWorkspacePath(file.path) }))
    .filter((file) => file.path !== RUNJS_MANIFEST_PATH);
  const normalizedEntryPath = normalizeSourceWorkspacePath(input.entryPath);
  const entryFile = sourceFiles.find((file) => file.path === normalizedEntryPath);
  const entryExtension = pathPosix.extname(normalizedEntryPath).toLowerCase();
  if (!entryFile || !isSourceCodeFile(normalizedEntryPath)) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'RunJS workspace entry file is invalid', {
      details: { entryPath: normalizedEntryPath },
    });
  }

  const sourceBasePath = pathPosix.dirname(normalizedEntryPath);
  const relocatableFiles = sourceFiles.filter(
    (file) => file.path !== `${sourceBasePath}/meta.json` && file.path !== `${sourceBasePath}/settings.json`,
  );
  const entryRoot = getEntryRoot(input.kind, input.templateName);
  const targetBySource = new Map<string, string>();
  const targetPaths = new Set<string>();

  for (const file of relocatableFiles) {
    const targetPath =
      file.path === normalizedEntryPath
        ? `${entryRoot}/index${entryExtension}`
        : file.path === INLINE_ENTRY_DESCRIPTOR_PATH
          ? `${entryRoot}/entry.json`
          : buildRelocatedPath(entryRoot, sourceBasePath, file.path);
    if (targetPaths.has(targetPath)) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'RunJS workspace files collide after relocation', {
        details: { path: targetPath },
      });
    }
    targetPaths.add(targetPath);
    targetBySource.set(file.path, targetPath);
  }

  const relocated = relocatableFiles.map<JsTemplateFileChange>((file) => {
    const targetPath = targetBySource.get(file.path);
    if (!targetPath) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'RunJS workspace relocation failed');
    }
    return {
      path: targetPath,
      content: rewriteRelativeImports(file.content, file.path, targetPath, targetBySource),
      language: file.language,
      mode: file.mode,
      operation: 'upsert',
    };
  });

  upsertEntryDescriptor(
    relocated,
    entryRoot,
    input.templateName,
    input.templateTitle?.trim() || null,
    input.category?.trim() || null,
    input.settingsSchema || null,
  );

  return relocated;
}

function buildRelocatedPath(entryRoot: string, sourceBasePath: string, sourcePath: string): string {
  const relative = pathPosix.relative(sourceBasePath, sourcePath);
  if (relative && relative !== '..' && !relative.startsWith('../')) {
    return `${entryRoot}/${relative}`;
  }
  return `${entryRoot}/__workspace/${sourcePath}`;
}

function resolveJsTemplateKind(locator: RunJSSourceLocator, legacy: RunJSLegacySource): JsTemplateKind {
  if (locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(locator);
  }

  const modelUse = typeof legacy.metadata?.modelUse === 'string' ? legacy.metadata.modelUse : '';
  const ownerAdapter = getUsageOwnerAdapterByUse(modelUse);
  if (!ownerAdapter || !(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(ownerAdapter.kind)) {
    throw unsupportedLocator(locator, modelUse);
  }
  assertCanonicalModelSourceLocator(locator, ownerAdapter.kind, modelUse);
  return ownerAdapter.kind;
}

function assertCanonicalModelSourceLocator(
  locator: Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>,
  kind: JsTemplateKind,
  modelUse: string,
): void {
  const expectedFlowKey = kind === 'js-action' ? 'clickSettings' : 'jsSettings';
  const hasCanonicalVersionPath =
    !locator.versionPath || (locator.versionPath.length === 1 && locator.versionPath[0] === 'version');
  if (
    locator.flowKey !== expectedFlowKey ||
    locator.stepKey !== 'runJs' ||
    locator.paramPath.length !== 1 ||
    locator.paramPath[0] !== 'code' ||
    !hasCanonicalVersionPath
  ) {
    throw unsupportedLocator(locator, modelUse);
  }
}

function resolveSavedTemplateCategory(kind: JsTemplateKind, legacy: RunJSLegacySource): string | null {
  if (kind !== 'js-field') {
    return null;
  }
  return legacy.metadata?.modelUse === 'JSColumnModel' ? 'js-column' : 'js-field';
}

function buildSourceBinding(
  project: SaveAsJsTemplateResult['project'],
  template: JsTemplate,
  kind: JsTemplateKind,
): JsTemplateRuntimeSourceBinding {
  return createJsTemplateRuntimeSourceBinding({
    projectId: project.id,
    templateId: template.id,
    kind,
  });
}

function getEntryRoot(kind: JsTemplateKind, templateName: string): string {
  return `${ENTRY_ROOTS[kind]}/${templateName}`;
}

function getFlowModelUid(locator: RunJSSourceLocator): string {
  if (locator.kind === 'flowModel.step') {
    return locator.modelUid;
  }
  throw unsupportedLocator(locator);
}

async function lockFlowModel(db: Database, modelUid: string, transaction: Transaction): Promise<void> {
  await db.getCollection('flowModels').model.findByPk(modelUid, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

function assertSaveAsJsTemplateInputSupported(input: SaveAsJsTemplateInput): string {
  if (typeof input.idempotencyKey !== 'string') {
    throw new JsTemplateError(
      'JS_TEMPLATE_INVALID_INPUT',
      'Save as JS Template idempotency key must be a non-empty string',
    );
  }
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw new JsTemplateError(
      'JS_TEMPLATE_INVALID_INPUT',
      'Save as JS Template idempotency key must be a non-empty string',
    );
  }
  if (idempotencyKey.length > 255) {
    throw new JsTemplateError(
      'JS_TEMPLATE_INVALID_INPUT',
      'Save as JS Template idempotency key must be at most 255 characters',
    );
  }
  if (input.locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(input.locator);
  }
  if (
    input.originBinding &&
    (!isJsTemplateRuntimeSourceBinding(input.originBinding) ||
      !(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(input.originBinding.kind))
  ) {
    throw unsupportedLocator(input.locator, undefined, input.originBinding.kind);
  }
  return idempotencyKey;
}

async function readCurrentHostBinding(
  db: Database,
  locator: RunJSSourceLocator,
  transaction?: Transaction,
): Promise<JsTemplateRuntimeSourceBinding | undefined> {
  if (locator.kind !== 'flowModel.step') {
    return undefined;
  }
  const repository = db.getCollection('flowModels').repository as unknown as FlowModelRepositoryLike;
  const model = await repository.findModelById(locator.modelUid, {
    transaction,
    includeAsyncNode: true,
  });
  const sourceRoot = getAtPath(model, [
    'stepParams',
    locator.flowKey,
    locator.stepKey,
    ...locator.paramPath.slice(0, -1),
  ]);
  if (!isRecord(sourceRoot) || sourceRoot.sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
    return undefined;
  }
  return isJsTemplateRuntimeSourceBinding(sourceRoot.sourceBinding) ? sourceRoot.sourceBinding : undefined;
}

function getAtPath(root: unknown, path: readonly string[]): unknown {
  let current = root;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function assertOwnerFingerprint(expected: string, current: string): void {
  if (expected === current) {
    return;
  }
  throw new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'RunJS source changed before it could be saved as a JS Template',
    {
      details: {
        expectedOwnerFingerprint: expected,
        currentOwnerFingerprint: current,
      },
    },
  );
}

function templateConflict(projectId: string, kind: JsTemplateKind, templateName: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_CONFLICT', `JS Template "${templateName}" already exists`, {
    details: { projectId, kind, templateName },
  });
}

function unsupportedLocator(
  locator: RunJSSourceLocator,
  modelUse?: string,
  originBindingKind?: string,
): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'This RunJS source cannot be saved as a JS Template', {
    details: { locatorKind: locator.kind, modelUse, originBindingKind },
  });
}

function buildSaveAsCommitMessage(input: SaveAsJsTemplateInput): string {
  const sourceVersion = input.sourceHeadCommitId || 'working-copy';
  return `Save RunJS source ${input.sourceRepoId}@${sourceVersion} as ${input.templateName}`.slice(0, 200);
}

function toInitialTreeEntry(file: JsTemplateFileChange) {
  const { operation: _operation, ...entry } = file;
  return entry;
}

function upsertEntryDescriptor(
  files: JsTemplateFileChange[],
  entryRoot: string,
  key: string,
  title: string | null,
  category: string | null,
  fallbackSettingsSchema: Record<string, unknown> | null,
): void {
  const descriptorPath = `${entryRoot}/entry.json`;
  const existing = files.find((file) => file.path === descriptorPath);
  const sourceDescriptor = existing ? parseEntryDescriptor(existing.content, descriptorPath) : {};
  const descriptor: Record<string, unknown> = {
    schemaVersion: 1,
    key,
  };
  if (title) {
    descriptor.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'description')) {
    descriptor.description = sourceDescriptor.description;
  }
  if (category) {
    descriptor.category = category;
  } else if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'category')) {
    descriptor.category = sourceDescriptor.category;
  }
  for (const field of ['icon', 'tags', 'sort'] as const) {
    if (Object.prototype.hasOwnProperty.call(sourceDescriptor, field)) {
      descriptor[field] = sourceDescriptor[field];
    }
  }
  if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'settings')) {
    descriptor.settings = sourceDescriptor.settings;
  } else if (fallbackSettingsSchema) {
    descriptor.settings = buildJsTemplateSettingsDefinition(fallbackSettingsSchema);
  }
  const content = `${JSON.stringify(descriptor, null, 2)}\n`;
  if (!existing) {
    files.push({
      path: descriptorPath,
      content,
      language: 'json',
      operation: 'upsert',
    });
    return;
  }

  existing.content = content;
  existing.language = 'json';
  existing.operation = 'upsert';
}

function getRelocatedEntryKey(files: JsTemplateFileChange[], kind: JsTemplateKind, entryDirectory: string): string {
  const descriptorPath = `${getEntryRoot(kind, entryDirectory)}/entry.json`;
  const descriptorFile = files.find((file) => file.path === descriptorPath);
  if (!descriptorFile) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Saved JS Template descriptor is missing', {
      details: { descriptorPath },
    });
  }
  const descriptor = parseEntryDescriptor(descriptorFile.content, descriptorPath);
  if (typeof descriptor.key !== 'string' || !JS_TEMPLATE_KEY_PATTERN.test(descriptor.key)) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'RunJS entry descriptor key is invalid', {
      details: { descriptorPath },
    });
  }
  return descriptor.key;
}

function parseEntryDescriptor(content: string, path: string): Record<string, unknown> {
  let descriptor: unknown;
  try {
    descriptor = JSON.parse(content);
  } catch {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'RunJS entry descriptor is invalid JSON', {
      details: { path },
    });
  }
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'RunJS entry descriptor must be a JSON object', {
      details: { path },
    });
  }
  return { ...(descriptor as Record<string, unknown>) };
}

function supportsExternalBinding(adapter: RunJSSourceAdapter): adapter is ExternalBindingAdapter {
  return typeof (adapter as { writeExternalBinding?: unknown }).writeExternalBinding === 'function';
}

function readNullableModelString(record: Model, key: string): string | null {
  const value = record.get(key);
  return typeof value === 'string' && value ? value : null;
}

function toSourceSnapshotInput(input: SaveAsJsTemplateInput): SaveAsJsTemplateSourceSnapshotInput {
  return {
    locator: input.locator,
    sourceRepoId: input.sourceRepoId,
    sourceHeadCommitId: input.sourceHeadCommitId,
    expectedOwnerFingerprint: input.expectedOwnerFingerprint,
  };
}

function sourceSnapshotOutdated(
  input: SaveAsJsTemplateSourceSnapshotInput,
  currentHeadCommitId: string | null,
): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_SOURCE_OUTDATED',
    'RunJS workspace Head changed before it could be saved as a JS Template',
    {
      details: {
        sourceRepoId: input.sourceRepoId,
        expectedHeadCommitId: input.sourceHeadCommitId,
        currentHeadCommitId,
      },
    },
  );
}

function readSaveAsJsTemplateOperationResult(value: unknown): SaveAsJsTemplateResult {
  if (
    !isRecord(value) ||
    !isRecord(value.project) ||
    !isRecord(value.template) ||
    !isRecord(value.binding) ||
    typeof value.ownerFingerprint !== 'string'
  ) {
    throw new JsTemplateError(
      'JS_TEMPLATE_SOURCE_ERROR',
      'Save as JS Template operation has an invalid completed result',
    );
  }
  return value as unknown as SaveAsJsTemplateResult;
}

function createSaveAsJsTemplateOperationDescriptor(input: SaveAsJsTemplateInput, idempotencyKey: string) {
  return {
    action: 'save-as-js-template',
    idempotencyKey,
    request: { ...input, idempotencyKey: undefined },
    parseResult: readSaveAsJsTemplateOperationResult,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSaveAsJsTemplateError(error: unknown): unknown {
  if (!isVscError(error)) {
    return error;
  }
  if (error.code === 'RUNJS_SOURCE_OWNER_OUTDATED') {
    return new JsTemplateError(
      'JS_TEMPLATE_BINDING_OUTDATED',
      'RunJS source changed before it could be saved as a JS Template',
      { details: error.details },
    );
  }
  if (error.code === 'PERMISSION_DENIED') {
    return new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'RunJS source write permission is required', {
      details: error.details,
    });
  }
  return new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'RunJS source could not be saved as a JS Template', {
    status: error.status,
    details: {
      sourceCode: error.code,
      ...(error.details || {}),
    },
  });
}
