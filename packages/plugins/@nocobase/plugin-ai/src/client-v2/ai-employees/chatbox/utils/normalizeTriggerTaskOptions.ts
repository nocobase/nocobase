/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIClient } from '@nocobase/client-v2';
import type { AIConfigRepository } from '../../../repositories/AIConfigRepository';
import type { AIEmployee, TriggerTaskOptions } from '../../types';

export type RunJSAIEmployeeTriggerTaskOptions = Omit<TriggerTaskOptions, 'aiEmployee'> & {
  aiEmployee?: string | AIEmployee;
};

export type NormalizeTriggerTaskOptionsContext = {
  aiConfigRepository?: Pick<AIConfigRepository, 'getAIEmployees'> | null;
  apiClient?: Pick<APIClient, 'resource'> | null;
};

type APIListResponse = {
  data?: {
    data?: unknown;
  };
};

type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;

export async function normalizeTriggerTaskOptions(
  options: RunJSAIEmployeeTriggerTaskOptions,
  context?: NormalizeTriggerTaskOptionsContext,
): Promise<TriggerTaskOptions | null> {
  const { aiEmployee } = options;
  if (aiEmployee === undefined || isAIEmployee(aiEmployee)) {
    return options as TriggerTaskOptions;
  }

  const employees = context?.aiConfigRepository ? await context.aiConfigRepository.getAIEmployees() : [];
  let matched = employees.find((employee) => employee.username === aiEmployee);
  if (!matched) {
    matched = (await getAIEmployeesFromAPIClient(context?.apiClient)).find(
      (employee) => employee.username === aiEmployee,
    );
  }
  if (!matched) {
    console.warn(`[plugin-ai] AI employee "${aiEmployee}" was not found or is not accessible to the current user.`);
    return null;
  }

  return {
    ...options,
    aiEmployee: matched,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAPIListResponse(value: unknown): value is APIListResponse {
  return isRecord(value) && (value.data === undefined || isRecord(value.data));
}

function readArrayData(response: unknown): unknown[] {
  if (!isAPIListResponse(response)) {
    return [];
  }
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

function isAIEmployee(value: unknown): value is AIEmployee {
  return isRecord(value) && typeof value.username === 'string';
}

function isResourceAction(value: unknown): value is ResourceAction {
  return typeof value === 'function';
}

async function getAIEmployeesFromAPIClient(apiClient?: Pick<APIClient, 'resource'> | null): Promise<AIEmployee[]> {
  const resource = apiClient?.resource('aiEmployees') as Record<string, unknown> | undefined;
  const listByUser = resource?.listByUser;
  if (!isResourceAction(listByUser)) {
    return [];
  }

  const response = await listByUser();
  return readArrayData(response).filter(isAIEmployee);
}
