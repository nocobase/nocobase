/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useCallback, useEffect, useState } from 'react';

import { AGENT_GATEWAY_API_ACTIONS } from '../../../../shared/apiContract';
import {
  getApiErrorMessage,
  getRequiredResponseData,
  requestAgentGatewayAction,
} from '../../../pages/AgentGatewayPageUtils';
import {
  getSkillVersionIdFromLocationSearch,
  getTaskTemplateIdFromLocationSearch,
  pushSkillVersionIdInLocationSearch,
  pushTaskTemplateIdInLocationSearch,
  replaceSkillVersionIdInLocationSearch,
  replaceTaskTemplateIdInLocationSearch,
} from '../../../pages/runs/runLocation';
import type {
  AgentGatewayPageContext,
  SkillVersionDetailRecord,
  TFunction,
  TaskTemplateDetailRecord,
} from '../../../pages/runs/types';

interface UseRelatedRunDetailsOptions {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  initialTaskTemplateId?: string;
  initialSkillVersionId?: string;
}

export function useRelatedRunDetails({
  ctx,
  t,
  initialTaskTemplateId,
  initialSkillVersionId,
}: UseRelatedRunDetailsOptions) {
  const [taskTemplateOpen, setTaskTemplateOpen] = useState(Boolean(initialTaskTemplateId));
  const [taskTemplateId, setTaskTemplateId] = useState<string | undefined>(initialTaskTemplateId);
  const [taskTemplateError, setTaskTemplateError] = useState<string>();
  const [skillOpen, setSkillOpen] = useState(Boolean(initialSkillVersionId));
  const [skillVersionId, setSkillVersionId] = useState<string | undefined>(initialSkillVersionId);
  const [skillError, setSkillError] = useState<string>();

  const taskTemplateRequest = useRequest(
    async () => {
      if (!taskTemplateId || !taskTemplateOpen) {
        return null;
      }
      const response = await requestAgentGatewayAction<TaskTemplateDetailRecord>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getTaskTemplate,
        {
          method: 'get',
          targetKey: taskTemplateId,
        },
      );
      return getRequiredResponseData(response, t('Failed to load task template detail'));
    },
    {
      refreshDeps: [taskTemplateId, taskTemplateOpen],
      onSuccess() {
        setTaskTemplateError(undefined);
      },
      onError(error) {
        const message = getApiErrorMessage(error, t('Failed to load task template detail'));
        setTaskTemplateError(message);
        ctx.message?.error(message);
      },
    },
  );

  const skillRequest = useRequest(
    async () => {
      if (!skillVersionId || !skillOpen) {
        return null;
      }
      const response = await requestAgentGatewayAction<SkillVersionDetailRecord>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getSkillVersion,
        {
          method: 'get',
          targetKey: skillVersionId,
        },
      );
      return getRequiredResponseData(response, t('Failed to load skill detail'));
    },
    {
      refreshDeps: [skillVersionId, skillOpen],
      onSuccess() {
        setSkillError(undefined);
      },
      onError(error) {
        const message = getApiErrorMessage(error, t('Failed to load skill detail'));
        setSkillError(message);
        ctx.message?.error(message);
      },
    },
  );

  const syncFromLocation = useCallback(() => {
    const nextTaskTemplateId = getTaskTemplateIdFromLocationSearch();
    const nextSkillVersionId = nextTaskTemplateId ? undefined : getSkillVersionIdFromLocationSearch();
    setTaskTemplateId(nextTaskTemplateId);
    setTaskTemplateOpen(Boolean(nextTaskTemplateId));
    setTaskTemplateError(undefined);
    setSkillVersionId(nextSkillVersionId);
    setSkillOpen(Boolean(nextSkillVersionId));
    setSkillError(undefined);
  }, []);

  const openTaskTemplate = useCallback((templateId: string) => {
    setTaskTemplateId(templateId);
    setTaskTemplateError(undefined);
    setTaskTemplateOpen(true);
    setSkillVersionId(undefined);
    setSkillError(undefined);
    setSkillOpen(false);
    pushTaskTemplateIdInLocationSearch(templateId);
  }, []);

  const closeTaskTemplate = useCallback(() => {
    setTaskTemplateOpen(false);
    setTaskTemplateId(undefined);
    setTaskTemplateError(undefined);
    replaceTaskTemplateIdInLocationSearch();
  }, []);

  const openSkill = useCallback((nextSkillVersionId: string) => {
    setSkillVersionId(nextSkillVersionId);
    setSkillError(undefined);
    setSkillOpen(true);
    setTaskTemplateId(undefined);
    setTaskTemplateError(undefined);
    setTaskTemplateOpen(false);
    pushSkillVersionIdInLocationSearch(nextSkillVersionId);
  }, []);

  const closeSkill = useCallback(() => {
    setSkillOpen(false);
    setSkillVersionId(undefined);
    setSkillError(undefined);
    replaceSkillVersionIdInLocationSearch();
  }, []);

  useEffect(() => {
    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [syncFromLocation]);

  return {
    taskTemplate: {
      open: taskTemplateOpen,
      selectedId: taskTemplateId,
      error: taskTemplateError,
      request: taskTemplateRequest,
      openDetails: openTaskTemplate,
      close: closeTaskTemplate,
    },
    skill: {
      open: skillOpen,
      selectedId: skillVersionId,
      error: skillError,
      request: skillRequest,
      openDetails: openSkill,
      close: closeSkill,
    },
  };
}
