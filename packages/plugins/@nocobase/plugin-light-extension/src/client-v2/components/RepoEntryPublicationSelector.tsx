/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Select, Space, Spin } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useFlowContext } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../constants';
import type {
  LightExtensionPublicationMetadataRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntryRecord,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  listLightExtensionEntryPublications,
  listSelectableLightExtensionEntries,
} from '../api/lightExtensionEntriesRequests';

export interface RepoEntryPublicationSelectorProps {
  value?: LightExtensionRuntimeSourceBinding | null;
  onChange?: (
    binding: LightExtensionRuntimeSourceBinding,
    publication: LightExtensionPublicationMetadataRecord,
    defaults: Record<string, unknown>,
  ) => void;
  onClear?: () => void;
  disabled?: boolean;
}

type FlowContextWithApi = {
  api: ApiClientLike;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLightExtensionJSBlockBinding(value: unknown): value is LightExtensionRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    value.kind === 'js-block' &&
    typeof value.publicationId === 'string' &&
    value.publicationId.trim().length > 0 &&
    value.versionPolicy === 'pinned'
  );
}

function cloneDefaults(publication: LightExtensionPublicationMetadataRecord): Record<string, unknown> {
  if (!isRecord(publication.settingsDefaultsSnapshot)) {
    return {};
  }
  return JSON.parse(JSON.stringify(publication.settingsDefaultsSnapshot)) as Record<string, unknown>;
}

function getEntryLabel(entry: LightExtensionSelectableEntryRecord): string {
  return entry.title || entry.entryName || entry.id;
}

function toBinding(
  entry: LightExtensionSelectableEntryRecord,
  publication: LightExtensionPublicationMetadataRecord,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: entry.repoId,
    entryId: entry.id,
    kind: 'js-block',
    publicationId: publication.id,
    versionPolicy: 'pinned',
  };
}

