/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TinyColor } from '@ctrl/tinycolor';
import { css } from '@emotion/css';
import { theme } from 'antd';
import { useGlobalTheme } from '../../../../../global-theme';

export const useMarkdownStyles = () => {
  const { token } = theme.useToken();
  const { isDarkTheme } = useGlobalTheme();

  const colorFillAlterSolid = new TinyColor(token.colorFillAlter)
    .onBackground(token.colorBgContainer)
    .toHexShortString();

  const defaultStyle: any = {
    lineHeight: 'inherit',
    // default style of markdown
    '&.nb-markdown-default': {
      'pre code.hljs': { display: 'block', overflowX: 'auto', padding: '1em' },
      'code.hljs': { padding: '3px 5px' },
      ':not(pre) code': {
        padding: '2px 5px',
        color: '#d56161',
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusSM,
      },
      blockquote: {
        borderLeft: '4px solid #ccc',
        paddingLeft: '20px',
        marginLeft: '0',
        color: '#666',
        fontStyle: 'italic',
      },
      img: { maxWidth: '100%' },
      '.hljs': { background: '#f8f8f8', color: '#444' },
      '.hljs-comment': { color: '#697070' },
      '.hljs-punctuation,.hljs-tag': { color: '#444a' },
      '.hljs-tag .hljs-attr,.hljs-tag .hljs-name': { color: '#444' },
      '.hljs-attribute,.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-name,.hljs-selector-tag': {
        fontWeight: 700,
      },
      '.hljs-deletion,.hljs-number,.hljs-quote,.hljs-selector-class,.hljs-selector-id,.hljs-string,.hljs-template-tag,.hljs-type':
        {
          color: '#800',
        },
      '.hljs-section,.hljs-title': { color: '#800', fontWeight: 700 },
      '.hljs-link,.hljs-operator,.hljs-regexp,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-symbol,.hljs-template-variable,.hljs-variable':
        {
          color: '#ab5656',
        },
      '.hljs-literal': { color: '#695' },
      '.hljs-addition,.hljs-built_in,.hljs-bullet,.hljs-code': {
        color: '#397300',
      },
      '.hljs-meta': { color: '#1f7199' },
      '.hljs-meta .hljs-string': { color: '#38a' },
      '.hljs-emphasis': { fontStyle: 'italic' },
      '.hljs-strong': { fontWeight: 700 },
    },

    // table style of markdown
    '&.nb-markdown-table': {
      table: {
        borderCollapse: 'collapse',
        width: '100%',
        fontFamily: 'Arial, sans-serif',
        marginBottom: '1.5rem',
      },
      'th, td': {
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: `${token.paddingContentVertical}px ${token.paddingContentHorizontal}px`,
        textAlign: 'left',
      },
      th: {
        backgroundColor: colorFillAlterSolid,
        fontWeight: 'bold',
        color: token.colorText,
      },
      'tr:hover': { backgroundColor: token.colorFillTertiary },
      'tr:last-child td': { borderBottom: 'none' },
      'tr:first-child th': { borderTop: 'none' },
    },
  };

  const darkStyle: any = {
    // default style of markdown
    '&.nb-markdown-default': {
      'pre code.hljs': { display: 'block', overflowX: 'auto', padding: '1em' },
      'code.hljs': { padding: '3px 5px' },
      ':not(pre) code': {
        padding: '2px 5px',
        color: '#d56161',
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusSM,
      },
      '.hljs': { color: '#adbac7', background: '#22272e' },
      '.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_':
        {
          color: '#f47067',
        },
      '.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_': {
        color: '#dcbdfb',
      },
      '.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable':
        {
          color: '#6cb6ff',
        },
      '.hljs-meta .hljs-string,.hljs-regexp,.hljs-string': { color: '#96d0ff' },
      '.hljs-built_in,.hljs-symbol': { color: '#f69d50' },
      '.hljs-code,.hljs-comment,.hljs-formula': { color: '#768390' },
      '.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag': {
        color: '#8ddb8c',
      },
      '.hljs-subst': { color: '#adbac7' },
      '.hljs-section': { color: '#316dca', fontWeight: 700 },
      '.hljs-bullet': { color: '#eac55f' },
      '.hljs-emphasis': { color: '#adbac7', fontStyle: 'italic' },
      '.hljs-strong': { color: '#adbac7', fontWeight: 700 },
      '.hljs-addition': { color: '#b4f1b4', backgroundColor: '#1b4721' },
      '.hljs-deletion': { color: '#ffd8d3', backgroundColor: '#78191b' },
    },

    // table style of markdown
    '&.nb-markdown-table': {
      table: {
        borderCollapse: 'collapse',
        width: '100%',
        fontFamily: 'Arial, sans-serif',
        marginBottom: '1.5rem',
      },
      'th, td': {
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: `${token.paddingContentVertical}px ${token.paddingContentHorizontal}px`,
        textAlign: 'left',
      },
      th: {
        backgroundColor: colorFillAlterSolid,
        fontWeight: 'bold',
        color: token.colorText,
      },
      'tr:hover': { backgroundColor: token.colorFillTertiary },
      'tr:last-child td': { borderBottom: 'none' },
      'tr:first-child th': { borderTop: 'none' },
    },
  };
  return css({
    lineHeight: token.lineHeight,
    '& > *:last-child': { marginBottom: '0' },
    '.ant-description-textarea, .ant-description-input': { lineHeight: token.lineHeight },
    '.field-interface-datetime': { minWidth: '100px' },
    ...(isDarkTheme ? darkStyle : defaultStyle),
  });
};
