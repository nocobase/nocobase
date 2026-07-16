/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { AutoComplete, Input, Spin, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '../locale';

const SECRET_AUTH_REF_PATTERN = /^\{\{ \$env\.([A-Za-z_][A-Za-z0-9_]*) \}\}$/;
const ENVIRONMENT_VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export interface LightExtensionEnvironmentVariableRecord {
  name: string;
  type: string;
}

export interface LightExtensionSecretVariableCandidate {
  name: string;
  authRef: string;
}

export type LightExtensionSecretAuthRefValidation =
  | { valid: true; authRef?: string }
  | { valid: false; reason?: 'invalid-expression' | 'secret-not-found' | 'load-failed' };

interface EnvironmentVariablesApi {
  request(options: { url: string; method: 'get'; params: { paginate: false }; skipNotify: true }): Promise<unknown>;
}

export interface LightExtensionSecretVariableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (validation: LightExtensionSecretAuthRefValidation) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}

export function formatLightExtensionSecretAuthRef(name: string): string {
  return `{{ $env.${name} }}`;
}

export function validateLightExtensionSecretAuthRef(
  value: string | undefined,
  candidates: readonly LightExtensionSecretVariableCandidate[],
): LightExtensionSecretAuthRefValidation {
  if (!value?.trim()) {
    return { valid: true };
  }

  const match = SECRET_AUTH_REF_PATTERN.exec(value);
  if (!match) {
    return { valid: false, reason: 'invalid-expression' };
  }

  if (!candidates.some((candidate) => candidate.name === match[1] && candidate.authRef === value)) {
    return { valid: false, reason: 'secret-not-found' };
  }

  return { valid: true, authRef: value };
}

export async function fetchLightExtensionSecretVariables(
  api: EnvironmentVariablesApi,
): Promise<LightExtensionEnvironmentVariableRecord[]> {
  const response = await api.request({
    url: 'environmentVariables',
    method: 'get',
    params: { paginate: false },
    skipNotify: true,
  });
  const data = isRecord(response) && isRecord(response.data) ? response.data.data : undefined;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isEnvironmentVariableRecord);
}

export function LightExtensionSecretVariableInput(props: LightExtensionSecretVariableInputProps) {
  const {
    value,
    onChange,
    onValidationChange,
    disabled,
    placeholder,
    loadEnvironmentVariables,
    'aria-label': ariaLabel,
  } = props;
  const ctx = useFlowContext();
  const t = useT();
  const onValidationChangeRef = useRef(onValidationChange);
  const [records, setRecords] = useState<LightExtensionEnvironmentVariableRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let active = true;

    const loadCandidates = async () => {
      setLoadState('loading');
      try {
        const nextRecords = loadEnvironmentVariables
          ? await loadEnvironmentVariables()
          : await fetchLightExtensionSecretVariables(ctx.api);
        if (active) {
          setRecords(nextRecords);
          setLoadState('ready');
        }
      } catch {
        if (active) {
          setRecords([]);
          setLoadState('failed');
        }
      }
    };

    loadCandidates();
    return () => {
      active = false;
    };
  }, [ctx.api, loadEnvironmentVariables]);

  const candidates = useMemo<LightExtensionSecretVariableCandidate[]>(
    () =>
      records
        .filter((record) => record.type === 'secret' && ENVIRONMENT_VARIABLE_NAME_PATTERN.test(record.name))
        .map((record) => ({ name: record.name, authRef: formatLightExtensionSecretAuthRef(record.name) })),
    [records],
  );

  const validation = useMemo<LightExtensionSecretAuthRefValidation>(() => {
    if (!value?.trim()) {
      return { valid: true };
    }
    if (loadState === 'loading') {
      return { valid: false };
    }
    if (loadState === 'failed') {
      return { valid: false, reason: 'load-failed' };
    }
    return validateLightExtensionSecretAuthRef(value, candidates);
  }, [candidates, loadState, value]);

  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  useEffect(() => {
    onValidationChangeRef.current?.(validation);
  }, [validation]);

  const errorMessage = getValidationMessage(validation, t);
  const options = useMemo(
    () => candidates.map((candidate) => ({ label: candidate.name, value: candidate.authRef })),
    [candidates],
  );

  return (
    <div>
      <AutoComplete
        allowClear
        disabled={disabled}
        filterOption={(inputValue, option) =>
          String(option?.label || '')
            .toLowerCase()
            .includes(inputValue.toLowerCase())
        }
        notFoundContent={loadState === 'loading' ? <Spin size="small" /> : null}
        onChange={(nextValue) => onChange?.(nextValue)}
        options={options}
        value={value || ''}
      >
        <Input
          aria-label={ariaLabel || t('Token secret')}
          disabled={disabled}
          placeholder={placeholder || t('Select a secret variable')}
          status={errorMessage ? 'error' : undefined}
        />
      </AutoComplete>
      {errorMessage ? (
        <Typography.Text role="alert" type="danger">
          {errorMessage}
        </Typography.Text>
      ) : null}
    </div>
  );
}

function getValidationMessage(
  validation: LightExtensionSecretAuthRefValidation,
  t: (key: string) => string,
): string | undefined {
  if (validation.valid || !validation.reason) {
    return undefined;
  }
  if (validation.reason === 'invalid-expression') {
    return t('Token secret must be a complete environment variable expression');
  }
  if (validation.reason === 'secret-not-found') {
    return t('Token secret must reference an existing secret variable');
  }
  return t('Failed to load secret variables');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isEnvironmentVariableRecord(value: unknown): value is LightExtensionEnvironmentVariableRecord {
  return isRecord(value) && typeof value.name === 'string' && typeof value.type === 'string';
}

export default LightExtensionSecretVariableInput;
