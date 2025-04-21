/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CaretRightOutlined, ExpandOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ThemeConfig } from '@nocobase/client';
import { StablePopover } from '@nocobase/client';
import { Button, Checkbox, Collapse, ConfigProvider, InputNumber, Switch, Tooltip, Typography } from 'antd';
import seed from 'antd/es/theme/themes/seed';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useDebouncyFn } from 'use-debouncy';
import { MutableTheme } from '../../../types';
import ColorPanel from '../ColorPanel';
import IconSwitch from '../IconSwitch';
import type { ThemeCode } from '../hooks/useControlledTheme';
import { themeMap } from '../hooks/useControlledTheme';
import { CompactTheme, DarkTheme, Light, Pick } from '../icons';
import type { SelectedToken } from '../interface';
import { useLocale } from '../locale';
import type { TokenCategory, TokenGroup } from '../meta/interface';
import getDesignToken from '../utils/getDesignToken';
import makeStyle from '../utils/makeStyle';
import InputNumberPlus from './InputNumberPlus';
import TokenDetail from './TokenDetail';
import TokenPreview from './TokenPreview';
import calcCustomToken from './calcCustomToken';
import tokenMeta from './token-meta.json';

const { Panel } = Collapse;

const useStyle = makeStyle('ColorTokenContent', (token) => ({
  '.token-panel-pro-color': {
    height: '100%',
    display: 'flex',
    '.token-panel-pro-color-seeds': {
      height: '100%',
      flex: 1,
      width: 0,
      borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',

      '.token-panel-pro-color-themes': {
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flex: '0 0 60px',

        '> span': {
          fontSize: token.fontSizeLG,
          fontWeight: token.fontWeightStrong,
        },
      },
    },
    [`.token-panel-pro-token-collapse${token.rootCls}-collapse`]: {
      flex: 1,
      overflow: 'auto',
      [`> ${token.rootCls}-collapse-item-active`]: {
        backgroundColor: '#fff',
        boxShadow:
          '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px -8px rgba(0,0,0,0.03), inset 0 0 0 2px #1677FF',
        transition: 'box-shadow 0.2s ease-in-out',
        borderRadius: 8,
      },
      [`> ${token.rootCls}-collapse-item > ${token.rootCls}-collapse-content > ${token.rootCls}-collapse-content-box`]:
        {
          paddingBlock: '0 12px',
        },

      '.token-panel-pro-token-collapse-description': {
        color: token.colorTextTertiary,
        marginBottom: 16,
      },

      '.token-panel-pro-token-collapse-subtitle': {
        color: token.colorTextSecondary,
        fontSize: 12,
      },

      '.token-panel-pro-token-collapse-seed-block': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',

        '+ .token-panel-pro-token-collapse-seed-block': {
          marginTop: 8,
        },

        '&-name-cn': {
          fontWeight: token.fontWeightStrong,
          marginInlineEnd: 4,
        },

        '&-name': {
          color: token.colorTextTertiary,
        },

        '&-sample': {
          flex: 'none',

          '&:not(:last-child)': {
            marginInlineEnd: 16,
          },

          '&-theme': {
            color: token.colorTextTertiary,
            marginBottom: 2,
            fontSize: 12,
            textAlign: 'end',
          },

          '&-card': {
            cursor: 'pointer',
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',

            '&-value': {
              fontFamily: 'Monaco,'.concat(token.fontFamily),
            },
          },
        },
      },

      [`.token-panel-pro-token-collapse-map-collapse${token.rootCls}-collapse`]: {
        borderRadius: 4,
        backgroundColor: '#fff',

        [`> ${token.rootCls}-collapse-item`]: {
          '&:not(:first-child)': {
            [`> ${token.rootCls}-collapse-header`]: {
              [`> ${token.rootCls}-collapse-header-text`]: {
                '.token-panel-pro-token-collapse-map-collapse-preview': {
                  '.token-panel-pro-token-collapse-map-collapse-preview-color': {
                    marginTop: -1,
                  },
                },
              },
            },
          },
          [`> ${token.rootCls}-collapse-header`]: {
            padding: { value: '0 12px 0 16px', _skip_check_: true },

            [`> ${token.rootCls}-collapse-expand-icon`]: {
              alignSelf: 'center',
            },

            [`> ${token.rootCls}-collapse-header-text`]: {
              flex: 1,

              '.token-panel-pro-token-collapse-map-collapse-token': {
                color: token.colorTextSecondary,
                marginInlineStart: 4,
                marginInlineEnd: 8,
              },

              '.token-panel-pro-token-collapse-map-collapse-preview': {
                display: 'flex',
                flex: 'none',
                '.token-panel-pro-token-collapse-map-collapse-preview-color': {
                  height: 56,
                  width: 56,
                  position: 'relative',
                  borderInline: '1px solid #e8e8e8',
                },
                '> *': {
                  marginInlineEnd: 8,
                },
              },
            },
          },

          [`> ${token.rootCls}-collapse-content > ${token.rootCls}-collapse-content-box`]: {
            padding: '0',
          },
        },
      },
    },

    '.token-panel-pro-token-collapse-map-collapse-count': {
      color: token.colorTextSecondary,
      // display: 'inline-block',
      fontSize: 12,
      lineHeight: '16px',
      padding: '0 6px',
      backgroundColor: token.colorFillAlter,
      borderRadius: 999,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    '.token-panel-pro-token-pick': {
      transition: 'color 0.3s',
    },

    '.token-panel-pro-token-picked': {
      color: token.colorPrimary,
    },

    [`.token-panel-pro-grouped-map-collapse${token.rootCls}-collapse`]: {
      borderRadius: 4,
      [`> ${token.rootCls}-collapse-item`]: {
        [`> ${token.rootCls}-collapse-header`]: {
          padding: '6px 12px',
          color: token.colorIcon,
          fontSize: 12,
          lineHeight: token.lineHeightSM,
          [`${token.rootCls}-collapse-expand-icon`]: {
            lineHeight: '20px',
            height: 20,
          },
        },
        [`> ${token.rootCls}-collapse-content > ${token.rootCls}-collapse-content-box`]: {
          padding: 0,

          [`.token-panel-pro-token-collapse-map-collapse${token.rootCls}-collapse`]: {
            border: 'none',

            [`${token.rootCls}-collapse-item:last-child`]: {
              borderBottom: 'none',
            },
          },
        },
      },
    },
  },
}));

