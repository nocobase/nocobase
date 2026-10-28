/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { supportsWebSearchForModel } from '../../../repositories/AIConfigRepository';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChatBoxRuntime } from '../stores/runtime';

export const SearchSwitch: React.FC<{ disabled?: boolean; showLabel?: boolean }> = observer(
  ({ disabled, showLabel }) => {
    const t = useT();
    const repository = useAIConfigRepository();
    const { chatBoxModel, chatConversationModel } = useChatBoxRuntime();
    const webSearch = chatConversationModel.webSearch;
    const model = chatBoxModel.model;
    const services = repository.llmServices;

    useEffect(() => {
      repository.getLLMServices().catch(console.error);
    }, [repository]);

    const currentService = useMemo(() => {
      if (!model) {
        return null;
      }
      return services.find((service) => service.llmService === model.llmService) || null;
    }, [model, services]);

    const supportWebSearch = supportsWebSearchForModel(currentService, model?.model);

    useEffect(() => {
      if (!supportWebSearch && webSearch) {
        chatConversationModel.setWebSearch(false);
      }
    }, [chatConversationModel, supportWebSearch, webSearch]);

    const switchChecked = () => {
      if (supportWebSearch) {
        chatConversationModel.setWebSearch(!webSearch);
      }
    };

    const label = disabled
      ? t('Web search')
      : t(webSearch ? 'Disable search' : supportWebSearch ? 'Enable search' : 'Web search not supported');

    return (
      <Tooltip title={showLabel ? undefined : label} arrow={false}>
        <Button
          type={webSearch && !disabled ? 'default' : 'text'}
          color={webSearch && !disabled ? 'primary' : undefined}
          variant={webSearch && !disabled ? 'filled' : undefined}
          icon={<GlobalOutlined />}
          aria-label={label}
          aria-pressed={webSearch}
          onClick={switchChecked}
          disabled={disabled || !supportWebSearch}
          style={
            showLabel
              ? { minHeight: 44, height: 'auto', width: '100%', justifyContent: 'flex-start', paddingBlock: 8 }
              : undefined
          }
        >
          {showLabel ? <span style={{ minWidth: 0, whiteSpace: 'normal', textAlign: 'start' }}>{label}</span> : null}
        </Button>
      </Tooltip>
    );
  },
);
