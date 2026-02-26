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
import { useAPIClient, useApp, useToken } from '@nocobase/client';
import { observer } from '@nocobase/flow-engine';
import { useChatBoxStore } from './stores/chat-box';
import { useT } from '../../locale';
import { AddLLMModal } from './AddLLMModal';
import { useLLMServiceCatalog } from '../../llm-services/hooks/useLLMServiceCatalog';
import { isSameModel, isValidModel, MODEL_PREFERENCE_STORAGE_KEY, resolveModel } from './model';

export const ModelSwitcher: React.FC = observer(
  () => {
    const t = useT();
    const app = useApp();
    const api = useAPIClient();
    const { token } = useToken();
    const { message } = App.useApp();
    const [isOpen, setIsOpen] = useState(false);
    const currentEmployee = useChatBoxStore.use.currentEmployee();
    const currentEmployeeUsername = currentEmployee?.username;
    const model = useChatBoxStore.use.model();
    const setModel = useChatBoxStore.use.setModel();

    const hasConfigPermission = app.pluginSettingsManager.has('ai.llm-services');

    const [addModalOpen, setAddModalOpen] = useState(false);

    const { repo, services: llmServices, loading, allModelsWithLabel, allModels } = useLLMServiceCatalog();

    // Initialize: cache >> first model
    useEffect(() => {
      if (!currentEmployeeUsername || !allModels.length) return;

      const resolved = resolveModel(api, currentEmployeeUsername, allModels, model);
      if (isSameModel(resolved, model)) {
        return;
      }
      setModel(resolved);
    }, [api, currentEmployeeUsername, allModels, model, setModel]);

    // Current selected model value
    const selectedModel = useMemo(() => {
      if (isValidModel(model, allModels)) {
        return model;
      }
      if (allModels.length) {
        return { llmService: allModels[0].llmService, model: allModels[0].model };
      }
      return undefined;
    }, [model, allModels]);

    // Current display label
    const selectedLabel = useMemo(() => {
      if (selectedModel) {
        const found = allModelsWithLabel.find(
          (m) => m.llmService === selectedModel.llmService && m.model === selectedModel.model,
        );
        return found?.label || selectedModel.model;
      }
      return undefined;
    }, [selectedModel, allModelsWithLabel]);

    // Handle selection
    const handleSelect = (llmService: string, modelValue: string) => {
      const target = allModelsWithLabel.find((m) => m.llmService === llmService && m.value === modelValue);
      if (target) {
        const newValue = { llmService: target.llmService, model: target.model };
        setModel(newValue);
        if (currentEmployee) {
          try {
            api?.storage.setItem(
              MODEL_PREFERENCE_STORAGE_KEY + currentEmployee.username,
              `${target.llmService}:${target.model}`,
            );
          } catch (err) {
            console.log(err);
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
              {isSelected && <CheckOutlined style={{ fontSize: 12, color: token.colorPrimary }} />}
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
          backgroundColor: token.colorFillTertiary,
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
            color: hasModels ? token.colorText : token.colorError,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 88,
          }}
        >
          {hasModels ? selectedLabel : t('No model available')}
        </span>
        <DownOutlined style={{ fontSize: 10, color: hasModels ? token.colorTextSecondary : token.colorError }} />
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
