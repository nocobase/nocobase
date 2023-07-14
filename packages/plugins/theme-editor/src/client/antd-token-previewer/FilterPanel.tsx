import { Segmented, Tag } from 'antd';
import classNames from 'classnames';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import type { CSSProperties, FC } from 'react';
import React from 'react';
import makeStyle from './utils/makeStyle';

const useStyle = makeStyle('FilterPanel', (token) => ({
  '.previewer-filter-panel': {
    // boxShadow:
    //   '0 2px 4px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(25,15,15,0.07), 0 0 1px 0 rgba(0,0,0,0.08)',
    // backgroundColor: '#fff',
    // borderRadius: 6,
    // padding: '8px 12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'start',

    '.component-tree-head': {
      display: 'flex',
      alignItems: 'center',
      flex: 'none',
      marginInlineEnd: 20,

      '.component-tree-filter-type': {
        color: token.colorTextSecondary,
        marginInlineEnd: token.marginXS,
        fontSize: token.fontSizeSM,
      },

      '.component-tree-filter-segmented': {
        fontSize: token.fontSizeSM,
      },
    },

    '.preview-panel-subtitle': {
      fontSize: token.fontSizeSM,
      color: token.colorTextSecondary,
    },

    [`${token.rootCls}-tag.previewer-token-filter-tag`]: {
      color: token.colorPrimary,
      backgroundColor: 'rgba(22,119,255,0.10)',
      border: 'none',
      borderRadius: 4,

      '> .anticon': {
        color: token.colorPrimary,
      },
    },
  },
}));

export type FilterMode = 'highlight' | 'filter';

export type FilterPanelProps = {
  filterMode?: FilterMode;
  onFilterModeChange?: (mode: FilterMode) => void;
  selectedTokens: string[];
  onSelectedTokensChange?: (newTokens: string[]) => void;
  onTokenClick?: (token: string) => void;
  className?: string;
  style?: CSSProperties;
};

const FilterPanel: FC<FilterPanelProps> = ({
  className,
  filterMode: customFilterMode,
  onFilterModeChange,
  selectedTokens,
  onSelectedTokensChange,
  onTokenClick,
  ...rest
}) => {
  const [wrapSSR, hashId] = useStyle();

  const [filterMode, setFilterMode] = useMergedState<FilterMode>(customFilterMode || 'filter');

  if (selectedTokens.length === 0) {
    return null;
  }

  return wrapSSR(
    <div className={classNames('previewer-filter-panel', hashId, className)} {...rest}>
      {selectedTokens && selectedTokens.length > 0 && (
        <>
          <div className="component-tree-head">
            <div className="component-tree-filter-type">筛选方式：</div>
            <Segmented
              className="component-tree-filter-segmented"
              size="small"
              value={filterMode}
              onChange={(value) => {
                onFilterModeChange?.(value as any);
                setFilterMode(value as any);
              }}
              options={[
                { label: '过滤', value: 'filter' },
                { label: '高亮', value: 'highlight' },
              ]}
            />
          </div>
          <div>
            <span className="preview-panel-subtitle">已选中：</span>
            {selectedTokens.map((token) => (
              <Tag
                key={token}
                closable
                onClose={() => onSelectedTokensChange?.(selectedTokens?.filter((item) => item !== token))}
                style={{ marginBlock: 2, cursor: 'pointer' }}
                className="previewer-token-filter-tag"
                onClick={() => onTokenClick?.(token)}
              >
                {token}
              </Tag>
            ))}
          </div>
        </>
      )}
    </div>,
  );
};

export default FilterPanel;
