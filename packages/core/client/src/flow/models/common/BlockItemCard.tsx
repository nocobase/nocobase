/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme, Card } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';
import { MarkdownReadPretty } from '../fields/EditableField/MarkdownEditableFieldModel';

export const BlockItemCard = (props) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { title: blockTitle, description, children } = props;
  const title = (blockTitle || description) && (
    <div style={{ padding: '8px 0px 8px' }}>
      <span> {t(blockTitle, { ns: NAMESPACE_UI_SCHEMA })}</span>
      {description && (
        <MarkdownReadPretty
          value={t(description, { ns: NAMESPACE_UI_SCHEMA })}
          style={{
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            fontWeight: 400,
            color: token.colorTextDescription,
            borderRadius: '4px',
          }}
        />
      )}
    </div>
  );
  return (
    <Card
      title={title}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      styles={{
        body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      {children}
    </Card>
  );
};