export type SeedTokenProps = {
  theme: MutableTheme;
  tokenName: string;
  disabled?: boolean;
  alpha?: boolean;
};

const getSeedValue = (config: ThemeConfig, token: string) => {
  // @ts-ignore
  return config.token?.[token] || seed[token] || getDesignToken(config)[token];
};

const seedRange: Record<string, { min: number; max: number }> = {
  borderRadius: {
    min: 0,
    max: 16,
  },
  fontSize: {
    min: 12,
    max: 32,
  },
  sizeStep: {
    min: 0,
    max: 16,
  },
  sizeUnit: {
    min: 0,
    max: 16,
  },
};

const SeedTokenPreview: FC<SeedTokenProps> = ({ theme, tokenName, disabled, alpha }) => {
  const tokenPath = ['token', tokenName];
  const [tokenValue, setTokenValue] = useState(getSeedValue(theme.config, tokenName));
  const locale = useLocale();

  const debouncedOnChange = useDebouncyFn((newValue: number | string) => {
    theme.onThemeChange?.(
      {
        ...theme.config,
        token: {
          ...theme.config.token,
          ...calcCustomToken(tokenName, newValue),
        },
      },
      ['token', tokenName],
    );
  }, 500);

  const handleChange = (value: any) => {
    setTokenValue(value);
    debouncedOnChange(value);
  };

  useEffect(() => {
    setTokenValue(getSeedValue(theme.config, tokenName));
  }, [theme.config, tokenName]);

  const showReset = theme.getCanReset?.(tokenPath);

  return (
    <div className="token-panel-pro-token-collapse-seed-block-sample">
      <div className="token-panel-pro-token-collapse-seed-block-sample-theme">
        <Typography.Link
          style={{
            fontSize: 12,
            padding: 0,
            opacity: showReset ? 1 : 0,
            pointerEvents: showReset ? 'auto' : 'none',
          }}
          onClick={() => theme.onReset?.(tokenPath)}
        >
          {locale.reset}
        </Typography.Link>
      </div>
      {tokenName.startsWith('color') && (
        <StablePopover
          trigger="click"
          placement="bottomRight"
          overlayInnerStyle={{ padding: 0 }}
          content={<ColorPanel color={tokenValue} onChange={handleChange} style={{ border: 'none' }} alpha={alpha} />}
        >
          <div
            className="token-panel-pro-token-collapse-seed-block-sample-card"
            style={{ pointerEvents: disabled ? 'none' : 'auto' }}
          >
            <div
              style={{
                backgroundColor: tokenValue,
                width: 48,
                height: 32,
                borderRadius: 4,
                marginRight: 14,
                boxShadow: '0 2px 3px -1px rgba(0,0,0,0.20), inset 0 0 0 1px rgba(0,0,0,0.09)',
              }}
            />
            <div className="token-panel-pro-token-collapse-seed-block-sample-card-value">{tokenValue}</div>
          </div>
        </StablePopover>
      )}
      {['fontSize', 'sizeUnit', 'sizeStep', 'borderRadius'].includes(tokenName) && (
        <InputNumberPlus
          value={tokenValue}
          onChange={handleChange}
          min={seedRange[tokenName].min}
          max={seedRange[tokenName].max}
        />
      )}
      {tokenName === 'wireframe' && <Switch checked={tokenValue} onChange={handleChange} />}
      {['siderWidth'].includes(tokenName) && (
        <InputNumber defaultValue={200} value={tokenValue} onChange={handleChange} />
      )}
    </div>
  );
};

