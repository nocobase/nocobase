import { ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import ComponentDemos from '../component-demos';
import type { ComponentDemo, MutableTheme, TokenName } from '../interface';
import { useLocale } from '../locale';
import makeStyle from '../utils/makeStyle';
import ComponentCard, { getComponentDemoId } from './ComponentCard';

const useStyle = makeStyle('ComponentDemoGroup', (token) => ({
  '.previewer-component-demo-group': {
    display: 'flex',
    width: '100%',
    overflow: 'hidden',

    '&:first-child': {
      '.previewer-component-demo-group-item': {
        paddingTop: token.padding,
      },
    },

    '&:last-child': {
      '.previewer-component-demo-group-item': {
        paddingBottom: token.padding,
      },
    },
  },
}));

const useDemoStyle = makeStyle('ComponentDemoBlock', (token) => ({
  '.previewer-component-demo-group-item': {
    flex: '1 1 50%',
    paddingInline: token.padding,
    paddingBlock: token.padding / 2,
    width: 0,
    backgroundColor: token.colorBgLayout,

    '.previewer-component-demo-group-item-relative-token': {
      color: token.colorTextSecondary,
      paddingBottom: 8,

      '&:not(:first-child)': {
        marginTop: 12,
      },
    },
  },
}));

type ComponentDemoBlockProps = {
  component: string;
  onTokenClick?: (token: TokenName) => void;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  demos?: (ComponentDemo & { active?: boolean })[];
  theme: MutableTheme;
  componentDrawer?: boolean;
};

const ComponentDemoBlock: FC<ComponentDemoBlockProps> = ({
  component,
  onTokenClick,
  size = 'middle',
  disabled = false,
  demos = [],
  theme,
  componentDrawer,
}) => {
  const [, hashId] = useDemoStyle();
  const locale = useLocale();

  return (
    <div className={classNames('previewer-component-demo-group-item', hashId)}>
      <ComponentCard
        title={component}
        component={component}
        onTokenClick={onTokenClick}
        drawer={componentDrawer}
        theme={theme}
      >
        <ConfigProvider componentSize={size} componentDisabled={disabled}>
          {demos.some((item) => item.active)
            ? demos.map((demo) => (
                <div key={demo.key} style={{ display: demo.active ? '' : 'none' }}>
                  {demo.tokens && (
                    <div className="previewer-component-demo-group-item-relative-token">
                      <Tooltip title={demo.tokens.join(', ')}>
                        <span>
                          {locale.demo.relatedTokens}: {demo.tokens.slice(0, 2).join(', ')}
                          {demo.tokens.length > 2 ? '...' : ''}
                        </span>
                      </Tooltip>
                    </div>
                  )}
                  {demo.demo}
                </div>
              ))
            : demos[0]?.demo}
        </ConfigProvider>
      </ComponentCard>
    </div>
  );
};

type ComponentDemoGroupProps = {
  themes: MutableTheme[];
  components: Record<string, string[]>;
  activeComponents?: string[];
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  selectedTokens?: string[];
  onTokenClick?: (token: TokenName) => void;
  componentDrawer?: boolean;
  hideTokens?: boolean;
};

const ComponentDemoGroup: FC<ComponentDemoGroupProps> = ({
  themes,
  components,
  size,
  disabled,
  activeComponents,
  selectedTokens,
  onTokenClick,
  componentDrawer,
  hideTokens,
}) => {
  const [wrapSSR, hashId] = useStyle();

  return wrapSSR(
    <>
      {Object.entries(components)
        .reduce<string[]>((result, [, group]) => result.concat(group), [])
        .map((item) => {
          const componentDemos = ComponentDemos[item];
          if (!componentDemos) {
            return null;
          }
          const demos: ComponentDemo[] = componentDemos.map((demo, index) => {
            return {
              ...demo,
              tokens: hideTokens ? undefined : demo.tokens,
              active:
                ((!selectedTokens || selectedTokens.length === 0) && index === 0) ||
                selectedTokens?.some((token) => demo.tokens?.includes(token as any)),
            };
          });

          return (
            <div
              className={classNames('previewer-component-demo-group', hashId)}
              key={item}
              id={getComponentDemoId(item)}
              style={{
                display:
                  !activeComponents || activeComponents.length === 0 || activeComponents.includes(item) ? '' : 'none',
              }}
            >
              {themes.length > 1 ? (
                themes.map((theme) => (
                  <ConfigProvider key={theme.key} theme={theme.config}>
                    <ComponentDemoBlock
                      component={item}
                      onTokenClick={onTokenClick}
                      demos={demos}
                      disabled={disabled}
                      size={size}
                      theme={theme}
                      componentDrawer={componentDrawer}
                    />
                  </ConfigProvider>
                ))
              ) : (
                <ComponentDemoBlock
                  component={item}
                  onTokenClick={onTokenClick}
                  demos={demos}
                  disabled={disabled}
                  size={size}
                  theme={themes[0]}
                  componentDrawer={componentDrawer}
                />
              )}
            </div>
          );
        })}
    </>,
  );
};

export default ComponentDemoGroup;
