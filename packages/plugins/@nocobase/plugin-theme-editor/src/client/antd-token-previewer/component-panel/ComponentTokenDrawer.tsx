import { BuildOutlined, CarOutlined } from '@ant-design/icons';
import { ConfigProvider, Drawer, Empty, Tag, Tooltip, theme as antdTheme } from 'antd';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import ComponentDemos from '../component-demos';
import type { AliasToken, ComponentDemo, MutableTheme, TokenName, TokenValue } from '../interface';
import { useLocale } from '../locale';
import TokenCard from '../token-panel/token-card';
import getDesignToken from '../utils/getDesignToken';
import makeStyle from '../utils/makeStyle';
import { getComponentToken } from '../utils/statistic';
import ComponentCard from './ComponentCard';

const { defaultAlgorithm } = antdTheme;

const useStyle = makeStyle('ComponentTokenDrawer', (token) => ({
  '.previewer-component-token-drawer': {
    [`&${token.rootCls}-drawer ${token.rootCls}-drawer-body`]: {
      padding: '0 !important',
    },

    '.previewer-component-drawer-subtitle': {
      fontWeight: token.fontWeightStrong,
      marginBottom: token.marginSM,
      marginInlineStart: token.marginXS,
      color: token.colorText,
    },

    '.previewer-component-token-drawer-theme': {
      fontWeight: 'normal',
      marginInlineStart: 8,
      borderRadius: 4,
      backgroundColor: token.colorInfoBg,
      color: token.colorPrimary,
      borderColor: token.colorInfoBg,
    },
  },
}));

export type ComponentFullDemosProps = {
  demos: ComponentDemo[];
};

const useComponentFullDemosStyle = makeStyle('ComponentFullDemos', (token) => ({
  '.previewer-component-full-demos': {
    flex: 1,
    overflow: 'auto',
    padding: 24,
    backgroundColor: token.colorBgLayout,
    '> *:not(:last-child)': {
      marginBottom: 12,
    },
  },
}));

const ComponentFullDemos: FC<ComponentFullDemosProps> = ({ demos }) => {
  const [, hashId] = useComponentFullDemosStyle();
  const locale = useLocale();

  return (
    <div className={classNames('previewer-component-full-demos', hashId)} style={{}}>
      {demos?.map((demo) => (
        <ComponentCard
          key={demo.key}
          title={
            <Tooltip title={demo.tokens?.join(', ')}>
              <span>
                {locale.demo.relatedTokens}: {demo.tokens?.join(', ')}
                {(demo.tokens?.length || 0) > 2 ? '...' : ''}
              </span>
            </Tooltip>
          }
        >
          {demo.demo}
        </ComponentCard>
      ))}
    </div>
  );
};

export type ComponentTokenDrawerProps = {
  visible?: boolean;
  component?: string;
  onClose?: () => void;
  theme: MutableTheme;
  onTokenClick?: (token: TokenName) => void;
};

const ComponentTokenDrawer: FC<ComponentTokenDrawerProps> = ({ visible, component = 'Button', onClose, theme }) => {
  const [, hashId] = useStyle();

  const { component: componentToken, global: aliasTokenNames } = getComponentToken(component) || { global: [] };

  const componentTokenData = useMemo(() => Object.keys(componentToken ?? {}), [componentToken]);

  const aliasTokenData = useMemo(() => {
    return aliasTokenNames.sort();
  }, [aliasTokenNames]);

  const handleComponentTokenChange = (token: string, value: TokenValue) => {
    theme.onThemeChange?.(
      {
        ...theme.config,
        components: {
          ...theme.config.components,
          [component]: {
            ...(theme.config.components as any)?.[component],
            [token]: value,
          },
        },
      },
      ['components', component, token],
    );
  };

  return (
    <Drawer
      open={visible}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>{`${component} 组件 Token`}</span>
          <Tag className="previewer-component-token-drawer-theme">{theme.name}</Tag>
        </div>
      }
      onClose={onClose}
      width={1200}
      className={classNames('previewer-component-token-drawer', hashId)}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <ConfigProvider theme={theme.config}>
          <ConfigProvider theme={theme.config}>
            <ComponentFullDemos demos={ComponentDemos[component]} />
          </ConfigProvider>
        </ConfigProvider>
        <div style={{ flex: '0 0 400px', overflow: 'auto', padding: 24 }}>
          <div className="previewer-component-drawer-subtitle">Related Tokens / 相关 token</div>
          <TokenCard
            icon={<BuildOutlined />}
            hideUsageCount
            defaultOpen
            title="Component Token"
            tokenArr={componentTokenData}
            tokenPath={['components', component]}
            themes={[theme]}
            fallback={() => componentToken}
            onTokenChange={(_, tokenName, value) => handleComponentTokenChange(tokenName, value)}
            placeholder={
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无相关 Component Token"
                style={{
                  marginBlock: 0,
                  paddingBlock: 32,
                }}
              />
            }
          />
          <TokenCard
            icon={<CarOutlined />}
            hideUsageCount
            themes={[theme]}
            defaultOpen
            title="Alias Token"
            tokenArr={aliasTokenData}
            tokenPath={['components', component]}
            fallback={(themeConfig) => getDesignToken(themeConfig) as AliasToken}
            onTokenChange={(_, tokenName, value) => handleComponentTokenChange(tokenName, value)}
            placeholder={
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无相关 Alias Token"
                style={{
                  marginBlock: 0,
                  paddingBlock: 32,
                }}
              />
            }
          />
        </div>
      </div>
    </Drawer>
  );
};

export default ({ ...props }: ComponentTokenDrawerProps) => (
  <ConfigProvider theme={{ algorithm: defaultAlgorithm }}>
    <ComponentTokenDrawer {...props} />
  </ConfigProvider>
);
