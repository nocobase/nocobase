/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscGitRemoteConfigDraft, VscGitRemoteTransport } from '../../shared/vsc-file/remote-sync-types';
import {
  normalizeGitRepositoryUrlSyntax,
  validateGitBranchSyntax,
  validateGitSubdirectorySyntax,
} from '../../shared/vsc-file/git-config-validation';
import { Form, Input } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '../locale';
import JsTemplateCredentialInput, {
  type JsTemplateEnvironmentVariableRecord,
  type JsTemplateCredentialValidation,
} from './JsTemplateSecretVariableInput';

export interface JsTemplateGitSourceDraft {
  url: string;
  branch: string;
  subdirectory: string;
  authRef: string;
}

export interface JsTemplateGitSourceValue {
  provider: 'git';
  config: VscGitRemoteConfigDraft;
  authRef: string | null;
}

export type GitRepositoryUrlResult =
  | { valid: true; url: string; transport: VscGitRemoteTransport }
  | { valid: false; reason: 'required' | 'invalid' };

type GitRepositoryUrlErrorReason = 'required' | 'invalid';

export type GitBranchValidationResult = { valid: true; branch: string | null } | { valid: false; reason: 'invalid' };

export type GitSubdirectoryValidationResult = { valid: true; subdirectory: string | null } | { valid: false };

export interface JsTemplateGitSourceFieldsProps {
  value: JsTemplateGitSourceDraft;
  onChange: (value: JsTemplateGitSourceDraft) => void;
  onValidSourceChange?: (source: JsTemplateGitSourceValue | undefined) => void;
  disabled?: boolean;
  loadEnvironmentVariables?: () => Promise<JsTemplateEnvironmentVariableRecord[]>;
}

export function createEmptyJsTemplateGitSourceDraft(): JsTemplateGitSourceDraft {
  return {
    url: '',
    branch: '',
    subdirectory: '',
    authRef: '',
  };
}

export function parseGitRepositoryUrl(input: string): GitRepositoryUrlResult {
  const value = input.trim();
  if (!value) {
    return { valid: false, reason: 'required' };
  }
  if (value !== input) {
    return { valid: false, reason: 'invalid' };
  }
  const result = normalizeGitRepositoryUrlSyntax(value);
  if (!result.valid) {
    return { valid: false, reason: 'invalid' };
  }
  return result;
}

export function validateGitBranch(input: string): GitBranchValidationResult {
  if (input === '') {
    return { valid: true, branch: null };
  }
  const result = validateGitBranchSyntax(input);
  if (!result.valid) {
    return { valid: false, reason: 'invalid' };
  }
  return result;
}

export function validateGitSubdirectory(input: string): GitSubdirectoryValidationResult {
  if (input === '') {
    return { valid: true, subdirectory: null };
  }
  const result = validateGitSubdirectorySyntax(input);
  if (!result.valid) {
    return { valid: false };
  }
  return result;
}

