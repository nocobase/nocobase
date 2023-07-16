import type { FC } from 'react';
import React from 'react';
import { antdComponents } from './component-panel';
import type { Theme } from './interface';
import ComponentDemoPro from './token-panel-pro/ComponentDemoPro';

export type PreviewDemoProps = {
  theme: Theme;
  style?: React.CSSProperties;
};

const PreviewDemo: FC<PreviewDemoProps> = ({ theme, style }) => {
  return (
    <div style={{ ...style, overflow: 'auto' }}>
      <ComponentDemoPro
        theme={theme}
        components={antdComponents}
        componentDrawer={false}
        showAll
        style={{ minHeight: '100%' }}
      />
    </div>
  );
};

export default PreviewDemo;