export const RepoEntryPublicationSelector: React.FC<RepoEntryPublicationSelectorProps> = ({
  value,
  onChange,
  onClear,
  disabled,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const ctx = useFlowContext<FlowContextWithApi>();
  const latestValueRef = React.useRef(value);
  const onClearRef = React.useRef(onClear);
  const lastClearedBindingRef = React.useRef<string | null>(null);
  const lastEmittedBindingRef = React.useRef<string | null>(null);
  const hadControlledValueRef = React.useRef(Boolean(value?.entryId));
  const autoSelectionBlockedRef = React.useRef(false);
  const keepSelectionOnControlledClearRef = React.useRef(false);
  const [entries, setEntries] = React.useState<LightExtensionSelectableEntryRecord[]>([]);
  const [publications, setPublications] = React.useState<LightExtensionPublicationMetadataRecord[]>([]);
  const [repoId, setRepoId] = React.useState<string | undefined>(value?.repoId);
  const [entryId, setEntryId] = React.useState<string | undefined>(value?.entryId);
  const [publicationId, setPublicationId] = React.useState<string | undefined>(value?.publicationId);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const valueRepoId = value?.repoId;
  const valueEntryId = value?.entryId;
  const valuePublicationId = value?.publicationId;

  const jsBlockEntries = React.useMemo(() => entries.filter((entry) => entry.kind === 'js-block'), [entries]);
  const repoIds = React.useMemo(
    () => Array.from(new Set(jsBlockEntries.map((entry) => entry.repoId))),
    [jsBlockEntries],
  );
  const entriesInRepo = React.useMemo(
    () => jsBlockEntries.filter((entry) => !repoId || entry.repoId === repoId),
    [jsBlockEntries, repoId],
  );
  const selectedEntry = React.useMemo(
    () => jsBlockEntries.find((entry) => entry.id === entryId) || null,
    [entryId, jsBlockEntries],
  );
  const selectedPublication = React.useMemo(
    () =>
      publications.find((publication) => publication.id === publicationId && publication.entryId === entryId) || null,
    [entryId, publicationId, publications],
  );

  React.useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  const notifyClear = React.useCallback((binding?: LightExtensionRuntimeSourceBinding | null) => {
    const bindingKey = binding ? getBindingKey(binding) : null;
    if (bindingKey && lastClearedBindingRef.current === bindingKey) {
      return;
    }
    lastClearedBindingRef.current = bindingKey;
    lastEmittedBindingRef.current = null;
    onClearRef.current?.();
  }, []);

  const clearInvalidControlledBinding = React.useCallback(
    (binding: LightExtensionRuntimeSourceBinding) => {
      autoSelectionBlockedRef.current = true;
      setPublications([]);
      setRepoId(undefined);
      setEntryId(undefined);
      setPublicationId(undefined);
      notifyClear(binding);
    },
    [notifyClear],
  );

  const clearPublicationSelection = React.useCallback(() => {
    setPublications([]);
    setPublicationId(undefined);
    keepSelectionOnControlledClearRef.current = Boolean(latestValueRef.current?.entryId);
    notifyClear(latestValueRef.current);
  }, [notifyClear]);

  React.useEffect(() => {
    if (value && !isLightExtensionJSBlockBinding(value)) {
      hadControlledValueRef.current = false;
      clearInvalidControlledBinding(value);
      return;
    }
    if (!valueEntryId) {
      if (hadControlledValueRef.current) {
        hadControlledValueRef.current = false;
        if (keepSelectionOnControlledClearRef.current) {
          keepSelectionOnControlledClearRef.current = false;
          return;
        }
        autoSelectionBlockedRef.current = true;
        setPublications([]);
        setRepoId(undefined);
        setEntryId(undefined);
        setPublicationId(undefined);
      }
      return;
    }
    hadControlledValueRef.current = true;
    autoSelectionBlockedRef.current = false;
    lastClearedBindingRef.current = null;
    setRepoId(valueRepoId);
    setEntryId(valueEntryId);
    setPublicationId(valuePublicationId);
  }, [clearInvalidControlledBinding, value, valueEntryId, valuePublicationId, valueRepoId]);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const loadEntries = async () => {
      try {
        const nextEntries = await listSelectableLightExtensionEntries(ctx.api);
        if (!mounted) {
          return;
        }
        const filtered = nextEntries.filter((entry) => entry.kind === 'js-block');
        setEntries(filtered);
        const currentValue = latestValueRef.current;
        if (currentValue && !isLightExtensionJSBlockBinding(currentValue)) {
          clearInvalidControlledBinding(currentValue);
          return;
        }
        const entryFromValue = currentValue?.entryId
          ? filtered.find(
              (entry) =>
                entry.id === currentValue.entryId && (!currentValue.repoId || entry.repoId === currentValue.repoId),
            )
          : null;
        if (currentValue?.entryId && !entryFromValue) {
          clearInvalidControlledBinding(currentValue);
          return;
        }
        if (!currentValue?.entryId && autoSelectionBlockedRef.current) {
          setRepoId(undefined);
          setEntryId(undefined);
          return;
        }
        const nextEntry = entryFromValue || filtered.find((entry) => entry.activePublicationId) || filtered[0];
        setRepoId(nextEntry?.repoId);
        setEntryId(nextEntry?.id);
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setError(getErrorMessage(requestError) || t('Failed to load entries'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadEntries();
    return () => {
      mounted = false;
    };
  }, [clearInvalidControlledBinding, ctx.api, t]);

  React.useEffect(() => {
    if (value && !isLightExtensionJSBlockBinding(value)) {
      clearInvalidControlledBinding(value);
      return;
    }
    if (!value?.entryId || jsBlockEntries.length === 0) {
      return;
    }
    const entryFromValue = jsBlockEntries.find(
      (entry) => entry.id === value.entryId && (!value.repoId || entry.repoId === value.repoId),
    );
    if (!entryFromValue) {
      clearInvalidControlledBinding(value);
      return;
    }
    if (repoId !== entryFromValue.repoId) {
      setRepoId(entryFromValue.repoId);
    }
    if (entryId !== entryFromValue.id) {
      setEntryId(entryFromValue.id);
    }
  }, [clearInvalidControlledBinding, entryId, jsBlockEntries, repoId, value]);

  React.useEffect(() => {
    setPublications([]);
    setPublicationId(undefined);
    if (!entryId) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    const loadPublications = async () => {
      try {
        const result = await listLightExtensionEntryPublications(ctx.api, entryId);
        if (!mounted) {
          return;
        }
        const nextPublications = result.publications || [];
        setPublications(nextPublications);
        const currentValue = latestValueRef.current;
        if (currentValue && !isLightExtensionJSBlockBinding(currentValue)) {
          clearInvalidControlledBinding(currentValue);
          return;
        }
        const publicationFromValue =
          currentValue?.entryId === entryId && currentValue.publicationId
            ? nextPublications.find(
                (publication) =>
                  publication.id === currentValue.publicationId &&
                  publication.entryId === entryId &&
                  (!currentValue.repoId || publication.repoId === currentValue.repoId),
              )
            : null;
        if (currentValue?.entryId === entryId && currentValue.publicationId && !publicationFromValue) {
          clearInvalidControlledBinding(currentValue);
          return;
        }
        if (!currentValue?.entryId && autoSelectionBlockedRef.current) {
          setPublicationId(undefined);
          return;
        }
        const activePublication = result.activePublicationId
          ? nextPublications.find((publication) => publication.id === result.activePublicationId)
          : null;
        setPublicationId((publicationFromValue || activePublication || nextPublications[0])?.id);
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setError(getErrorMessage(requestError) || t('Failed to load publications'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadPublications();

    return () => {
      mounted = false;
    };
  }, [clearInvalidControlledBinding, ctx.api, entryId, t]);

  React.useEffect(() => {
    if (value && !isLightExtensionJSBlockBinding(value)) {
      clearInvalidControlledBinding(value);
      return;
    }
    if (!value?.entryId || !value.publicationId || value.entryId !== entryId || publications.length === 0) {
      return;
    }
    const publicationFromValue = publications.find(
      (publication) =>
        publication.id === value.publicationId &&
        publication.entryId === value.entryId &&
        (!value.repoId || publication.repoId === value.repoId),
    );
    if (publicationFromValue) {
      if (publicationId !== publicationFromValue.id) {
        setPublicationId(publicationFromValue.id);
      }
      return;
    }
    clearInvalidControlledBinding(value);
  }, [clearInvalidControlledBinding, entryId, publicationId, publications, value]);

  React.useEffect(() => {
    if (!selectedEntry || !selectedPublication) {
      return;
    }
    if (!valueEntryId && autoSelectionBlockedRef.current) {
      return;
    }
    if (
      selectedPublication.entryId !== selectedEntry.id ||
      selectedPublication.repoId !== selectedEntry.repoId ||
      selectedPublication.kind !== selectedEntry.kind
    ) {
      return;
    }
    const binding = toBinding(selectedEntry, selectedPublication);
    const bindingKey = getBindingKey(binding);
    if (lastEmittedBindingRef.current === bindingKey) {
      return;
    }
    lastEmittedBindingRef.current = bindingKey;
    onChange?.(binding, selectedPublication, cloneDefaults(selectedPublication));
  }, [onChange, selectedEntry, selectedPublication, valueEntryId]);

  const handleRepoChange = (nextRepoId: string) => {
    autoSelectionBlockedRef.current = false;
    clearPublicationSelection();
    setRepoId(nextRepoId);
    const nextEntry = jsBlockEntries.find((entry) => entry.repoId === nextRepoId);
    setEntryId(nextEntry?.id);
  };

  const handleEntryChange = (nextEntryId: string) => {
    autoSelectionBlockedRef.current = false;
    clearPublicationSelection();
    const nextEntry = jsBlockEntries.find((entry) => entry.id === nextEntryId);
    setRepoId(nextEntry?.repoId);
    setEntryId(nextEntryId);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {loading ? <Spin size="small" /> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <Select
        aria-label={t('Repository')}
        disabled={disabled || loading}
        placeholder={t('Repository')}
        value={repoId}
        options={repoIds.map((id) => ({ label: id, value: id }))}
        onChange={handleRepoChange}
      />
      <Select
        aria-label={t('Entry')}
        disabled={disabled || loading}
        placeholder={t('Entry')}
        value={entryId}
        options={entriesInRepo.map((entry) => ({ label: getEntryLabel(entry), value: entry.id }))}
        onChange={handleEntryChange}
      />
      <Select
        aria-label={t('Publication')}
        disabled={disabled || loading || !entryId}
        placeholder={t('Publication')}
        value={publicationId}
        options={publications.map((publication) => ({
          label:
            publication.id === selectedEntry?.activePublicationId
              ? `${publication.id} (${t('Active')})`
              : publication.id,
          value: publication.id,
        }))}
        onChange={(nextPublicationId) => {
          autoSelectionBlockedRef.current = false;
          setPublicationId(nextPublicationId);
        }}
      />
    </Space>
  );
};

function getBindingKey(binding: LightExtensionRuntimeSourceBinding): string {
  return [binding.repoId, binding.entryId, binding.publicationId].join(':');
}

function getErrorMessage(error: unknown): string | undefined {
  if (isRecord(error)) {
    if (typeof error.message === 'string') {
      return error.message;
    }
    const response = isRecord(error.response) ? error.response : null;
    const data = isRecord(response?.data) ? response.data : null;
    if (Array.isArray(data?.errors) && isRecord(data.errors[0]) && typeof data.errors[0].message === 'string') {
      return data.errors[0].message;
    }
  }
  return undefined;
}

export default RepoEntryPublicationSelector;
