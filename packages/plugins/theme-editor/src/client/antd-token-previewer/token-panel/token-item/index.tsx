import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse, Space } from 'antd';
import type { ThemeConfig } from 'antd/es/config-provider/context';
import classNames from 'classnames';
import type { CSSProperties } from 'react';
import React, { useEffect, useMemo } from 'react';
import ColorPreview from '../../ColorPreview';
import TokenInput from '../../TokenInput';
import { Pick } from '../../icons';
import type { MutableTheme, TokenValue } from '../../interface';
import getValueByPath from '../../utils/getValueByPath';
import isColor from '../../utils/isColor';
import makeStyle from '../../utils/makeStyle';
import { getRelatedComponents } from '../../utils/statistic';

const { Panel } = Collapse;

interface TokenItemProps {
  tokenName: string;
  tokenPath: string[];
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onTokenChange?: (theme: MutableTheme, tokenName: string, value: TokenValue) => void;
  themes: MutableTheme[];
  selectedTokens?: string[];
  onTokenSelect?: (token: string) => void;
  enableTokenSelect?: boolean;
  hideUsageCount?: boolean;
  fallback?: (config: ThemeConfig) => Record<string, TokenValue>;
}

const AdditionInfo = ({
  info,
  visible,
  tokenName,
  style,
  dark,
  ...rest
}: {
  info: string | number;
  visible: boolean;
  tokenName: string;
  dark?: boolean;
  style?: CSSProperties;
  className?: string;
}) => {
  if (typeof info === 'string' && isColor(info)) {
    return <ColorPreview dark={dark} color={String(info)} style={{ display: visible ? 'block' : 'none', ...style }} />;
  }

  if (info.toString().length < 6 && String(info) !== '') {
    return (
      <div
        style={{
          height: 20,
          overflow: 'hidden',
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: '8px',
          display: visible ? 'block' : 'none',
          padding: '0 6px',
          lineHeight: '20px',
          ...style,
        }}
        {...rest}
      >
        {info}
      </div>
    );
  }

  return null;
};

const ShowUsageButton = ({ selected, toggleSelected }: { selected: boolean; toggleSelected: (v: boolean) => void }) => {
  return (
    <Pick
      style={{
        color: selected ? '#1890ff' : undefined,
        cursor: 'pointer',
        fontSize: 16,
        transition: 'color 0.3s',
        marginInlineStart: 12,
        verticalAlign: 'middle',
      }}
      onClick={() => toggleSelected(!selected)}
    />
  );
};

const useStyle = makeStyle('TokenItem', (token) => ({
  [`${token.rootCls}-collapse.previewer-token-item-collapse`]: {
    [`.previewer-token-item${token.rootCls}-collapse-item`]: {
      transition: `background-color ${token.motionDurationSlow}`,
      borderRadius: { _skip_check_: true, value: `4px !important` },

      [`&:not(${token.rootCls}-collapse-item-active):hover`]: {
        backgroundColor: '#f5f5f5',
      },

      [`> ${token.rootCls}-collapse-header`]: {
        padding: '12px 8px',
      },

      [`${token.rootCls}-collapse-header-text`]: {
        flex: 1,
        width: 0,
      },
      [`${token.rootCls}-collapse-content-box`]: {
        padding: '0 4px',
      },
      [`${token.rootCls}-collapse-expand-icon`]: {
        paddingInlineEnd: `${token.paddingXXS}px !important`,
      },
      '.previewer-token-count': {
        height: 16,
        fontSize: token.fontSizeSM,
        lineHeight: '16px',
        borderRadius: 100,
        paddingInline: token.paddingXXS * 1.5,
        color: token.colorTextSecondary,
        backgroundColor: token.colorFillAlter,
      },

      '.previewer-token-item-name': {
        transition: 'color 0.3s',
      },

      '.previewer-token-item-highlighted.previewer-token-item-name': {
        color: `${token.colorPrimary} !important`,
      },

      '&:hover .previewer-token-preview': {
        '> .previewer-color-preview:not(:last-child)': {
          transform: 'translateX(-100%)',
          marginInlineEnd: 4,
        },
      },

      '.previewer-token-preview': {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',

        '> .previewer-color-preview': {
          position: 'absolute',
          insetInlineEnd: 0,
          top: 0,
          bottom: 0,
          margin: 'auto',
        },

        '> .previewer-color-preview:not(:last-child)': {
          transform: 'translateX(-50%)',
          marginInlineEnd: 0,
          transition: 'transform 0.3s, margin-right 0.3s',
        },

        '> *:not(:last-child)': {
          marginInlineEnd: 4,
        },
      },
    },
  },
}));

