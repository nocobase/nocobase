/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscGitRemoteConfigDraft, VscGitRemoteTransport } from '../../shared/vsc-file/public-api';
import { Form, Input } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '../locale';
import LightExtensionCredentialInput, {
  type LightExtensionEnvironmentVariableRecord,
  type LightExtensionCredentialValidation,
} from './LightExtensionSecretVariableInput';

const MAX_GIT_URL_LENGTH = 2048;
const MAX_GIT_BRANCH_LENGTH = 255;
const MAX_GIT_SUBDIRECTORY_LENGTH = 1024;

export interface LightExtensionGitSourceDraft {
  url: string;
  branch: string;
  subdirectory: string;
  authRef: string;
}

export interface LightExtensionGitSourceValue {
  provider: 'git';
  config: VscGitRemoteConfigDraft;
  authRef?: string;
}

export type GitRepositoryUrlResult =
  | { valid: true; url: string; transport: VscGitRemoteTransport }
  | { valid: false; reason: 'required' | 'invalid' };

type GitRepositoryUrlErrorReason = 'required' | 'invalid';

export type GitBranchValidationResult =
  | { valid: true; branch: string }
  | { valid: false; reason: 'required' | 'invalid' };

export type GitSubdirectoryValidationResult = { valid: true; subdirectory: string | null } | { valid: false };

export interface LightExtensionGitSourceFieldsProps {
  value: LightExtensionGitSourceDraft;
  onChange: (value: LightExtensionGitSourceDraft) => void;
  onValidSourceChange?: (source: LightExtensionGitSourceValue | undefined) => void;
  disabled?: boolean;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}

export function createEmptyLightExtensionGitSourceDraft(): LightExtensionGitSourceDraft {
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
  if (value.length > MAX_GIT_URL_LENGTH || value !== input || /[\0\r\n]/u.test(value)) {
    return { valid: false, reason: 'invalid' };
  }

  const scpLikeMatch = /^(?<username>[A-Za-z0-9._-]+)@(?<hostname>[^:/\s]+):(?<path>[^\s]+)$/u.exec(value);
  const candidate = scpLikeMatch?.groups
    ? `ssh://${scpLikeMatch.groups.username}@${scpLikeMatch.groups.hostname}/${scpLikeMatch.groups.path.replace(
        /^\/+/,
        '',
      )}`
    : value;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { valid: false, reason: 'invalid' };
  }

  const transport = url.protocol === 'https:' ? 'https' : url.protocol === 'ssh:' ? 'ssh' : null;
  if (
    !transport ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === '/' ||
    url.search ||
    url.hash ||
    url.password ||
    (transport === 'https' && url.username) ||
    url.pathname.includes('\\')
  ) {
    return { valid: false, reason: 'invalid' };
  }
  return { valid: true, url: url.toString(), transport };
}

export function validateGitBranch(input: string): GitBranchValidationResult {
  const branch = input.trim();
  if (!branch) {
    return { valid: false, reason: 'required' };
  }
  if (
    branch !== input ||
    branch.length > MAX_GIT_BRANCH_LENGTH ||
    branch === '@' ||
    branch === 'HEAD' ||
    branch.startsWith('-') ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.endsWith('.') ||
    branch.startsWith('refs/') ||
    branch.includes('//') ||
    branch.includes('..') ||
    branch.includes('@{') ||
    hasInvalidGitRefCharacter(branch) ||
    branch.split('/').some((segment) => !segment || segment.startsWith('.') || segment.endsWith('.lock'))
  ) {
    return { valid: false, reason: 'invalid' };
  }
  return { valid: true, branch };
}

export function validateGitSubdirectory(input: string): GitSubdirectoryValidationResult {
  const subdirectory = input.trim();
  if (!subdirectory) {
    return { valid: true, subdirectory: null };
  }
  if (
    subdirectory !== input ||
    subdirectory.length > MAX_GIT_SUBDIRECTORY_LENGTH ||
    subdirectory.startsWith('/') ||
    subdirectory.endsWith('/') ||
    subdirectory.includes('\\')
  ) {
    return { valid: false };
  }
  const segments = subdirectory.split('/');
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.toLocaleLowerCase('en-US') === '.git' ||
        segment.includes('\0'),
    )
  ) {
    return { valid: false };
  }
  return { valid: true, subdirectory: segments.join('/') };
}

