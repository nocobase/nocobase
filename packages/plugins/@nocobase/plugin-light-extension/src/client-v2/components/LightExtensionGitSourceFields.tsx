/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscGitHubRemoteConfig } from '@nocobase/plugin-vsc-file';
import { Form, Input } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '../locale';
import LightExtensionCredentialInput, {
  type LightExtensionEnvironmentVariableRecord,
  type LightExtensionCredentialValidation,
} from './LightExtensionSecretVariableInput';

const GITHUB_OWNER_PATTERN = /^(?!-)(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const GITHUB_REPOSITORY_PATTERN = /^[A-Za-z0-9._-]+$/;
const MAX_GITHUB_OWNER_LENGTH = 39;
const MAX_GITHUB_REPOSITORY_LENGTH = 100;
const MAX_GITHUB_BRANCH_LENGTH = 255;
const MAX_GITHUB_SUBDIRECTORY_LENGTH = 1024;

export interface LightExtensionGitSourceDraft {
  repositoryLocator: string;
  branch: string;
  subdirectory: string;
  authRef: string;
}

export interface LightExtensionGitHubSourceValue {
  provider: 'github';
  config: VscGitHubRemoteConfig;
  authRef?: string;
}

export type GitHubRepositoryLocatorResult =
  | { valid: true; owner: string; repository: string }
  | { valid: false; reason: 'required' | 'invalid' };

type GitHubRepositoryLocatorErrorReason = 'required' | 'invalid';

export type GitHubBranchValidationResult = { valid: true; branch: string } | { valid: false };

export type GitHubSubdirectoryValidationResult = { valid: true; subdirectory: string | null } | { valid: false };

export interface LightExtensionGitSourceFieldsProps {
  value: LightExtensionGitSourceDraft;
  onChange: (value: LightExtensionGitSourceDraft) => void;
  onValidSourceChange?: (source: LightExtensionGitHubSourceValue | undefined) => void;
  disabled?: boolean;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}

export function createEmptyLightExtensionGitSourceDraft(): LightExtensionGitSourceDraft {
  return {
    repositoryLocator: '',
    branch: '',
    subdirectory: '',
    authRef: '',
  };
}

export function parseGitHubRepositoryLocator(input: string): GitHubRepositoryLocatorResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, reason: 'required' };
  }

  let path = trimmed;
  if (trimmed.startsWith('https://')) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { valid: false, reason: 'invalid' };
    }
    if (
      url.protocol !== 'https:' ||
      url.hostname.toLowerCase() !== 'github.com' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    ) {
      return { valid: false, reason: 'invalid' };
    }
    path = url.pathname.replace(/^\//, '').replace(/\/$/, '');
  }

  const segments = path.split('/');
  if (segments.length !== 2) {
    return { valid: false, reason: 'invalid' };
  }

  const owner = segments[0];
  const repository = segments[1].endsWith('.git') ? segments[1].slice(0, -4) : segments[1];
  if (
    owner.length > MAX_GITHUB_OWNER_LENGTH ||
    repository.length > MAX_GITHUB_REPOSITORY_LENGTH ||
    !GITHUB_OWNER_PATTERN.test(owner) ||
    !GITHUB_REPOSITORY_PATTERN.test(repository) ||
    repository === '.' ||
    repository === '..'
  ) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true, owner, repository };
}

export function validateGitHubBranch(input: string): GitHubBranchValidationResult {
  const branch = input.trim();
  if (!branch) {
    return { valid: true, branch: '' };
  }
  if (
    branch.length > MAX_GITHUB_BRANCH_LENGTH ||
    branch === '@' ||
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
    return { valid: false };
  }
  return { valid: true, branch };
}

export function validateGitHubSubdirectory(input: string): GitHubSubdirectoryValidationResult {
  const subdirectory = input.trim();
  if (!subdirectory) {
    return { valid: true, subdirectory: null };
  }
  if (
    subdirectory.length > MAX_GITHUB_SUBDIRECTORY_LENGTH ||
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
  const [repositoryTouched, setRepositoryTouched] = useState(false);
  const [branchTouched, setBranchTouched] = useState(false);
  const [subdirectoryTouched, setSubdirectoryTouched] = useState(false);
  const [authValidation, setAuthValidation] = useState<LightExtensionCredentialValidation>(() =>
    value.authRef.trim() ? { valid: false } : { valid: true },
  );
  const locator = useMemo(() => parseGitHubRepositoryLocator(value.repositoryLocator), [value.repositoryLocator]);
  const branchValidation = useMemo(() => validateGitHubBranch(value.branch), [value.branch]);
  const subdirectoryValidation = useMemo(() => validateGitHubSubdirectory(value.subdirectory), [value.subdirectory]);

  const validSource = useMemo<LightExtensionGitHubSourceValue | undefined>(() => {
    if (!locator.valid || !branchValidation.valid || !subdirectoryValidation.valid || !authValidation.valid) {
      return undefined;
    }

    return {
      provider: 'github',
      config: {
        owner: locator.owner,
        repository: locator.repository,
        branch: branchValidation.branch,
        subdirectory: subdirectoryValidation.subdirectory,
      },
      ...(authValidation.authRef ? { authRef: authValidation.authRef } : {}),
    };
  }, [authValidation, branchValidation, locator, subdirectoryValidation]);

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

  const handleAuthValidationChange = useCallback((validation: LightExtensionCredentialValidation) => {
    setAuthValidation(validation);
  }, []);

  const repositoryError = repositoryTouched && 'reason' in locator ? getRepositoryError(locator.reason, t) : undefined;
  const branchError = branchTouched && !branchValidation.valid ? t('GitHub branch is invalid') : undefined;
  const subdirectoryError =
    subdirectoryTouched && !subdirectoryValidation.valid ? t('GitHub subdirectory is invalid') : undefined;

  return (
    <div>
      <Form.Item
        help={repositoryError}
        label={t('GitHub repository')}
        required
        validateStatus={repositoryError ? 'error' : undefined}
      >
        <Input
          aria-label={t('GitHub repository')}
          disabled={disabled}
          onBlur={() => setRepositoryTouched(true)}
          onChange={(event) => updateField('repositoryLocator', event.target.value)}
          placeholder={t('owner/repository or GitHub URL')}
          status={repositoryError ? 'error' : undefined}
          value={value.repositoryLocator}
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
        extra={t('Optional for public repositories. Choose a secret variable or enter a token directly.')}
        label={t('GitHub token')}
      >
        <LightExtensionCredentialInput
          aria-label={t('GitHub token')}
          disabled={disabled}
          loadEnvironmentVariables={loadEnvironmentVariables}
          onChange={(nextValue) => {
            setAuthValidation(nextValue.trim() ? { valid: false } : { valid: true });
            updateField('authRef', nextValue);
          }}
          onValidationChange={handleAuthValidationChange}
          placeholder={t('Select a secret variable or enter a GitHub token')}
          value={value.authRef}
        />
      </Form.Item>
    </div>
  );
}

function getRepositoryError(reason: GitHubRepositoryLocatorErrorReason, t: (key: string) => string): string {
  return reason === 'required' ? t('GitHub repository is required') : t('GitHub repository locator is invalid');
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