export function JsTemplateGitSourceFields(props: JsTemplateGitSourceFieldsProps) {
  const { value, onChange, onValidSourceChange, disabled, loadEnvironmentVariables } = props;
  const t = useT();
  const onValidSourceChangeRef = useRef(onValidSourceChange);
  const [urlTouched, setUrlTouched] = useState(false);
  const [branchTouched, setBranchTouched] = useState(false);
  const [subdirectoryTouched, setSubdirectoryTouched] = useState(false);
  const [authValidation, setAuthValidation] = useState<JsTemplateCredentialValidation>(() =>
    value.authRef.trim() ? { valid: false } : { valid: true },
  );
  const urlResult = useMemo(() => parseGitRepositoryUrl(value.url), [value.url]);
  const branchValidation = useMemo(() => validateGitBranch(value.branch), [value.branch]);
  const subdirectoryValidation = useMemo(() => validateGitSubdirectory(value.subdirectory), [value.subdirectory]);

  const validSource = useMemo<JsTemplateGitSourceValue | undefined>(() => {
    if (
      !urlResult.valid ||
      !branchValidation.valid ||
      !subdirectoryValidation.valid ||
      !authValidation.valid ||
      (urlResult.transport === 'http' && Boolean(authValidation.authRef))
    ) {
      return undefined;
    }

    return {
      provider: 'git',
      config: {
        url: urlResult.url,
        branch: branchValidation.branch,
        subdirectory: subdirectoryValidation.subdirectory,
        transport: urlResult.transport,
      },
      authRef: authValidation.authRef || null,
    };
  }, [authValidation, branchValidation, subdirectoryValidation, urlResult]);

  useEffect(() => {
    onValidSourceChangeRef.current = onValidSourceChange;
  }, [onValidSourceChange]);

  useEffect(() => {
    onValidSourceChangeRef.current?.(validSource);
  }, [validSource]);

  const updateField = useCallback(
    (field: keyof JsTemplateGitSourceDraft, nextValue: string) => {
      onChange({ ...value, [field]: nextValue });
    },
    [onChange, value],
  );

  const updateUrl = useCallback(
    (nextUrl: string) => {
      const parsed = parseGitRepositoryUrl(nextUrl);
      if (parsed.valid && parsed.transport === 'http' && value.authRef) {
        setAuthValidation({ valid: true });
        onChange({ ...value, url: nextUrl, authRef: '' });
        return;
      }
      updateField('url', nextUrl);
    },
    [onChange, updateField, value],
  );

  const urlError = urlTouched && 'reason' in urlResult ? getRepositoryUrlError(urlResult.reason, t) : undefined;
  const branchError = branchTouched && 'reason' in branchValidation ? t('Git branch is invalid') : undefined;
  const subdirectoryError =
    subdirectoryTouched && !subdirectoryValidation.valid ? t('Git subdirectory is invalid') : undefined;

  return (
    <div>
      <Form.Item
        help={urlError}
        label={t('Git repository URL')}
        required
        validateStatus={urlError ? 'error' : undefined}
      >
        <Input
          aria-label={t('Git repository URL')}
          disabled={disabled}
          onBlur={() => setUrlTouched(true)}
          onChange={(event) => updateUrl(event.target.value)}
          placeholder={t('HTTP or HTTPS Git repository URL')}
          status={urlError ? 'error' : undefined}
          value={value.url}
        />
      </Form.Item>
      <Form.Item
        extra={t('Leave blank to use the default branch')}
        help={branchError}
        label={t('Branch')}
        validateStatus={branchError ? 'error' : undefined}
      >
        <Input
          aria-label={t('Branch')}
          disabled={disabled}
          onBlur={() => setBranchTouched(true)}
          onChange={(event) => updateField('branch', event.target.value)}
          placeholder={t('Leave blank to use the default branch')}
          status={branchError ? 'error' : undefined}
          value={value.branch}
        />
      </Form.Item>
      <Form.Item
        help={subdirectoryError}
        label={t('Subdirectory')}
        validateStatus={subdirectoryError ? 'error' : undefined}
      >
        <Input
          aria-label={t('Subdirectory')}
          disabled={disabled}
          onBlur={() => setSubdirectoryTouched(true)}
          onChange={(event) => updateField('subdirectory', event.target.value)}
          placeholder={t('Optional repository subdirectory')}
          status={subdirectoryError ? 'error' : undefined}
          value={value.subdirectory}
        />
      </Form.Item>
      <Form.Item
        extra={
          urlResult.valid && urlResult.transport === 'http'
            ? t('HTTP repositories must be public and cannot use credentials.')
            : t('Optional for public repositories. Choose a Secret variable.')
        }
        label={t('Git credential')}
      >
        <JsTemplateCredentialInput
          aria-label={t('Git credential')}
          disabled={disabled || (urlResult.valid && urlResult.transport === 'http')}
          loadEnvironmentVariables={loadEnvironmentVariables}
          onChange={(nextValue) => {
            setAuthValidation(nextValue.trim() ? { valid: false } : { valid: true });
            updateField('authRef', nextValue);
          }}
          onValidationChange={setAuthValidation}
          placeholder={t('Select a Secret variable')}
          value={value.authRef}
        />
      </Form.Item>
    </div>
  );
}

function getRepositoryUrlError(reason: GitRepositoryUrlErrorReason, t: (key: string) => string): string {
  return reason === 'required' ? t('Git repository URL is required') : t('Git repository URL is invalid');
}

export default JsTemplateGitSourceFields;