export const getTokenItemId = (token: string) => `previewer-token-panel-item-${token}`;

export default ({
  tokenName,
  active,
  onActiveChange,
  onTokenChange,
  tokenPath,
  selectedTokens,
  themes,
  onTokenSelect,
  enableTokenSelect,
  hideUsageCount,
  fallback,
}: TokenItemProps) => {
  const [infoVisible, setInfoVisible] = React.useState(false);
  const [wrapSSR, hashId] = useStyle();

  useEffect(() => {
    if (active) {
      setInfoVisible(true);
    }
  }, [active]);

  const handleTokenChange = (theme: MutableTheme, value: TokenValue) => {
    onTokenChange?.(theme, tokenName, value);
  };

  const count = useMemo(() => getRelatedComponents(tokenName).length, [tokenName]);

  return wrapSSR(
    <div onMouseEnter={() => onActiveChange?.(false)}>
      <Collapse
        collapsible="header"
        ghost
        onChange={(key) => setInfoVisible(key.length > 0)}
        className={classNames('previewer-token-item-collapse', hashId)}
        expandIcon={({ isActive }) => (
          <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: 12, cursor: 'pointer' }} />
        )}
        activeKey={infoVisible ? tokenName : undefined}
      >
        <Panel
          key={tokenName}
          className="previewer-token-item"
          header={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              id={getTokenItemId(tokenName)}
            >
              <span
                style={{
                  flex: 1,
                  width: 0,
                  display: 'flex',
                  overflow: 'hidden',
                  alignItems: 'center',
                }}
              >
                <span
                  title={tokenName}
                  className={classNames('previewer-token-item-name', {
                    'previewer-token-item-highlighted': active,
                  })}
                  style={{
                    marginInlineEnd: '5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {tokenName}
                </span>
                {!hideUsageCount && <span className="previewer-token-count">{count}</span>}
              </span>
              {!infoVisible && (
                <div
                  className="previewer-token-preview"
                  style={{
                    minWidth: themes.length * 20 + (themes.length - 1) * 4,
                  }}
                >
                  {themes.map(({ config, key }, index) => {
                    return (
                      <AdditionInfo
                        key={key}
                        dark={key === 'dark'}
                        tokenName={tokenName}
                        info={getValueByPath(config, [...tokenPath, tokenName]) ?? fallback?.(config)[tokenName] ?? ''}
                        visible={!infoVisible}
                        style={{
                          zIndex: 10 - index,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          }
          extra={
            enableTokenSelect ? (
              <ShowUsageButton
                selected={!!selectedTokens?.includes(tokenName)}
                toggleSelected={() => {
                  onTokenSelect?.(tokenName);
                }}
              />
            ) : undefined
          }
        >
          <Space
            direction="vertical"
            style={{
              background: '#fafafa',
              borderRadius: 4,
              padding: 8,
              width: '100%',
            }}
          >
            {themes.map((theme) => {
              return (
                <div key={theme.key}>
                  <TokenInput
                    hideTheme={themes.length === 1}
                    theme={theme}
                    onChange={(value) => handleTokenChange(theme, value)}
                    value={
                      getValueByPath(theme.config, [...tokenPath, tokenName]) ?? fallback?.(theme.config)[tokenName]
                    }
                  />
                </div>
              );
            })}
          </Space>
        </Panel>
      </Collapse>
    </div>,
  );
};
