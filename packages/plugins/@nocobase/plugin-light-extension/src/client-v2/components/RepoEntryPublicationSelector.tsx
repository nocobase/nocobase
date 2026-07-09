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
import {
  listLightExtensionEntryPublications,
  listSelectableLightExtensionEntries,
} from '../api/lightExtensionEntriesRequests';

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

export type LightExtensionEntrySelection = Pick<
  LightExtensionRuntimeSourceBinding,
  'type' | 'repoId' | 'entryId' | 'kind'
> &
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

export function hasLightExtensionActivePublication(
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

export function cloneLightExtensionPublicationDefaults(
  publication: LightExtensionPublicationMetadataRecord,
): Record<string, unknown> {
  if (!isRecord(publication.settingsDefaultsSnapshot)) {
    return {};
  }
  return JSON.parse(JSON.stringify(publication.settingsDefaultsSnapshot)) as Record<string, unknown>;
}

export function getLightExtensionEntryLabel(entry: LightExtensionSelectableEntryRecord): string {
  return entry.title || entry.entryName || entry.id;
}

export function createLightExtensionRuntimeSourceBinding(
  entry: LightExtensionSelectableEntryRecord,
  publication: LightExtensionPublicationMetadataRecord,
  versionPolicy: LightExtensionRuntimeSourceBinding['versionPolicy'] = 'follow-active',
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: entry.repoId,
    repoTitle: entry.repoId,
    entryId: entry.id,
    entryTitle: getLightExtensionEntryLabel(entry),
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind: entry.kind,
    publicationId: publication.id,
    versionPolicy,
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
  const manuallySelectedPublicationIdRef = React.useRef<string | null>(null);
  const [entries, setEntries] = React.useState<LightExtensionSelectableEntryRecord[]>([]);
  const [repoId, setRepoId] = React.useState<string | undefined>(controlledValue?.repoId);
  const [entryId, setEntryId] = React.useState<string | undefined>(controlledValue?.entryId);
  const [loading, setLoading] = React.useState(false);
  const [publicationsLoading, setPublicationsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [publications, setPublications] = React.useState<LightExtensionPublicationMetadataRecord[]>([]);
  const [activePublicationId, setActivePublicationId] = React.useState<string | null>(null);
  const [publicationId, setPublicationId] = React.useState<string | undefined>(controlledValue?.publicationId);
  const valueRepoId = controlledValue?.repoId;
  const valueEntryId = controlledValue?.entryId;
  const valuePublicationId = controlledValue?.publicationId;

  const selectableEntries = React.useMemo(
    () => entries.filter((entry) => entry.kind === kind && hasLightExtensionActivePublication(entry)),
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
  const selectedPublication = React.useMemo(
    () => publications.find((publication) => publication.id === publicationId) || null,
    [publicationId, publications],
  );

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
      setPublicationId(undefined);
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
  }, [clearInvalidControlledBinding, controlledValue, kind, valueEntryId, valuePublicationId, valueRepoId]);

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
        const filtered = nextEntries.filter(
          (entry) => entry.kind === kind && hasLightExtensionActivePublication(entry),
        );
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
        const currentVersionPolicy = currentValue ? getControlledVersionPolicy(currentValue) : undefined;
        const nextEntry = entryFromValue || filtered[0];
        setRepoId(nextEntry?.repoId);
        setEntryId(nextEntry?.id);
        setPublicationId(
          entryFromValue && currentVersionPolicy !== 'follow-active'
            ? currentValue?.publicationId
            : nextEntry?.activePublicationId,
        );
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
    if (!selectedEntry) {
      setPublications([]);
      setActivePublicationId(null);
      setPublicationId(undefined);
      return;
    }

    let mounted = true;
    setPublicationsLoading(true);
    setError(null);
    const loadPublications = async () => {
      try {
        const result = await listLightExtensionEntryPublications(ctx.api, selectedEntry.id);
        if (!mounted) {
          return;
        }
        const filteredPublications = (result.publications || []).filter(
          (publication) =>
            publication.entryId === selectedEntry.id &&
            publication.repoId === selectedEntry.repoId &&
            publication.kind === selectedEntry.kind,
        );
        setPublications(filteredPublications);
        setActivePublicationId(result.activePublicationId || null);
        const currentValue = latestValueRef.current;
        const currentValueMatchesEntry =
          currentValue?.entryId === selectedEntry.id &&
          (!currentValue.repoId || currentValue.repoId === selectedEntry.repoId);
        const activePublication = filteredPublications.find(
          (publication) => publication.id === result.activePublicationId,
        );
        const shouldFollowActive =
          currentValueMatchesEntry && currentValue
            ? getControlledVersionPolicy(currentValue) === 'follow-active'
            : false;
        const controlledPublication =
          currentValueMatchesEntry && !shouldFollowActive
            ? filteredPublications.find((publication) => publication.id === currentValue?.publicationId)
            : null;
        if (currentValueMatchesEntry && !shouldFollowActive && currentValue?.publicationId && !controlledPublication) {
          if (
            isLightExtensionEntryBinding(currentValue, kind) &&
            (currentValue.versionPolicy || 'pinned') === 'pinned'
          ) {
            clearInvalidControlledBinding(currentValue);
            return;
          }
        }
        const nextPublication = controlledPublication || activePublication || filteredPublications[0];
        setPublicationId(nextPublication?.id);
        if (!nextPublication) {
          clearInvalidControlledBinding(currentValue);
        }
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setError(getErrorMessage(requestError) || t('Failed to load publications'));
      } finally {
        if (mounted) {
          setPublicationsLoading(false);
        }
      }
    };
    loadPublications();
    return () => {
      mounted = false;
    };
  }, [clearInvalidControlledBinding, ctx.api, kind, selectedEntry, t]);

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
    if (manuallySelectedPublicationIdRef.current) {
      return;
    }
    const controlledVersionPolicy = getControlledVersionPolicy(controlledValue);
    const nextPublicationId =
      controlledVersionPolicy === 'follow-active'
        ? activePublicationId || entryFromValue.activePublicationId || controlledValue.publicationId
        : controlledValue.publicationId;
    if (publicationId !== nextPublicationId) {
      setPublicationId(nextPublicationId);
    }
  }, [
    activePublicationId,
    clearInvalidControlledBinding,
    controlledValue,
    entryId,
    kind,
    publicationId,
    repoId,
    selectableEntries,
  ]);

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
    const manuallySelectedPublication = manuallySelectedPublicationIdRef.current === selectedPublication.id;
    const versionPolicy = getNextSelectorBindingVersionPolicy({
      controlledValue,
      selectedEntryId: selectedEntry.id,
      selectedPublicationId: selectedPublication.id,
      manuallySelectedPublicationId: manuallySelectedPublicationIdRef.current,
    });
    const binding = createLightExtensionRuntimeSourceBinding(selectedEntry, selectedPublication, versionPolicy);
    const bindingKey = getBindingKey(binding);
    if (lastEmittedBindingRef.current === bindingKey) {
      return;
    }
    lastEmittedBindingRef.current = bindingKey;
    if (manuallySelectedPublication) {
      manuallySelectedPublicationIdRef.current = null;
    }
    onChange?.(binding, selectedPublication, cloneLightExtensionPublicationDefaults(selectedPublication));
  }, [controlledValue, onChange, selectedEntry, selectedPublication, valueEntryId]);

  const handleRepoChange = (nextRepoId: string) => {
    autoSelectionBlockedRef.current = false;
    setRepoId(nextRepoId);
    const nextEntry = selectableEntries.find((entry) => entry.repoId === nextRepoId);
    setEntryId(nextEntry?.id);
    setPublicationId(undefined);
    if (!nextEntry) {
      clearEntrySelection();
    }
  };

  const handleEntryChange = (nextEntryId: string) => {
    autoSelectionBlockedRef.current = false;
    const nextEntry = selectableEntries.find((entry) => entry.id === nextEntryId);
    setRepoId(nextEntry?.repoId);
    setEntryId(nextEntryId);
    setPublicationId(undefined);
    if (!nextEntry) {
      clearEntrySelection();
    }
  };

  const handlePublicationChange = (nextPublicationId: string) => {
    manuallySelectedPublicationIdRef.current = nextPublicationId;
    setPublicationId(nextPublicationId);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {loading || publicationsLoading ? <Spin size="small" /> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      <Select
        aria-label={t('Repository')}
        disabled={disabled || loading || publicationsLoading}
        placeholder={t('Repository')}
        value={repoId}
        options={repoIds.map((id) => ({ label: id, value: id }))}
        showSearch
        optionFilterProp="label"
        onChange={handleRepoChange}
      />
      <Select
        aria-label={t('Entry')}
        disabled={disabled || loading || publicationsLoading}
        placeholder={t('Entry')}
        value={entryId}
        options={entriesInRepo.map((entry) => ({ label: getLightExtensionEntryLabel(entry), value: entry.id }))}
        showSearch
        optionFilterProp="label"
        onChange={handleEntryChange}
      />
      <Select
        aria-label={t('Publication')}
        disabled={disabled || loading || publicationsLoading || !entryId}
        placeholder={t('Publication')}
        value={publicationId}
        options={publications.map((publication) => ({
          label: getPublicationLabel(publication, activePublicationId, t),
          value: publication.id,
        }))}
        showSearch
        optionFilterProp="label"
        onChange={handlePublicationChange}
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

function getPublicationLabel(
  publication: LightExtensionPublicationMetadataRecord,
  activePublicationId: string | null,
  t: (key: string) => string,
): string {
  if (publication.id === activePublicationId) {
    return `${publication.id} (${t('Active publication')})`;
  }
  return publication.id;
}

function getControlledVersionPolicy(
  binding: LightExtensionEntrySelection,
): LightExtensionRuntimeSourceBinding['versionPolicy'] | undefined {
  if (binding.versionPolicy === 'follow-active') {
    return 'follow-active';
  }
  if (binding.versionPolicy === 'pinned' || typeof binding.versionPolicy === 'undefined') {
    return 'pinned';
  }
  return 'follow-active';
}

export function getNextSelectorBindingVersionPolicy(input: {
  controlledValue?: LightExtensionEntrySelection;
  selectedEntryId: string;
  selectedPublicationId: string;
  manuallySelectedPublicationId?: string | null;
}): LightExtensionRuntimeSourceBinding['versionPolicy'] | undefined {
  const { controlledValue, selectedEntryId, selectedPublicationId, manuallySelectedPublicationId } = input;
  if (manuallySelectedPublicationId === selectedPublicationId) {
    return 'pinned';
  }
  if (controlledValue?.entryId === selectedEntryId && controlledValue.publicationId === selectedPublicationId) {
    return getControlledVersionPolicy(controlledValue);
  }
  return undefined;
}

export default RepoEntryPublicationSelector;
