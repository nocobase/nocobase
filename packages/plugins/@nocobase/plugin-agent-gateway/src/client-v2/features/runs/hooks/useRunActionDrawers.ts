/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { Form } from 'antd';
import type { UploadProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../../../shared/apiContract';
import {
  BuildRunOptions,
  getBuildRunnerSelectOptions,
  getBuildSkillVersionSelectOptions,
  getDefaultBuildRunnerValue,
  getOptionalFormString,
  getTaskArtifactDeclarations,
  getTaskArtifactFormValues,
  hasSelectableBuildRunner,
  parseBuildRunnerValue,
} from '../../../pages/AgentGatewayTaskParameterFormItems';
import {
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
  uploadAgentGatewayFile,
} from '../../../pages/AgentGatewayPageUtils';
import {
  DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES,
  DEFAULT_SKILL_UPLOAD_FORM_VALUES,
} from '../../../pages/runs/RunActionDrawers';
import type {
  AgentGatewayPageContext,
  BuildTaskFormValues,
  CreateBuildRunResult,
  ExternalRunImportFormValues,
  ExternalRunImportResult,
  SkillUploadFormValues,
  SkillUploadResult,
  TFunction,
} from '../../../pages/runs/types';
import {
  findBuildTaskTemplate,
  getBuildTaskTemplateSelectOptions,
  getSkillVersionIds,
  isFormValidationError,
  readFileAsText,
  shouldUseDefaultBuildRunner,
} from '../runShared';

interface UseRunActionDrawersOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  refreshRuns(): void;
  openRunById(runId: string): void;
}

