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
  LightExtensionKind,
  LightExtensionPublicationMetadataRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSelectableEntryRecord,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';

export interface RepoEntryPublicationSelectorProps {
  value?: LightExtensionRuntimeSourceBinding | null;
  kind?: LightExtensionKind;
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

type LightExtensionEntrySelection = Pick<LightExtensionRuntimeSourceBinding, 'type' | 'repoId' | 'entryId' | 'kind'> &
  Partial<Pick<LightExtensionRuntimeSourceBinding, 'publicationId' | 'versionPolicy'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
  return isRecord(value) && Object.keys(value).length === 0;
}

function isLightExtensionEntrySelection(
  value: unknown,
  expectedKind: LightExtensionKind,
): value is LightExtensionEntrySelection {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    value.repoId.trim().length > 0 &&
    typeof value.entryId === 'string' &&
    value.entryId.trim().length > 0 &&
    value.kind === expectedKind
  );
}

function isLightExtensionEntryBinding(
  value: unknown,
  expectedKind: LightExtensionKind,
): value is LightExtensionRuntimeSourceBinding {
  return (
    isLightExtensionEntrySelection(value, expectedKind) &&
    typeof value.publicationId === 'string' &&
    value.publicationId.trim().length > 0 &&
    (typeof value.versionPolicy === 'undefined' ||
      value.versionPolicy === 'pinned' ||
      value.versionPolicy === 'follow-active')
  );
}

function hasActivePublication(
  entry: LightExtensionSelectableEntryRecord,
): entry is LightExtensionSelectableEntryRecord & { activePublication: LightExtensionPublicationMetadataRecord } {
  return Boolean(
    entry.activePublicationId &&
      entry.activePublication &&
      entry.activePublication.id === entry.activePublicationId &&
      entry.activePublication.entryId === entry.id &&
      entry.activePublication.repoId === entry.repoId &&
      entry.activePublication.kind === entry.kind,
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
    repoTitle: entry.repoId,
    entryId: entry.id,
    entryTitle: getEntryLabel(entry),
    entryName: entry.entryName,
    kind: entry.kind,
    publicationId: publication.id,
    versionPolicy: 'follow-active',
  };
}