export type MapTokenCollapseContentProps = {
  mapTokens?: string[];
  theme: MutableTheme;
  selectedTokens?: SelectedToken;
  onTokenSelect?: (token: string | string[], type: keyof SelectedToken) => void;
  type?: string;
};

const MapTokenCollapseContent: FC<MapTokenCollapseContentProps> = ({
  mapTokens,
  theme,
  onTokenSelect,
  selectedTokens,
  type,
}) => {
  const locale = useLocale();

  return (
    <Collapse className="token-panel-pro-token-collapse-map-collapse">
      {mapTokens?.map((mapToken) => (
        <Panel
          header={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  width: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: 8,
                }}
              >
                {locale._lang === 'zh-CN' && (
                  <span style={{ fontWeight: 500, flex: 'none' }}>{(tokenMeta as any)[mapToken]?.name}</span>
                )}
                <span className="token-panel-pro-token-collapse-map-collapse-token" style={{ flex: 'none' }}>
                  {mapToken}
                </span>
                <span className="token-panel-pro-token-collapse-map-collapse-count">
                  {(getDesignToken(theme.config) as any)[mapToken]}
                </span>
              </div>
              <div className="token-panel-pro-token-collapse-map-collapse-preview">
                <div className="token-panel-pro-token-collapse-map-collapse-preview-color">
                  <TokenPreview theme={theme.config} tokenName={mapToken} type={type} />
                </div>
              </div>
              <div
                style={{ flex: 'none', margin: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTokenSelect?.(mapToken, 'map');
                }}
              >
                <Pick
                  className={classNames('token-panel-pro-token-pick', {
                    'token-panel-pro-token-picked': selectedTokens?.map?.includes(mapToken),
                  })}
                />
              </div>
            </div>
          }
          key={mapToken}
        >
          <TokenDetail style={{ margin: 8 }} themes={[theme]} path={['token']} tokenName={mapToken} />
        </Panel>
      ))}
    </Collapse>
  );
};

export type MapTokenCollapseProps = {
  theme: MutableTheme;
  group: TokenGroup<string>;
  selectedTokens?: SelectedToken;
  onTokenSelect?: (token: string | string[], type: keyof SelectedToken) => void;
  groupFn?: (token: string) => string;
};

