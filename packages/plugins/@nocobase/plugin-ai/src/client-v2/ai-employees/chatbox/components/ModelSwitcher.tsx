/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Dropdown, Spin, Typography, theme, type MenuProps } from 'antd';
import { CheckOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { useApp } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import type { LLMServiceItem } from '../../../repositories/AIConfigRepository';
import {
  getAIEmployeeModels,
  getAllModels,
  isSameModel,
  isValidModel,
  MODEL_PREFERENCE_STORAGE_KEY,
  resolveModel,
} from '../model';
import { useChatBoxStore, type ModelRef } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { AddLLMModal } from './AddLLMModal';

export const ModelSwitcher: React.FC<{
  disabled?: boolean;
}> = observer(({ disabled }) => {
  const t = useT();
  const app = useApp();
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const [isOpen, setIsOpen] = useState(false);
  const repository = useAIConfigRepository();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const currentEmployeeUsername = currentEmployee?.username;
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const model = useChatBoxStore.use.model();
  const setModel = useChatBoxStore.use.setModel();
  const llmServices = repository.llmServices;
  const [addModalOpen, setAddModalOpen] = useState(false);
  const pluginSettingsManager = app.pluginSettingsManager as
    | {
        has?: (key: string) => boolean;
      }
    | undefined;
  const hasConfigPermission = pluginSettingsManager?.has?.('ai.llm-services') === true;

  useEffect(() => {
    repository.getLLMServices().catch(console.error);
  }, [repository]);

  const allModels = useMemo(() => getAllModels(llmServices), [llmServices]);
  const scopedModels = useMemo(() => getAIEmployeeModels(currentEmployee, allModels), [allModels, currentEmployee]);
  const scopedModelKeys = useMemo(
    () => new Set(scopedModels.map((item) => `${item.llmService}:${item.model}`)),
    [scopedModels],
  );
  const servicesWithModels = useMemo(
    () =>
      llmServices
        .map((service) => ({
          ...service,
          enabledModels: service.enabledModels.filter((item) =>
            scopedModelKeys.has(`${service.llmService}:${item.value}`),
          ),
        }))
        .filter((service) => service.enabledModels.length > 0),
    [llmServices, scopedModelKeys],
  );

  useEffect(() => {
    if (!currentEmployeeUsername || currentConversation) {
      return;
    }
    const resolved = resolveModel(app.apiClient, currentEmployee, allModels, model);
    if (!isSameModel(resolved, model)) {
      setModel(resolved);
    }
  }, [allModels, app.apiClient, currentConversation, currentEmployee, currentEmployeeUsername, model, setModel]);

  const selectedModel = useMemo(() => {
    if (isValidModel(model, scopedModels)) {
      return model;
    }
    if (scopedModels.length) {
      return scopedModels[0];
    }
    return undefined;
  }, [model, scopedModels]);

  const selectedLabel = useMemo(() => getModelLabel(llmServices, selectedModel), [llmServices, selectedModel]);

  const handleSelect = useCallback(
    (target: ModelRef) => {
      setModel(target);
      if (currentEmployee) {
        try {
          app.apiClient.storage?.setItem(MODEL_PREFERENCE_STORAGE_KEY + currentEmployee.username, getModelKey(target));
        } catch (error) {
          console.error(error);
        }
      }
    },
    [app.apiClient.storage, currentEmployee, setModel],
  );

  const menuItems = useMemo<MenuProps['items']>(() => {
    const items: MenuProps['items'] = [];

    servicesWithModels.forEach((service, serviceIndex) => {
      if (serviceIndex > 0) {
        items.push({ type: 'divider', key: `divider-${serviceIndex}` });
      }
      items.push({
        key: `group-${service.llmService}`,
        label: (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t(service.llmServiceTitle)}
          </Typography.Text>
        ),
        disabled: true,
        style: { cursor: 'default', padding: '4px 12px', height: 'auto', minHeight: 0 },
      });
      service.enabledModels.forEach((item) => {
        const target = { llmService: service.llmService, model: item.value };
        const isSelected = selectedModel && isSameModel(selectedModel, target);
        items.push({
          key: getModelKey(target),
          label: (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{t(item.label)}</span>
              {isSelected ? <CheckOutlined style={{ fontSize: 12, color: token.colorPrimary }} /> : null}
            </span>
          ),
          onClick: () => handleSelect(target),
        });
      });
    });

    if (!servicesWithModels.length) {
      items.push({
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

    if (items.length > 0) {
      items.push({ type: 'divider', key: 'divider-add' });
    }
    items.push({
      key: 'add-model',
      icon: <PlusOutlined />,
      label: t('Add LLM service'),
      onClick: () => {
        if (hasConfigPermission) {
          setAddModalOpen(true);
        } else {
          message.warning(t('Please contact the administrator to configure models'));
        }
      },
    });

    return items;
  }, [handleSelect, hasConfigPermission, message, selectedModel, servicesWithModels, t, token.colorPrimary]);

  if (!currentEmployee) {
    return null;
  }

  if (repository.llmServicesLoading && !llmServices.length) {
    return <Spin size="small" />;
  }

  const hasModels = servicesWithModels.length > 0;

  return (
    <>
      <Dropdown
        disabled={disabled}
        menu={{ items: menuItems, style: { maxHeight: 400, overflow: 'auto' } }}
        trigger={['hover']}
        open={isOpen}
        onOpenChange={setIsOpen}
        overlayStyle={{ zIndex: 1200 }}
      >
        <span
          onClick={(event) => event.stopPropagation()}
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
      </Dropdown>
      {hasConfigPermission ? (
        <AddLLMModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => repository.refreshLLMServices()}
        />
      ) : null}
    </>
  );
});

function getModelKey(model: ModelRef) {
  return `${model.llmService}:${model.model}`;
}

function getModelLabel(services: LLMServiceItem[], model: ModelRef | null | undefined) {
  if (!model) {
    return '';
  }
  const service = services.find((item) => item.llmService === model.llmService);
  const option = service?.enabledModels.find((item) => item.value === model.model);
  return option?.label || model.model;
}
