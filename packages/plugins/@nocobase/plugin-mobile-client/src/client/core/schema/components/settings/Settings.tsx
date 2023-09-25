import { css, cx, SettingsMenu, SortableItem, useDesigner } from '@nocobase/client';
import React from 'react';
import { SettingsDesigner } from './Settings.Designer';
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