const MapTokenCollapse: FC<MapTokenCollapseProps> = ({ theme, onTokenSelect, selectedTokens, groupFn, group }) => {
  const locale = useLocale();

  const groupedTokens = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    if (groupFn) {
      group.mapToken?.forEach((token) => {
        const key = groupFn(token) ?? 'default';
        grouped[key] = [...(grouped[key] ?? []), token];
      });
    }
    return grouped;
  }, [group, groupFn]);

  if (groupFn) {
    return (
      <Collapse
        className="token-panel-pro-grouped-map-collapse"
        defaultActiveKey={Object.keys(groupedTokens)}
        expandIconPosition="end"
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 450 : 360} style={{ fontSize: 12 }} />}
      >
        {(group.mapTokenGroups ?? Object.keys(groupedTokens)).map((key) => (
          <Panel key={key} header={(locale as any)[key] ?? ''}>
            <MapTokenCollapseContent
              mapTokens={groupedTokens[key]}
              theme={theme}
              selectedTokens={selectedTokens}
              onTokenSelect={onTokenSelect}
              type={group.type}
            />
          </Panel>
        ))}
      </Collapse>
    );
  }

  if (group.groups) {
    return (
      <Collapse
        className="token-panel-pro-grouped-map-collapse"
        defaultActiveKey={group.groups.map((item) => item.key)}
        expandIconPosition="end"
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 450 : 360} style={{ fontSize: 12 }} />}
      >
        {group.groups.map((item) => (
          <Panel key={item.key} header={item.name}>
            <MapTokenCollapseContent
              mapTokens={item.mapToken}
              theme={theme}
              selectedTokens={selectedTokens}
              onTokenSelect={onTokenSelect}
              type={item.type}
            />
          </Panel>
        ))}
      </Collapse>
    );
  }

  return (
    <MapTokenCollapseContent
      mapTokens={group.mapToken ?? []}
      theme={theme}
      selectedTokens={selectedTokens}
      onTokenSelect={onTokenSelect}
      type={group.type}
    />
  );
};

const groupMapToken = (token: string): string => {
  if (token.startsWith('colorFill')) {
    return 'fill';
  }
  if (token.startsWith('colorBorder') || token.startsWith('colorSplit')) {
    return 'border';
  }
  if (token.startsWith('colorBg')) {
    return 'background';
  }
  if (token.startsWith('colorText')) {
    return 'text';
  }
  return '';
};

export type ColorTokenContentProps = {
  category: TokenCategory<string>;
  theme: MutableTheme;
  selectedTokens?: SelectedToken;
  onTokenSelect?: (token: string | string[], type: keyof SelectedToken) => void;
  infoFollowPrimary?: boolean;
  onInfoFollowPrimaryChange?: (value: boolean) => void;
  activeGroup: string;
  onActiveGroupChange: (value: string) => void;
};

