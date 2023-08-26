import { Tabs } from 'antd';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { Theme } from '../../../types';
import type { SelectedToken } from '../interface';
import { useLocale } from '../locale';
import { tokenCategory } from '../meta';
import type { TokenGroup } from '../meta/interface';
import makeStyle from '../utils/makeStyle';
import AliasPanel from './AliasPanel';
import TokenContent from './TokenContent';

const useStyle = makeStyle('TokenPanelPro', (token) => ({
  '.token-panel-pro': {
    height: '100%',
    display: 'flex',
    borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
    [`.token-panel-pro-tabs${token.rootCls}-tabs`]: {
      height: '100%',
      overflow: 'auto',
      [`${token.rootCls}-tabs-content`]: {
        height: '100%',
        [`${token.rootCls}-tabs-tabpane`]: {
          height: '100%',
        },
      },
    },
  },
}));

export type TokenPanelProProps = {
  className?: string;
  style?: React.CSSProperties;
  theme: Theme;
  selectedTokens?: SelectedToken;
  onTokenSelect?: (token: string | string[], type: keyof SelectedToken) => void;
  infoFollowPrimary?: boolean;
  onInfoFollowPrimaryChange?: (value: boolean) => void;
  aliasOpen?: boolean;
  onAliasOpenChange?: (value: boolean) => void;
  activeTheme?: string;
};

const TokenPanelPro: FC<TokenPanelProProps> = ({
  className,
  style,
  theme,
  selectedTokens,
  onTokenSelect,
  infoFollowPrimary,
  onInfoFollowPrimaryChange,
  aliasOpen,
  onAliasOpenChange,
}) => {
  const [wrapSSR, hashId] = useStyle();
  const [activeGroup, setActiveGroup] = useState<string>('brandColor');
  const locale = useLocale();

  const activeCategory = useMemo(() => {
    return tokenCategory.reduce<TokenGroup<string> | undefined>((result, category) => {
      return result ?? category.groups.find((group) => group.key === activeGroup);
    }, undefined);
  }, [activeGroup]);

  useEffect(() => {
    onTokenSelect?.(activeCategory?.seedToken ?? [], 'seed');
  }, [activeCategory]);

  return wrapSSR(
    <div className={classNames(hashId, className, 'token-panel-pro')} style={style}>
      <Tabs
        defaultActiveKey="color"
        tabBarGutter={32}
        tabBarStyle={{ padding: '0 16px', margin: 0 }}
        style={{ height: '100%', flex: '0 0 540px' }}
        className="token-panel-pro-tabs"
        onChange={(key) => {
          setActiveGroup(tokenCategory.find((category) => category.nameEn === key)?.groups[0].key ?? '');
        }}
        items={tokenCategory.map((category) => ({
          key: category.nameEn,
          label: locale._lang === 'zh-CN' ? category.name : category.nameEn,
          children: (
            <TokenContent
              category={category}
              theme={theme}
              selectedTokens={selectedTokens}
              onTokenSelect={onTokenSelect}
              infoFollowPrimary={infoFollowPrimary}
              onInfoFollowPrimaryChange={onInfoFollowPrimaryChange}
              activeGroup={activeGroup}
              onActiveGroupChange={setActiveGroup}
            />
          ),
        }))}
      />
      <AliasPanel
        open={aliasOpen}
        description={activeCategory?.aliasTokenDescription}
        onOpenChange={(value) => onAliasOpenChange?.(value)}
        activeSeeds={activeCategory?.seedToken}
        theme={theme}
        style={{ flex: aliasOpen ? '0 0 320px' : 'none', width: 0 }}
        selectedTokens={selectedTokens}
        onTokenSelect={onTokenSelect}
      />
    </div>,
  );
};

export default TokenPanelPro;
