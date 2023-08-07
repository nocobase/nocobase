import { ConfigProvider, Segmented, Space, theme as antdTheme } from 'antd';
import type { FC } from 'react';
import React from 'react';
import { MutableTheme } from '../../../types';
import ComponentDemoGroup from '../component-panel/ComponentDemoGroup';
import { useLocale } from '../locale';
import { Error, Primary, Success, Warning } from '../overviews';

export type ComponentDemoProProps = {
  selectedTokens?: string[];
  theme: MutableTheme;
  components: Record<string, string[]>;
  activeComponents?: string[];
  style?: React.CSSProperties;
  componentDrawer?: boolean;
  showAll?: boolean;
};

const ComponentDemoPro: FC<ComponentDemoProProps> = ({
  selectedTokens,
  theme,
  components,
  activeComponents,
  componentDrawer,
  showAll,
  style,
}) => {
  const [mode, setMode] = React.useState<'overview' | 'component'>('overview');
  const {
    token: { colorBgLayout },
  } = antdTheme.useToken();
  const locale = useLocale();

  const overviewDemo = React.useMemo(() => {
    if (showAll) {
      return (
        <Space direction="vertical">
          <Primary />
          <Success />
          <Error />
          <Warning />
        </Space>
      );
    }
    if (selectedTokens?.includes('colorError')) {
      return <Error />;
    }
    if (selectedTokens?.includes('colorSuccess')) {
      return <Success />;
    }
    if (selectedTokens?.includes('colorWarning')) {
      return <Warning />;
    }
    return <Primary />;
  }, [selectedTokens, showAll]);

  return (
    <div style={{ ...style, background: colorBgLayout, paddingBottom: 24 }}>
      <div style={{ margin: 'auto', maxWidth: 960 }}>
        <Segmented
          options={[
            { value: 'overview', label: locale.demo.overview },
            { value: 'component', label: locale.demo.components },
          ]}
          value={mode}
          onChange={setMode as any}
          style={{ margin: '12px 0 0 12px' }}
        />

        <ConfigProvider
          theme={{
            components: {
              Select: {
                zIndexPopup: 10,
              },
              DatePicker: {
                zIndexPopup: 10,
              },
              Dropdown: {
                zIndexPopup: 10,
              },
              Mentions: {
                zIndexPopup: 10,
              },
              Tooltip: {
                zIndexPopup: 10,
              },
              Popover: {
                zIndexPopup: 10,
              },
              Popconfirm: {
                zIndexPopup: 10,
              },
            },
          }}
        >
          {mode === 'overview' ? (
            <div style={{ margin: 12, maxWidth: 'fit-content' }}>{overviewDemo}</div>
          ) : (
            <ComponentDemoGroup
              selectedTokens={selectedTokens}
              themes={[theme]}
              components={components}
              activeComponents={activeComponents}
              componentDrawer={componentDrawer}
              hideTokens
            />
          )}
        </ConfigProvider>
      </div>
    </div>
  );
};

export default (props: ComponentDemoProProps) => (
  <ConfigProvider theme={props.theme.config}>
    <ComponentDemoPro {...props} />
  </ConfigProvider>
);
