/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Dropdown, Spin, Typography, App } from 'antd';
import { PlusOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons';
import { useAPIClient, useRequest, useApp } from '@nocobase/client';
import { useChatBoxStore } from './stores/chat-box';
import { useT } from '../../locale';
import { AddLLMModal } from './AddLLMModal';

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
  const { message } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const modelOverride = useChatBoxStore.use.modelOverride();
  const setModelOverride = useChatBoxStore.use.setModelOverride();

  const hasConfigPermission = app.pluginSettingsManager.has('ai.llm-services');

  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch available models
  const { data, loading, refresh } = useRequest<LLMServiceData[]>(
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

  // Current selected model value
  const selectedModel = useMemo(() => {
    if (modelOverride && isValid(modelOverride)) {
      return modelOverride.model;
    }
    if (allModels.length) {
      return allModels[0].model;
    }
    return undefined;
  }, [modelOverride, allModels]);

  // Current display label
  const selectedLabel = useMemo(() => {
    if (selectedModel) {
      const found = allModels.find((m) => m.model === selectedModel);
      return found?.label || selectedModel;
    }
    return undefined;
  }, [selectedModel, allModels]);

  // Handle selection
  const handleSelect = (modelValue: string) => {
    const target = allModels.find((m) => m.value === modelValue);
    if (target) {
      const newValue = { llmService: target.llmService, model: target.model };
      setModelOverride(newValue);
      if (currentEmployee) {
        saveToStorage(currentEmployee.username, target.model);
      }
    }
  };

  // Open add LLM modal or show warning
  const handleAddModel = () => {
    if (hasConfigPermission) {
      setAddModalOpen(true);
    } else {
      message.warning(t('Please contact the administrator to configure models'));
    }
  };

  if (!currentEmployee) return null;
  if (loading) return <Spin size="small" />;

  const hasModels = allModels.length > 0;

  // Build dropdown menu items
  const menuItems: any[] = [];

  llmServices.forEach((service, sIndex) => {
    if (sIndex > 0) {
      menuItems.push({ type: 'divider', key: `divider-${sIndex}` });
    }
    // Group label
    menuItems.push({
      key: `group-${service.llmService}`,
      label: (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {service.llmServiceTitle}
        </Typography.Text>
      ),
      disabled: true,
      style: { cursor: 'default', padding: '4px 12px', height: 'auto', minHeight: 0 },
    });
    // Model items
    service.enabledModels.forEach((model) => {
      const isSelected = selectedModel === model.value;
      menuItems.push({
        key: model.value,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span>{model.label}</span>
            {isSelected && <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />}
          </span>
        ),
        onClick: () => handleSelect(model.value),
      });
    });
  });

  // Empty placeholder when no services
  if (!hasModels) {
    menuItems.push({
      key: 'empty-placeholder',
      label: (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('No LLM services enabled yet')}
        </Typography.Text>
      ),
      disabled: true,
      style: { cursor: 'default', padding: '16px 12px', height: 'auto', minHeight: 0 },
    });
  }

  // Add divider and "Add LLM Service" button at the bottom
  if (menuItems.length > 0) {
    menuItems.push({ type: 'divider', key: 'divider-add' });
  }
  menuItems.push({
    key: 'add-model',
    icon: <PlusOutlined />,
    label: t('Add LLM service'),
    onClick: handleAddModel,
  });

  const dropdownContent = (
    <span
      onClick={(e) => {
        // Allow dropdown to handle click
        e.stopPropagation();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: 6,
        height: 28,
        padding: '0 8px',
        cursor: 'pointer',
        minWidth: hasModels ? 'auto' : undefined,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          color: hasModels ? 'rgba(0, 0, 0, 0.88)' : '#ff4d4f',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 160,
        }}
      >
        {hasModels ? selectedLabel : t('No model available')}
      </span>
      <DownOutlined style={{ fontSize: 10, color: hasModels ? 'rgba(0, 0, 0, 0.45)' : '#ff4d4f' }} />
    </span>
  );

  return (
    <>
      <Dropdown
        menu={{ items: menuItems, style: { maxHeight: 400, overflow: 'auto' } }}
        trigger={['hover']}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        {dropdownContent}
      </Dropdown>
      {hasConfigPermission && (
        <AddLLMModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={refresh} />
      )}
    </>
  );
};