export function LightExtensionGitSourceFields(props: LightExtensionGitSourceFieldsProps) {
  const { value, onChange, onValidSourceChange, disabled, loadEnvironmentVariables } = props;
  const t = useT();
  const onValidSourceChangeRef = useRef(onValidSourceChange);
  const [urlTouched, setUrlTouched] = useState(false);
  const [branchTouched, setBranchTouched] = useState(false);
  const [subdirectoryTouched, setSubdirectoryTouched] = useState(false);
  const [authValidation, setAuthValidation] = useState<LightExtensionCredentialValidation>(() =>
    value.authRef.trim() ? { valid: false } : { valid: true },
  );
  const urlResult = useMemo(() => parseGitRepositoryUrl(value.url), [value.url]);
  const branchValidation = useMemo(() => validateGitBranch(value.branch), [value.branch]);
  const subdirectoryValidation = useMemo(() => validateGitSubdirectory(value.subdirectory), [value.subdirectory]);

  const validSource = useMemo<LightExtensionGitSourceValue | undefined>(() => {
    if (!urlResult.valid || !branchValidation.valid || !subdirectoryValidation.valid || !authValidation.valid) {
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
      ...(authValidation.authRef ? { authRef: authValidation.authRef } : {}),
    };
  }, [authValidation, branchValidation, subdirectoryValidation, urlResult]);

  useEffect(() => {
    onValidSourceChangeRef.current = onValidSourceChange;
  }, [onValidSourceChange]);

  useEffect(() => {
    onValidSourceChangeRef.current?.(validSource);
  }, [validSource]);

  const updateField = useCallback(
    (field: keyof LightExtensionGitSourceDraft, nextValue: string) => {
      onChange({ ...value, [field]: nextValue });
    },
    [onChange, value],
  );

  const urlError = urlTouched && 'reason' in urlResult ? getRepositoryUrlError(urlResult.reason, t) : undefined;
  const branchError =
    branchTouched && 'reason' in branchValidation
      ? branchValidation.reason === 'required'
        ? t('Git branch is required')
        : t('Git branch is invalid')
      : undefined;
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
          onChange={(event) => updateField('url', event.target.value)}
          placeholder={t('HTTPS or SSH Git repository URL')}
          status={urlError ? 'error' : undefined}
          value={value.url}
        />
      </Form.Item>
      <Form.Item help={branchError} label={t('Branch')} required validateStatus={branchError ? 'error' : undefined}>
        <Input
          aria-label={t('Branch')}
          disabled={disabled}
          onBlur={() => setBranchTouched(true)}
          onChange={(event) => updateField('branch', event.target.value)}
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
          urlResult.valid && urlResult.transport === 'ssh'
            ? t("Optional. Leave blank to use the NocoBase process user's SSH configuration.")
            : t('Optional. Select a Secret variable or enter a token.')
        }
        label={t('Git credential')}
      >
        <LightExtensionCredentialInput
          aria-label={t('Git credential')}
          disabled={disabled}
          loadEnvironmentVariables={loadEnvironmentVariables}
          onChange={(nextValue) => {
            setAuthValidation(nextValue.trim() ? { valid: false } : { valid: true });
            updateField('authRef', nextValue);
          }}
          onValidationChange={setAuthValidation}
          placeholder={t('Select a Secret variable or enter a token')}
          value={value.authRef}
        />
      </Form.Item>
    </div>
  );
}

function getRepositoryUrlError(reason: GitRepositoryUrlErrorReason, t: (key: string) => string): string {
  return reason === 'required' ? t('Git repository URL is required') : t('Git repository URL is invalid');
}

function hasInvalidGitRefCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f || '~^:?*[\\'.includes(character)) {
      return true;
    }
  }
  return false;
}

export default LightExtensionGitSourceFields;
