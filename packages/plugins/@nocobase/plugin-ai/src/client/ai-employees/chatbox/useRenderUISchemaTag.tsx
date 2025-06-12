/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { genStyleHook } from '@nocobase/client';
import { Schema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuildOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useT } from '../../locale';

export const useStyles = genStyleHook('nb-ai-uischema-tag', (token) => {
  const { componentCls, lineWidth, colorFillQuaternary } = token;
  const tagPaddingHorizontal = 8;
  const paddingInline = tagPaddingHorizontal - lineWidth;
  const tagFontSize = token.fontSizeSM;
  const tagLineHeight = `${token.lineHeightSM * tagFontSize}px`;
  const defaultBg = colorFillQuaternary;

  return {
    [componentCls]: {
      '.ant-tag': {
        display: 'inline-block',
        height: 'auto',
        marginInlineEnd: token.marginXS,
        paddingInline,
        fontSize: tagFontSize,
        lineHeight: tagLineHeight,
        whiteSpace: 'nowrap',
        background: defaultBg,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
        borderRadius: token.borderRadiusSM,
        opacity: 1,
        transition: `all ${token.motionDurationMid}`,
        textAlign: 'start',
        cursor: 'pointer',
      },

      '.ant-tag-blue': {
        color: token.colorPrimaryText,
        background: token.colorPrimaryBg,
        borderColor: token.colorPrimaryBorder,
      },
    },
  };
});

export const useRenderUISchemaTag = (value: string) => {
  const styles = useStyles();
  const { ctx } = useAISelectionContext();
  const t = useT();
  const { t: collectionT } = useTranslation('lm-collections');
  const icon = renderToStaticMarkup(<BuildOutlined />);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    const tag = target.closest('span[data-variable]');
    if (tag) {
      const key = tag.getAttribute('data-variable');
      if (!key) return;

      navigator.clipboard
        .writeText(`{{$UISchema.${key}}}`)
        .then(() => {
          message.success(t('Copied'));
        })
        .catch((err) => {
          console.error('Copy failed', err);
        });
    }
  };

  const html = useMemo(() => {
    const regex = /\{\{\$UISchema\.([^}]+)\}\}/g;
    return value?.replace(regex, (_, i) => {
      const key = i.trim();
      let title = '';
      if (ctx[key]?.collection) {
        title = Schema.compile(ctx[key].collection.title, { t: collectionT });
        title = `${title} `;
      }
      return `<span class="ant-tag ant-tag-blue" contentEditable="false" data-variable="${key}">${icon} ${title}#${key}</span>`;
    });
  }, [value, ctx]);

  return {
    html,
    styles,
    handleClick,
  };
};
