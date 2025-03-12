/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx, useSchemaSettingsRender, SortableItem, useDesigner } from '@nocobase/client';
import React from 'react';
import { SettingsDesigner } from './Settings.Designer';

export function UserCenter() {
  const { render } = useSchemaSettingsRender('userCenterSettings');
  return <div style={{ display: 'inline-block' }}>{render({ mode: 'inline', style: { width: '100%' } })}</div>;
}
export const InternalSettings = () => {
  const Designer = useDesigner();
  return (
    <SortableItem
      className={cx(
        'nb-mobile-setting',
        css`
          margin-bottom: var(--nb-spacing);
        `,
      )}
    >
      <Designer />
      <UserCenter />
    </SortableItem>
  );
};
export const MSettings = InternalSettings as unknown as typeof InternalSettings & {
  Designer: typeof SettingsDesigner;
};

MSettings.Designer = SettingsDesigner;
