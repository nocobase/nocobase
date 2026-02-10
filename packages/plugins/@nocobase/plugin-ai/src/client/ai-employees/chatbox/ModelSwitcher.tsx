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
import { useAPIClient, useApp } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import { useChatBoxStore } from './stores/chat-box';
import { useT } from '../../locale';
import { AddLLMModal } from './AddLLMModal';
import { useLLMServicesRepository } from '../../llm-services/hooks/useLLMServicesRepository';

// Storage key prefix for model preferences
const STORAGE_KEY = 'ai_model_preference_';

export const ModelSwitcher: React.FC = observer(
  () => {
    const t = useT();
    const app = useApp();
    const api = useAPIClient();
    const { message } = App.useApp();
    const [isOpen, setIsOpen] = useState(false);
    const currentEmployee = useChatBoxStore.use.currentEmployee();
    const modelOverride = useChatBoxStore.use.modelOverride();
    const setModelOverride = useChatBoxStore.use.setModelOverride();

    const hasConfigPermission = app.pluginSettingsManager.has('ai.llm-services');

    const [addModalOpen, setAddModalOpen] = useState(false);

    const repo = useLLMServicesRepository();

    useEffect(() => {
      repo.load();
    }, [repo]);

    const llmServices = repo.services;
    const loading = repo.loading;

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

      // Try cache first (use apiClient.storage per NocoBase convention)
      let cachedId: string | null = null;
      try {
        cachedId = api.storage.getItem(STORAGE_KEY + currentEmployee.username);
      } catch {
        // Ignore storage errors
      }
      let cachedModel = null;
      if (cachedId) {
        if (cachedId.includes(':')) {
          const [cachedService, cachedModelId] = cachedId.split(':');
          cachedModel = allModels.find((m) => m.llmService === cachedService && m.model === cachedModelId) || null;
        } else {
          // Backward compatibility: old format stored only model id
          cachedModel = allModels.find((m) => m.model === cachedId) || null;
        }
      }

      if (cachedModel) {
        setModelOverride({ llmService: cachedModel.llmService, model: cachedModel.model });
        return;
      }

      // Fall back to first model
      setModelOverride(allModels[0]);
    }, [currentEmployee?.username, allModels, modelOverride]);

    // Current selected model value
    const selectedModel = useMemo(() => {
      if (modelOverride && isValid(modelOverride)) {
        return modelOverride;
      }
      if (allModels.length) {
        return { llmService: allModels[0].llmService, model: allModels[0].model };
      }
      return undefined;
    }, [modelOverride, allModels]);

    // Current display label
    const selectedLabel = useMemo(() => {
      if (selectedModel) {
        const found = allModels.find(
          (m) => m.llmService === selectedModel.llmService && m.model === selectedModel.model,
        );
        return found?.label || selectedModel.model;
      }
      return undefined;
    }, [selectedModel, allModels]);

    // Handle selection
    const handleSelect = (llmService: string, modelValue: string) => {
      const target = allModels.find((m) => m.llmService === llmService && m.value === modelValue);
      if (target) {
        const newValue = { llmService: target.llmService, model: target.model };
        setModelOverride(newValue);
        if (currentEmployee) {
          try {
            api.storage.setItem(STORAGE_KEY + currentEmployee.username, `${target.llmService}:${target.model}`);
          } catch {
            // Ignore storage errors
          }
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
    if (loading && !llmServices.length) return <Spin size="small" />;

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
        const isSelected =
          selectedModel && selectedModel.llmService === service.llmService && selectedModel.model === model.value;
        menuItems.push({
          key: `${service.llmService}:${model.value}`,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{model.label}</span>
              {isSelected && <CheckOutlined style={{ fontSize: 12, color: '#1890ff' }} />}
            </span>
          ),
          onClick: () => handleSelect(service.llmService, model.value),
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
          overlayStyle={{ zIndex: 1200 }}
        >
          {dropdownContent}
        </Dropdown>
        {hasConfigPermission && (
          <AddLLMModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={() => repo.refresh()} />
        )}
      </>
    );
  },
  { displayName: 'ModelSwitcher' },
);