export const RepoEntryPublicationSelector: React.FC<RepoEntryPublicationSelectorProps> = ({
  value,
  kind = 'js-block',
  onChange,
  onClear,
  disabled,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const ctx = useFlowContext<FlowContextWithApi>();
  const controlledValue = value && !isEmptyRecord(value) ? value : undefined;
  const latestValueRef = React.useRef(controlledValue);
  const onClearRef = React.useRef(onClear);
  const lastClearedBindingRef = React.useRef<string | null>(null);
  const lastEmittedBindingRef = React.useRef<string | null>(null);
  const hadControlledValueRef = React.useRef(Boolean(controlledValue?.entryId));
  const autoSelectionBlockedRef = React.useRef(false);
  const keepSelectionOnControlledClearRef = React.useRef(false);
  const [entries, setEntries] = React.useState<LightExtensionSelectableEntryRecord[]>([]);
  const [repoId, setRepoId] = React.useState<string | undefined>(controlledValue?.repoId);
  const [entryId, setEntryId] = React.useState<string | undefined>(controlledValue?.entryId);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const valueRepoId = controlledValue?.repoId;
  const valueEntryId = controlledValue?.entryId;

  const selectableEntries = React.useMemo(
    () => entries.filter((entry) => entry.kind === kind && hasActivePublication(entry)),
    [entries, kind],
  );
  const repoIds = React.useMemo(
    () => Array.from(new Set(selectableEntries.map((entry) => entry.repoId))),
    [selectableEntries],
  );
  const entriesInRepo = React.useMemo(
    () => selectableEntries.filter((entry) => !repoId || entry.repoId === repoId),
    [selectableEntries, repoId],
  );
  const selectedEntry = React.useMemo(
    () => selectableEntries.find((entry) => entry.id === entryId) || null,
    [entryId, selectableEntries],
  );
  const selectedPublication = selectedEntry?.activePublication || null;

  React.useEffect(() => {
    latestValueRef.current = controlledValue;
  }, [controlledValue]);

  React.useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  const notifyClear = React.useCallback(
    (binding?: unknown) => {
      const bindingKey = isLightExtensionEntryBinding(binding, kind) ? getBindingKey(binding) : null;
      if (bindingKey && lastClearedBindingRef.current === bindingKey) {
        return;
      }
      lastClearedBindingRef.current = bindingKey;
      lastEmittedBindingRef.current = null;
      onClearRef.current?.();
    },
    [kind],
  );

  const clearInvalidControlledBinding = React.useCallback(
    (binding?: unknown) => {
      autoSelectionBlockedRef.current = true;
      setRepoId(undefined);
      setEntryId(undefined);
      notifyClear(binding);
    },
    [notifyClear],
  );

  const clearEntrySelection = React.useCallback(() => {
    keepSelectionOnControlledClearRef.current = Boolean(latestValueRef.current?.entryId);
    notifyClear(latestValueRef.current);
  }, [notifyClear]);

  React.useEffect(() => {
    if (controlledValue && !isLightExtensionEntrySelection(controlledValue, kind)) {
      hadControlledValueRef.current = false;
      clearInvalidControlledBinding(controlledValue);
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
        setRepoId(undefined);
        setEntryId(undefined);
      }
      return;
    }
    hadControlledValueRef.current = true;
    autoSelectionBlockedRef.current = false;
    lastClearedBindingRef.current = null;
    setRepoId(valueRepoId);
    setEntryId(valueEntryId);
  }, [clearInvalidControlledBinding, controlledValue, kind, valueEntryId, valueRepoId]);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const loadEntries = async () => {
      try {
        const nextEntries = await listSelectableLightExtensionEntries(ctx.api, { kind });
        if (!mounted) {
          return;
        }
        const filtered = nextEntries.filter((entry) => entry.kind === kind && hasActivePublication(entry));
        setEntries(filtered);
        const currentValue = latestValueRef.current;
        if (currentValue && !isLightExtensionEntrySelection(currentValue, kind)) {
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
        const nextEntry = entryFromValue || filtered[0];
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
  }, [clearInvalidControlledBinding, ctx.api, kind, t]);

  React.useEffect(() => {
    if (controlledValue && !isLightExtensionEntrySelection(controlledValue, kind)) {
      clearInvalidControlledBinding(controlledValue);
      return;
    }
    if (!controlledValue?.entryId || selectableEntries.length === 0) {
      return;
    }
    const entryFromValue = selectableEntries.find(
      (entry) =>
        entry.id === controlledValue.entryId && (!controlledValue.repoId || entry.repoId === controlledValue.repoId),
    );
    if (!entryFromValue) {
      clearInvalidControlledBinding(controlledValue);
      return;
    }
    if (repoId !== entryFromValue.repoId) {
      setRepoId(entryFromValue.repoId);
    }
    if (entryId !== entryFromValue.id) {
      setEntryId(entryFromValue.id);
    }
  }, [clearInvalidControlledBinding, controlledValue, entryId, kind, repoId, selectableEntries]);

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
    setRepoId(nextRepoId);
    const nextEntry = selectableEntries.find((entry) => entry.repoId === nextRepoId);
    setEntryId(nextEntry?.id);
    if (!nextEntry) {
      clearEntrySelection();
    }
  };

  const handleEntryChange = (nextEntryId: string) => {
    autoSelectionBlockedRef.current = false;
    const nextEntry = selectableEntries.find((entry) => entry.id === nextEntryId);
    setRepoId(nextEntry?.repoId);
    setEntryId(nextEntryId);
    if (!nextEntry) {
      clearEntrySelection();
    }
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
    </Space>
  );
};

function getBindingKey(binding: LightExtensionRuntimeSourceBinding): string {
  return [binding.repoId, binding.entryId, binding.kind, binding.publicationId, binding.versionPolicy || 'pinned'].join(
    ':',
  );
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
