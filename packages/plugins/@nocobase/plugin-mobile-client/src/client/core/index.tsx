import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import {
  MMenuBlockInitializer,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  MSettingsBlockInitializer,
  MSettings,
  useGridCardBlockItemProps,
  useGridCardBlockProps,
} from './schema';
import './bridge';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        MMenuBlockInitializer,
        MSettingsBlockInitializer,
        MContainer,
        MMenu,
        MTabBar,
        MPage,
        MHeader,
        MSettings,
      }}
      scope={{
        useGridCardBlockItemProps,
        useGridCardBlockProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