export function useRunActionDrawers({ ctx, t, refreshRuns, openRunById }: UseRunActionDrawersOptions) {
  const [buildTaskForm] = Form.useForm<BuildTaskFormValues>();
  const [externalRunImportForm] = Form.useForm<ExternalRunImportFormValues>();
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const [buildTaskOpen, setBuildTaskOpen] = useState(false);
  const [externalRunImportOpen, setExternalRunImportOpen] = useState(false);
  const [externalRunLogContent, setExternalRunLogContent] = useState('');
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipFile, setSkillZipFile] = useState<File | null>(null);
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);

  const buildRunOptionsRequest = useRequest(
    async () => {
      const response = await ctx.api.request<BuildRunOptions>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions),
        method: 'get',
      });
      return getResponseData(response, {});
    },
    { manual: true },
  );

  const runnerOptions = useMemo(
    () => getBuildRunnerSelectOptions(buildRunOptionsRequest.data, t),
    [buildRunOptionsRequest.data, t],
  );
  const hasOnlineRunner = useMemo(
    () => hasSelectableBuildRunner(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const skillVersionOptions = useMemo(
    () => getBuildSkillVersionSelectOptions(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const taskTemplateOptions = useMemo(
    () => getBuildTaskTemplateSelectOptions(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const defaultRunner = useMemo(
    () => getDefaultBuildRunnerValue(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const defaultCwd = buildRunOptionsRequest.data?.defaultCwd || '';

  const createBuildTaskRequest = useRequest(
    async (values: BuildTaskFormValues) => {
      const runner = parseBuildRunnerValue(values.runner || defaultRunner);
      const artifacts = getTaskArtifactDeclarations(values.artifactDeclarations);
      const artifactRoot = getOptionalFormString(values.artifactRoot);
      const response = await ctx.api.request<CreateBuildRunResult>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
        method: 'post',
        data: {
          taskTemplateId: values.taskTemplateId,
          title: values.title,
          prompt: values.prompt,
          skillVersionIds: values.skillVersionIds,
          cwd: values.cwd || defaultCwd || '.',
          ...(artifactRoot ? { artifactRoot } : {}),
          ...(artifacts.length ? { artifacts } : {}),
          nodeId: runner.nodeId,
          agentProfileId: runner.agentProfileId,
        },
      });
      return getRequiredResponseData(response, t('Failed to create task run'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = result.runId || result.run?.id;
        buildTaskForm.resetFields();
        setBuildTaskOpen(false);
        if (nextRunId) {
          openRunById(nextRunId);
        }
        refreshRuns();
        ctx.message?.success(t('Task run created'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to create task run')));
      },
    },
  );

  const importExternalRunRequest = useRequest(
    async (values: ExternalRunImportFormValues & { logContent: string }) => {
      const response = await ctx.api.request<ExternalRunImportResult>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
        method: 'post',
        data: {
          provider: values.provider || 'codex',
          title: values.title,
          instruction: values.instruction,
          status: values.status || 'succeeded',
          externalRunKey: values.externalRunKey,
          providerSessionId: values.providerSessionId,
          sourceCollection: values.sourceCollection,
          sourceRecordId: values.sourceRecordId,
          outputAgentRunField: values.outputAgentRunField,
          logs: values.logContent ? [{ format: values.format || 'codex-jsonl', contentText: values.logContent }] : [],
        },
      });
      return getRequiredResponseData(response, t('Failed to import external run'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = result.runId || result.run?.id;
        externalRunImportForm.resetFields();
        setExternalRunLogContent('');
        setExternalRunImportOpen(false);
        if (nextRunId) {
          openRunById(nextRunId);
        }
        refreshRuns();
        ctx.message?.success(result.deduped ? t('External run already imported') : t('External run imported'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to import external run')));
      },
    },
  );

  const uploadSkillVersionRequest = useRequest(
    async (values: SkillUploadFormValues & { file: File }) => {
      const { file, ...skillValues } = values;
      const uploadId = await uploadAgentGatewayFile(ctx.api, file, 'skill-version');
      const response = await ctx.api.request<SkillUploadResult>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload),
        method: 'post',
        data: { ...skillValues, uploadId },
      });
      return getRequiredResponseData(response, t('Failed to upload skill'));
    },
    {
      manual: true,
      onSuccess(result) {
        const currentSkillVersionIds = getSkillVersionIds(buildTaskForm.getFieldValue('skillVersionIds'));
        buildTaskForm.setFieldValue('skillVersionIds', [
          ...new Set([...currentSkillVersionIds, result.skillVersionId]),
        ]);
        setSkillUploadResult(result);
        setSkillZipFile(null);
        skillUploadForm.resetFields();
        setSkillUploadOpen(false);
        buildRunOptionsRequest.run();
        ctx.message?.success(t('Skill uploaded'));
      },
      onError() {
        ctx.message?.error(t('Failed to upload skill'));
      },
    },
  );

  const openBuildTask = useCallback(() => {
    buildRunOptionsRequest.run();
    buildTaskForm.setFieldsValue({
      cwd: buildTaskForm.getFieldValue('cwd') || defaultCwd,
      runner: buildTaskForm.getFieldValue('runner') || defaultRunner,
    });
    setBuildTaskOpen(true);
  }, [buildRunOptionsRequest, buildTaskForm, defaultCwd, defaultRunner]);

  const closeBuildTask = useCallback(() => setBuildTaskOpen(false), []);

  const openExternalRunImport = useCallback(() => {
    externalRunImportForm.setFieldsValue(DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES);
    setExternalRunLogContent('');
    setExternalRunImportOpen(true);
  }, [externalRunImportForm]);

  const closeExternalRunImport = useCallback(() => {
    setExternalRunImportOpen(false);
    setExternalRunLogContent('');
    externalRunImportForm.resetFields();
  }, [externalRunImportForm]);

  const openSkillUpload = useCallback(() => {
    setSkillZipFile(null);
    setSkillUploadResult(null);
    skillUploadForm.setFieldsValue(DEFAULT_SKILL_UPLOAD_FORM_VALUES);
    setSkillUploadOpen(true);
  }, [skillUploadForm]);

  const closeSkillUpload = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipFile(null);
    setSkillUploadResult(null);
    skillUploadForm.resetFields();
  }, [skillUploadForm]);

  const handleTaskTemplateChange = useCallback(
    (templateId?: string) => {
      const template = findBuildTaskTemplate(buildRunOptionsRequest.data, templateId);
      if (!template) {
        return;
      }
      buildTaskForm.setFieldsValue({
        title: template.defaultTitle || '',
        prompt: template.defaultPrompt || '',
        cwd: template.cwd || defaultCwd || '.',
        skillVersionIds: template.skillVersionIds || [],
        artifactRoot: template.artifactRoot,
        artifactDeclarations: getTaskArtifactFormValues(template.artifacts),
      });
    },
    [buildRunOptionsRequest.data, buildTaskForm, defaultCwd],
  );

  const submitSkillUpload = useCallback(async () => {
    try {
      const values = await skillUploadForm.validateFields();
      if (!skillZipFile) {
        ctx.message?.error(t('Skill ZIP file is required'));
        return;
      }
      uploadSkillVersionRequest.run({ ...values, file: skillZipFile });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to upload skill'));
      }
    }
  }, [ctx.message, skillUploadForm, skillZipFile, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(async (file) => {
    setSkillZipFile(file);
    return false;
  }, []);

  const handleSkillZipRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setSkillZipFile(null);
    return true;
  }, []);

  const handleExternalLogBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      try {
        setExternalRunLogContent(await readFileAsText(file));
      } catch {
        setExternalRunLogContent('');
        ctx.message?.error(t('Failed to read log file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleExternalLogRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setExternalRunLogContent('');
    return true;
  }, []);

  const submitBuildTask = useCallback(async () => {
    try {
      const values = await buildTaskForm.validateFields();
      createBuildTaskRequest.run({ ...buildTaskForm.getFieldsValue(true), ...values });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to create task run'));
      }
    }
  }, [buildTaskForm, createBuildTaskRequest, ctx.message, t]);

  const submitExternalRunImport = useCallback(async () => {
    try {
      const values = await externalRunImportForm.validateFields();
      importExternalRunRequest.run({ ...values, logContent: externalRunLogContent });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to import external run'));
      }
    }
  }, [ctx.message, externalRunImportForm, externalRunLogContent, importExternalRunRequest, t]);

  useEffect(() => {
    if (
      !buildTaskOpen ||
      !shouldUseDefaultBuildRunner(buildRunOptionsRequest.data, buildTaskForm.getFieldValue('runner'), defaultRunner)
    ) {
      return;
    }
    buildTaskForm.setFieldValue('runner', defaultRunner);
  }, [buildRunOptionsRequest.data, buildTaskForm, buildTaskOpen, defaultRunner]);

  useEffect(() => {
    if (!buildTaskOpen || !defaultCwd || buildTaskForm.getFieldValue('cwd')) {
      return;
    }
    buildTaskForm.setFieldValue('cwd', defaultCwd);
  }, [buildTaskForm, buildTaskOpen, defaultCwd]);

  return {
    buildTask: {
      open: buildTaskOpen,
      form: buildTaskForm,
      loading: createBuildTaskRequest.loading,
      optionsLoading: buildRunOptionsRequest.loading,
      hasOnlineRunner,
      runnerOptions,
      skillVersionOptions,
      taskTemplateOptions,
      defaultCwd,
      defaultRunner,
      openDrawer: openBuildTask,
      close: closeBuildTask,
      submit: submitBuildTask,
      handleTaskTemplateChange,
      openSkillUpload,
    },
    externalRunImport: {
      open: externalRunImportOpen,
      form: externalRunImportForm,
      loading: importExternalRunRequest.loading,
      logContent: externalRunLogContent,
      setLogContent: setExternalRunLogContent,
      openDrawer: openExternalRunImport,
      close: closeExternalRunImport,
      submit: submitExternalRunImport,
      beforeUpload: handleExternalLogBeforeUpload,
      onRemove: handleExternalLogRemove,
    },
    skillUpload: {
      open: skillUploadOpen,
      form: skillUploadForm,
      loading: uploadSkillVersionRequest.loading,
      result: skillUploadResult,
      close: closeSkillUpload,
      submit: submitSkillUpload,
      beforeUpload: handleSkillZipBeforeUpload,
      onRemove: handleSkillZipRemove,
    },
  };
}
