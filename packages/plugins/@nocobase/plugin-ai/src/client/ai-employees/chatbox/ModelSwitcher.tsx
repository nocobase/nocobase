/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Select, Spin, Button, Tooltip } from 'antd';
import { PlusOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useAPIClient, useRequest, useApp, useACLRoleContext } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useT } from '../../locale';

interface LLMServiceData {
  llmService: string;
  llmServiceTitle: string;
  enabledModels: { label: string; value: string }[];
}

// localStorage helpers
const STORAGE_KEY = 'ai_model_preference_';
const saveToStorage = (username: string, value: string) => {
  try {
    localStorage.setItem(STORAGE_KEY + username, value);
  } catch {
    // Ignore localStorage errors
  }
};
const loadFromStorage = (username: string) => {
  try {
    return localStorage.getItem(STORAGE_KEY + username);
  } catch {
    return null;
  }
};

export const ModelSwitcher: React.FC = () => {
  const t = useT();
  const api = useAPIClient();
  const app = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const { allowAll, snippets } = useACLRoleContext();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const modelOverride = useChatBoxStore.use.modelOverride();
  const setModelOverride = useChatBoxStore.use.setModelOverride();

  const hasConfigPermission = allowAll || snippets?.includes('pm.*') || snippets?.includes('pm.ai');

  // Fetch available models
  const { data, loading, error } = useRequest<LLMServiceData[]>(
    () =>
      api
        .resource('ai')
        .listAllEnabledModels()
        .then((res) => res?.data?.data),
    {
      refreshDeps: [],
    },
  );

  const llmServices = Array.isArray(data) ? data : [];

  // Flatten all models into a single list for lookup/validation
  const allModels = useMemo(
    () =>
      llmServices.flatMap((s) =>
        s.enabledModels.map((m) => ({
          llmService: s.llmService,
          model: m.value,
          label: m.label,
          value: m.value,
        })),
      ),
    [llmServices],
  );

  // Grouped options for Select dropdown
  const groupedOptions = useMemo(
    () =>
      llmServices.map((s) => ({
        label: <span style={{ color: '#999', fontSize: 12 }}>{s.llmServiceTitle}</span>,
        title: s.llmServiceTitle,
        options: s.enabledModels.map((m) => ({
          label: m.label,
          value: m.value,
        })),
      })),
    [llmServices],
  );

  // Check if a model is valid
  const isValid = (v: { llmService: string; model: string } | null) =>
    v && allModels.some((m) => m.llmService === v.llmService && m.model === v.model);

  // Initialize: cache >> first model
  useEffect(() => {
    if (!currentEmployee || !allModels.length) return;

    // Skip if already set and valid
    if (modelOverride && isValid(modelOverride)) return;

    // Try cache first
    const cachedId = loadFromStorage(currentEmployee.username);
    const cachedModel = cachedId ? allModels.find((m) => m.model === cachedId) : null;

    if (cachedModel) {
      setModelOverride({ llmService: cachedModel.llmService, model: cachedModel.model });
      return;
    }

    // Fall back to first model
    setModelOverride(allModels[0]);
  }, [currentEmployee?.username, allModels]);

  // Current value
  const value = useMemo(() => {
    if (modelOverride && isValid(modelOverride)) {
      return modelOverride.model;
    }
    if (allModels.length) {
      return allModels[0].model;
    }
    return undefined;
  }, [modelOverride, allModels]);

  // Handle selection
  const handleChange = (val: string) => {
    const target = allModels.find((m) => m.value === val);
    if (target) {
      const newValue = { llmService: target.llmService, model: target.model };
      setModelOverride(newValue);
      if (currentEmployee) {
        saveToStorage(currentEmployee.username, target.model);
      }
    }
  };

  // Navigate to LLM config page
  const handleAddLLM = () => {
    app.router.navigate('/admin/settings/ai/llm-services', { state: { autoOpenAddNew: true } });
  };

  // Render conditions
  if (!currentEmployee) return null;
  if (loading) return <Spin size="small" />;

  if (!allModels.length) {
    return hasConfigPermission ? (
      <Tooltip title={t('Add LLM service')}>
        <Button size="small" icon={<PlusOutlined />} onClick={handleAddLLM}>
          {t('Add LLM service')}
        </Button>
      </Tooltip>
    ) : null;
  }

  return (
    <Tooltip title={t('Select model')}>
      <Select
        size="small"
        value={value}
        onChange={handleChange}
        options={groupedOptions}
        style={{
          minWidth: 140,
          fontSize: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 6,
          height: 28,
          padding: '0 4px',
        }}
        suffixIcon={
          isOpen ? (
            <UpOutlined style={{ fontSize: 10, color: 'rgba(0, 0, 0, 0.45)' }} />
          ) : (
            <DownOutlined style={{ fontSize: 10, color: 'rgba(0, 0, 0, 0.45)' }} />
          )
        }
        onDropdownVisibleChange={setIsOpen}
        variant="borderless"
        popupMatchSelectWidth={false}
      />
    </Tooltip>
  );
};