const TokenContent: FC<ColorTokenContentProps> = ({
  category,
  theme,
  selectedTokens,
  onTokenSelect,
  infoFollowPrimary,
  onInfoFollowPrimaryChange,
  activeGroup,
  onActiveGroupChange,
}) => {
  const [wrapSSR, hashId] = useStyle();
  const [grouped, setGrouped] = useState<boolean>(true);
  const locale = useLocale();

  const switchAlgorithm = (themeStr: 'dark' | 'compact') => () => {
    let newAlgorithm = theme.config.algorithm;
    if (!newAlgorithm) {
      newAlgorithm = themeMap[themeStr];
    } else if (Array.isArray(newAlgorithm)) {
      newAlgorithm = newAlgorithm.includes(themeMap[themeStr])
        ? newAlgorithm.filter((item) => item !== themeMap[themeStr])
        : [...newAlgorithm, themeMap[themeStr]];
    } else {
      newAlgorithm = newAlgorithm === themeMap[themeStr] ? undefined : [newAlgorithm, themeMap[themeStr]];
    }
    theme.onThemeChange?.({ ...theme.config, algorithm: newAlgorithm }, ['config', 'algorithm']);
  };

  const isLeftChecked = (str: ThemeCode) => {
    if (!theme.config.algorithm) {
      return true;
    }
    return Array.isArray(theme.config.algorithm)
      ? !theme.config.algorithm.includes(themeMap[str])
      : theme.config.algorithm !== themeMap[str];
  };

  return wrapSSR(
    <div className={classNames(hashId, 'token-panel-pro-color')}>
      <div className="token-panel-pro-color-seeds">
        <div className="token-panel-pro-color-themes">
          <span style={{ marginRight: 12 }}>{locale._lang === 'zh-CN' ? category.name : category.nameEn}</span>
          {category.nameEn === 'Color' && (
            <IconSwitch
              onChange={switchAlgorithm('dark')}
              leftChecked={isLeftChecked('dark')}
              leftIcon={<Light />}
              rightIcon={<DarkTheme />}
              style={{ marginLeft: 'auto' }}
            />
          )}
          {category.nameEn === 'Size' && (
            <IconSwitch
              onChange={switchAlgorithm('compact')}
              leftChecked={isLeftChecked('compact')}
              leftIcon={<ExpandOutlined />}
              rightIcon={<CompactTheme />}
              style={{ marginLeft: 'auto' }}
            />
          )}
        </div>
        <ConfigProvider
          theme={{
            token: {
              colorBorder: '#f0f0f0',
            },
          }}
        >
          <Collapse
            className="token-panel-pro-token-collapse"
            expandIconPosition="end"
            ghost
            accordion
            activeKey={activeGroup}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 450 : 360} style={{ fontSize: 12 }} />}
            onChange={(key) => {
              onActiveGroupChange(key as unknown as string);
            }}
          >
            {category.groups.map((group, index) => {
              return (
                <Panel
                  header={
                    <span style={{ fontWeight: 500 }}>{locale._lang === 'zh-CN' ? group.name : group.nameEn}</span>
                  }
                  key={group.key}
                >
                  <div>
                    <div className="token-panel-pro-token-collapse-description">
                      {locale._lang === 'zh-CN' ? group.desc : group.descEn}
                    </div>
                    {group.seedToken?.map((seedToken) => (
                      <div key={seedToken} className="token-panel-pro-token-collapse-seed-block">
                        <div style={{ marginRight: 'auto' }}>
                          <div className="token-panel-pro-token-collapse-subtitle">
                            <span style={{ fontSize: 12 }}>Seed Token</span>
                            <Tooltip
                              placement="topLeft"
                              arrowPointAtCenter
                              title={
                                locale._lang === 'zh-CN'
                                  ? (tokenMeta as any)[seedToken]?.desc
                                  : (tokenMeta as any)[seedToken]?.descEn
                              }
                            >
                              <QuestionCircleOutlined style={{ fontSize: 14, marginLeft: 8 }} />
                            </Tooltip>
                          </div>
                          <div>
                            <span className="token-panel-pro-token-collapse-seed-block-name-cn">
                              {locale._lang === 'zh-CN'
                                ? (tokenMeta as any)[seedToken]?.name
                                : (tokenMeta as any)[seedToken]?.nameEn}
                            </span>
                            {seedToken === 'colorInfo' && (
                              <Checkbox
                                style={{ marginLeft: 12 }}
                                checked={infoFollowPrimary}
                                onChange={(e) => onInfoFollowPrimaryChange?.(e.target.checked)}
                              >
                                {locale.followPrimary}
                              </Checkbox>
                            )}
                          </div>
                        </div>
                        <SeedTokenPreview
                          alpha={!!group.seedTokenAlpha}
                          theme={theme}
                          tokenName={seedToken}
                          disabled={seedToken === 'colorInfo' && infoFollowPrimary}
                        />
                      </div>
                    ))}
                    {(group.mapToken || group.groups) && (
                      <div style={{ marginTop: 16, marginBottom: 24 }}>
                        <div
                          className="token-panel-pro-token-collapse-subtitle"
                          style={{
                            marginBottom: 10,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <span>Map Token</span>
                          <Tooltip
                            placement="topLeft"
                            arrowPointAtCenter
                            title="梯度变量（Map Token） 是基于 Seed 派生的梯度变量，我们精心设计的梯度变量模型具有良好的视觉设计语义，可在亮暗色模式切换时保证视觉梯度的一致性。"
                          >
                            <QuestionCircleOutlined style={{ fontSize: 14, marginLeft: 8 }} />
                          </Tooltip>
                          {group.mapTokenGroups && (
                            <div
                              style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <label style={{ marginRight: 4 }}>{locale.groupView}</label>
                              <Switch checked={grouped} onChange={(v) => setGrouped(v)} size="small" />
                            </div>
                          )}
                        </div>
                        <MapTokenCollapse
                          group={group}
                          theme={theme}
                          selectedTokens={selectedTokens}
                          onTokenSelect={onTokenSelect}
                          groupFn={group.mapTokenGroups && grouped ? groupMapToken : undefined}
                        />
                      </div>
                    )}
                    {index < category.groups.length - 1 && (
                      <Button
                        type="primary"
                        style={{ borderRadius: 4, marginBottom: 12 }}
                        onClick={() => onActiveGroupChange(category.groups[index + 1]?.key)}
                      >
                        {locale.next}
                      </Button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        </ConfigProvider>
      </div>
    </div>,
  );
};

export default TokenContent;
