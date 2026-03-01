/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatBoxStore } from './stores/chat-box';
import { useLLMServiceCatalog } from '../../llm-services/hooks/useLLMServiceCatalog';
import { getServiceByOverride } from '../../llm-services/utils';
import { useT } from '../../locale';

export const SearchSwitch: React.FC = observer(
  () => {
    const t = useT();
    const webSearch = useChatConversationsStore.use.webSearch();
    const setWebSearch = useChatConversationsStore.use.setWebSearch();
    const currentEmployee = useChatBoxStore.use.currentEmployee();
    const model = useChatBoxStore.use.model();
    const { services } = useLLMServiceCatalog();

    const currentService = getServiceByOverride(services, model);
    const supportWebSearch = currentService?.supportWebSearch ?? false;
    const isToolConflict = currentService?.isToolConflict ?? false;

    useEffect(() => {
      if (!supportWebSearch && webSearch) {
        setWebSearch(false);
      }
    }, [supportWebSearch, webSearch, setWebSearch]);

    const switchChecked = () => {
      if (!supportWebSearch) {
        return;
      }
      setWebSearch(!webSearch);
    };

    if (!currentEmployee) {
      return <Button type="text" icon={<GlobalOutlined />} disabled={true} />;
    }

    const enabledTooltip = t('Disable search');
    const unsupportedTooltip = t('Web search not supported');
    const disabledTooltip = isToolConflict ? (
      <div>
        <div>{t('Enable search')}</div>
        <div style={{ marginTop: 4 }}>{t('Search disables tools')}</div>
      </div>
    ) : (
      t('Enable search')
    );

    return webSearch ? (
      <Tooltip title={enabledTooltip} arrow={false}>
        <Button color="primary" variant="filled" icon={<GlobalOutlined />} onClick={switchChecked} />
      </Tooltip>
    ) : (
      <Tooltip title={supportWebSearch ? disabledTooltip : unsupportedTooltip} arrow={false}>
        <Button type="text" icon={<GlobalOutlined />} onClick={switchChecked} disabled={!supportWebSearch} />
      </Tooltip>
    );
  },
  { displayName: 'SearchSwitch' },
);
