/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, CardProps } from 'antd';
import React, { useMemo, useRef, useEffect, createContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldSchema } from '@formily/react';
import { useToken } from '../../../style';
import { MarkdownReadPretty } from '../markdown';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';
import { BlockLinkageRuleProvider } from '../../../modules/blocks/BlockLinkageRuleProvider';

export const BlockItemCardContext = createContext({});

export const BlockItemCard = React.forwardRef<HTMLDivElement, CardProps | any>(({ children, ...props }, ref) => {
  const { token } = useToken();
  const { title: blockTitle, description, ...others } = props;
  const style = useMemo(() => {
    return { marginBottom: token.marginBlock, height: '100%' };
  }, [token.marginBlock]);
  const [titleHeight, setTitleHeight] = useState(0);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const isBlockLinkage = fieldSchema['x-block-linkage-rules'];
  useEffect(() => {
    const timer = setTimeout(() => {
      if (titleRef.current) {
        const height = !description
          ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1
          : titleRef.current.parentElement.parentElement.parentElement.offsetHeight;
        setTitleHeight(height);
      } else {
        titleHeight && setTitleHeight(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [blockTitle, description]);
  const title = (blockTitle || description) && (
    <div ref={titleRef} style={{ padding: '8px 0px 8px' }}>
      <span> {t(blockTitle, { ns: NAMESPACE_UI_SCHEMA })}</span>
      {description && (
        <MarkdownReadPretty
          value={t(description, { ns: NAMESPACE_UI_SCHEMA })}
          style={{
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            fontWeight: 400,
            color: token.colorTextDescription,
            borderRadius: '4px',
          }}
        />
      )}
    </div>
  );
  const content = (
    <BlockItemCardContext.Provider value={{ titleHeight: titleHeight }}>
      <Card ref={ref} bordered={false} style={style} {...others} title={title}>
        {children}
      </Card>
    </BlockItemCardContext.Provider>
  );
  return !isBlockLinkage ? content : <BlockLinkageRuleProvider>{content}</BlockLinkageRuleProvider>;
});

BlockItemCard.displayName = 'BlockItemCard';
