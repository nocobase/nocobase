/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Flex, Typography, theme } from 'antd';
import { FlowModel } from '@nocobase/flow-engine';
import { tExpr, useT } from '../../locale';
import type { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
import { AIChatBoxCoreView } from './components/AIChatBoxCoreView';

const AIChatBoxCorePlaceholder: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{
        minHeight: 240,
        height: '100%',
        padding: token.paddingLG,
        color: token.colorTextDescription,
      }}
    >
      <Typography.Text type="secondary">{t('AI chat box core')}</Typography.Text>
    </Flex>
  );
};

export class AIChatBoxCoreModel extends FlowModel {
  render() {
    const parent = this.parent as AIChatBoxBlockModel | undefined;
    return parent ? <AIChatBoxCoreView /> : <AIChatBoxCorePlaceholder />;
  }
}

AIChatBoxCoreModel.define({
  label: tExpr('AI chat box core'),
  hide: true,
});
