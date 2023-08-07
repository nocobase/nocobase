import { Tooltip } from 'antd';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import { MutableTheme } from '../../../types';
import TokenInput from '../TokenInput';
import type { TokenValue } from '../interface';
import { useLocale } from '../locale';
import { mapRelatedAlias } from '../meta/TokenRelation';
import deepUpdateObj from '../utils/deepUpdateObj';
import getDesignToken from '../utils/getDesignToken';
import getValueByPath from '../utils/getValueByPath';
import makeStyle from '../utils/makeStyle';
import { getRelatedComponents } from '../utils/statistic';
import tokenMeta from './token-meta.json';

const useStyle = makeStyle('TokenDetail', (token) => ({
  '.token-panel-token-detail': {
    '.token-panel-pro-token-collapse-map-collapse-token-description': {
      color: token.colorTextPlaceholder,
      marginBottom: 8,
      fontSize: 12,
    },

    '.token-panel-pro-token-collapse-map-collapse-token-usage-tag-container': {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      color: token.colorTextSecondary,
    },

    '.token-panel-pro-token-collapse-map-collapse-token-usage-tag': {
      display: 'inline-block',
      marginInlineEnd: 8,
      borderRadius: 4,
      height: 20,
      padding: '0 8px',
      fontSize: 12,
      lineHeight: '20px',
      backgroundColor: 'rgba(0,0,0,0.015)',
    },

    '.token-panel-pro-token-collapse-map-collapse-token-inputs': {
      padding: '8px 10px',
      backgroundColor: 'rgba(0,0,0,0.02)',
      marginTop: 12,
      '> *:not(:last-child)': {
        marginBottom: 8,
      },
    },
  },
}));

export type TokenDetailProps = {
  themes: MutableTheme[];
  path: string[];
  tokenName: string;
  className?: string;
  style?: React.CSSProperties;
};

const TokenDetail: FC<TokenDetailProps> = ({ themes, path, tokenName, className, style }) => {
  const [wrapSSR, hashId] = useStyle();
  const tokenPath = [...path, tokenName];
  const locale = useLocale();

  const handleTokenChange = (theme: MutableTheme) => (value: TokenValue) => {
    theme.onThemeChange?.(deepUpdateObj(theme.config, [...path, tokenName], value), [...path, tokenName]);
  };

  const relatedComponents = useMemo(() => {
    return getRelatedComponents([tokenName, ...((mapRelatedAlias as any)[tokenName] ?? [])]);
  }, [tokenName]);

  return wrapSSR(
    <div className={classNames(className, hashId, 'token-panel-token-detail')} style={style}>
      <div className="token-panel-pro-token-collapse-map-collapse-token-description">
        {(tokenMeta as any)[tokenName]?.[locale._lang === 'zh-CN' ? 'desc' : 'descEn']}
      </div>
      {relatedComponents.length > 0 && (
        <Tooltip title={getRelatedComponents(tokenName).join(', ')} placement="topLeft">
          <div className="token-panel-pro-token-collapse-map-collapse-token-usage-tag-container">
            {relatedComponents.map((item) => (
              <span key={item} className="token-panel-pro-token-collapse-map-collapse-token-usage-tag">
                {item}
              </span>
            ))}
          </div>
        </Tooltip>
      )}
      <div className="token-panel-pro-token-collapse-map-collapse-token-inputs">
        {themes.map((themeItem) => {
          return (
            <div key={themeItem.key}>
              <TokenInput
                hideTheme={themes.length === 1}
                theme={themeItem}
                canReset={themeItem.getCanReset?.(tokenPath)}
                onReset={() => themeItem.onReset?.(tokenPath)}
                onChange={handleTokenChange(themeItem)}
                value={
                  getValueByPath(themeItem.config, tokenPath) ?? (getDesignToken(themeItem.config) as any)[tokenName]
                }
              />
            </div>
          );
        })}
      </div>
    </div>,
  );
};

export default TokenDetail;
