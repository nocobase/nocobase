import React from 'react';
import { SettingsMenu, SortableItem, useDesigner } from '@nocobase/client';
import { SettingsDesigner } from './Settings.Designer';
import { css, cx } from '@emotion/css';
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
      <SettingsMenu redirectUrl="/mobile" />
    </SortableItem>
  );
};
export const MSettings = InternalSettings as unknown as typeof InternalSettings & {
  Designer: typeof SettingsDesigner;
};

MSettings.Designer = SettingsDesigner;
