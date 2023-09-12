import { CaretRightOutlined, QuestionCircleOutlined, RightOutlined, ShrinkOutlined } from '@ant-design/icons';
import { Button, Collapse, Empty, Tooltip } from 'antd';
import classNames from 'classnames';
import useMergedState from 'rc-util/es/hooks/useMergedState';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import { MutableTheme } from '../../../types';
import { Pick } from '../icons';
import type { AliasToken, SelectedToken } from '../interface';
import { mapRelatedAlias, seedRelatedAlias } from '../meta/TokenRelation';
import makeStyle from '../utils/makeStyle';
import { getRelatedComponents } from '../utils/statistic';
import TokenDetail from './TokenDetail';

const { Panel } = Collapse;

const useStyle = makeStyle('TokenPanelProAlias', (token) => ({
  '.token-panel-pro-color-alias': {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 45,
    borderTop: `1px solid ${token.colorSplit}`,

    '.token-panel-pro-color-alias-title': {
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      flex: '0 0 60px',

      '&-text': {
        fontSize: token.fontSizeLG,
        fontWeight: token.fontWeightStrong,
      },
    },

    '.token-panel-pro-color-alias-description': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      padding: '0 16px 12px',
    },

    [`.token-panel-pro-alias-collapse${token.rootCls}-collapse`]: {
      [`> ${token.rootCls}-collapse-item > ${token.rootCls}-collapse-content > ${token.rootCls}-collapse-content-box`]:
        {
          paddingBlock: '0',
        },

      [`> ${token.rootCls}-collapse-item`]: {
        [`> ${token.rootCls}-collapse-header`]: {
          alignItems: 'center',
          padding: '8px 16px',
          [`> ${token.rootCls}-collapse-header-text`]: {
            flex: 1,

            '.token-panel-pro-token-collapse-map-collapse-count': {
              color: token.colorTextSecondary,
              display: 'inline-block',
              fontSize: 12,
              lineHeight: '16px',
              padding: '0 6px',
              backgroundColor: token.colorFillAlter,
              borderRadius: 999,
            },
          },

          '.token-panel-pro-token-picked': {
            color: token.colorPrimary,
          },
        },
      },
    },

    '.token-panel-pro-color-alias-expand': {
      height: '100%',
      width: 20,
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      '&:hover': {
        '.token-panel-pro-color-alias-expand-handler': {
          opacity: 1,
        },
      },

      '.token-panel-pro-color-alias-expand-handler': {
        height: 100,
        width: 16,
        borderRadius: 999,
        border: `1px solid ${token.colorSplit}`,
        backgroundColor: '#fff',
        margin: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'box-shadow 0.2s',

        '&:hover': {
          boxShadow: token.boxShadow,
        },
      },
    },
  },
}));

export type AliasPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  theme: MutableTheme;
  activeSeeds?: string[];
  selectedTokens?: SelectedToken;
  onTokenSelect?: (token: string, type: keyof SelectedToken) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  description?: string;
};

const AliasPanel: FC<AliasPanelProps> = ({
  className,
  activeSeeds,
  theme,
  style,
  selectedTokens,
  onTokenSelect,
  open: customOpen,
  onOpenChange,
  description,
}) => {
  const [wrapSSR, hashId] = useStyle();
  const [open, setOpen] = useMergedState(customOpen ?? true, {
    value: customOpen,
    onChange: onOpenChange,
  });

  const shownAlias = useMemo(
    () =>
      selectedTokens?.map?.length
        ? Array.from(
            new Set(
              selectedTokens?.map.reduce<string[]>((result, map) => {
                return result.concat(...((mapRelatedAlias as any)[map] ?? []));
              }, []),
            ),
          )
        : activeSeeds?.reduce<(keyof AliasToken)[]>(
            (result, item) => result.concat((seedRelatedAlias as any)[item] ?? []),
            [],
          ),
    [selectedTokens, activeSeeds],
  );

  return wrapSSR(
    <div className={classNames(className, 'token-panel-pro-color-alias', hashId)} style={style}>
      {open ? (
        <>
          <div className="token-panel-pro-color-alias-title">
            <span className="token-panel-pro-color-alias-title-text">Alias Token</span>
            <Tooltip
              placement="topLeft"
              arrowPointAtCenter
              title="别名变量（Alias Token）是 Map Token 的别名。Alias Token 用于批量控制某些共性组件的样式。"
            >
              <QuestionCircleOutlined style={{ fontSize: 14, marginLeft: 4 }} />
            </Tooltip>
            <Button
              type="text"
              icon={<ShrinkOutlined />}
              style={{ marginLeft: 'auto' }}
              onClick={() => setOpen(false)}
            />
          </div>
          {description && <div className="token-panel-pro-color-alias-description">{description}</div>}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Collapse
              className="token-panel-pro-alias-collapse"
              ghost
              expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: 12 }} />}
            >
              {shownAlias?.map((aliasToken) => (
                <Panel
                  header={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{aliasToken}</span>
                      <span className="token-panel-pro-token-collapse-map-collapse-count">
                        {getRelatedComponents(aliasToken).length}
                      </span>
                      <div
                        style={{ padding: 4, marginLeft: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTokenSelect?.(aliasToken, 'alias');
                        }}
                      >
                        <Pick
                          className={classNames('token-panel-pro-token-pick', {
                            'token-panel-pro-token-picked': selectedTokens?.alias?.includes(aliasToken),
                          })}
                        />
                      </div>
                    </div>
                  }
                  key={aliasToken}
                >
                  <TokenDetail
                    style={{ paddingBottom: 10 }}
                    themes={[theme]}
                    path={['token']}
                    tokenName={aliasToken as keyof AliasToken}
                  />
                </Panel>
              ))}
            </Collapse>
            {!shownAlias?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无相关 Alias Token" />}
          </div>
        </>
      ) : (
        <div className="token-panel-pro-color-alias-expand">
          <div className="token-panel-pro-color-alias-expand-handler" onClick={() => setOpen(true)}>
            <RightOutlined style={{ fontSize: 12 }} />
          </div>
        </div>
      )}
    </div>,
  );
};

export default AliasPanel;
