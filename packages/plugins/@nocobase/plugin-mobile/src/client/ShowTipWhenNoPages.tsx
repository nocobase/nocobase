/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HighlightOutlined } from '@ant-design/icons';
import { useDesignable } from '@nocobase/client';
import { ErrorBlock } from 'antd-mobile';
import _ from 'lodash';
import React, { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { usePluginTranslation } from './locale';
import { useMobileRoutes } from './mobile-providers/context';

export const ShowTipWhenNoPages: FC = ({ children }) => {
  const { designable } = useDesignable();
  const { routeList } = useMobileRoutes();
  const { t } = usePluginTranslation();
  const isInBlockTemplateSettingsPage = window.location.pathname?.includes('/m/block-templates/inherited/');

  if (!isInBlockTemplateSettingsPage && (!designable || isMobile) && _.isEmpty(routeList)) {
    return (
      <ErrorBlock
        image={<HighlightOutlined style={{ fontSize: '8em' }} />}
        fullPage
        title={t('No pages yet, please configure first')}
        description={t('Click the "UI Editor" icon in the upper right corner to enter the UI Editor mode')}
      />
    );
  }

  return <>{children}</>;
};
