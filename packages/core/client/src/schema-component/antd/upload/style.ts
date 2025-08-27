/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('upload', (token) => {
  const { componentCls, antCls } = token;

  return {
    [`${componentCls}-wrapper`]: {
      '&.nb-upload.nb-upload-small': {
        [`${componentCls}-list-picture-card-container`]: {
          margin: '0 3px 3px 0 !important',
          height: '32px !important',
          width: '32px !important',
          marginBlock: '0 !important',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item-name${componentCls}-list-item-name`]: {
          display: 'none !important',
        },
        [`${componentCls}-list-picture ${componentCls}-list-item, ${componentCls}-list-picture-card ${componentCls}-list-item`]:
          {
            borderRadius: '4px',
            padding: '1px !important',
            [`${componentCls}-list-item-image`]: {
              borderRadius: '2px',
            },
          },
      },
      '&.nb-upload-large': {
        [`${componentCls}-list-picture-card-container`]: {
          margin: '0 3px 3px 0 !important',
          height: '160px !important',
          width: '160px !important',
          marginBlock: '0 28px !important',
        },
      },
      '&.nb-upload': {
        [`${componentCls}-list-item, ${componentCls}-list-item-list-type-picture-card`]: {
          padding: '3px !important',
        },
        [`${componentCls}-list-item-thumbnail`]: {
          img: {
            objectFit: 'cover !important',
          },
        },
        [`${componentCls}-list-item-actions`]: {
          left: 'auto !important',
          right: '2px !important',
          top: '2px !important',
          transform: 'none !important',
          width: 'fit-content !important',

          [`${antCls}-btn-text:hover, ${antCls}-btn-text:focus`]: {
            background: 'rgba(0, 0, 0, 0.4)',
          },
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item-info`]: {
          overflow: 'inherit',
          width: '100%',
          height: '100%',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item-name`]: {
          display: 'block !important',
          marginTop: '5px',
          fontSize: '13px',
          color: '#636363',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item::before`]: {
          display: 'none !important',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item-progress`]: {
          bottom: 'calc(50% - 11px)',
          left: `${token.margin / 2}px`,
          pointerEvents: 'none',
        },
        [`${antCls}-btn`]: {
          background: 'rgba(0, 0, 0, 0.5)',
        },
        // Override Ant Design's default upload icon styles to ensure all icons have white color
        [`${componentCls}-list-picture-card .ant-upload-list-item-actions .anticon`]: {
          zIndex: 10,
          width: '16px',
          margin: '0 4px',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'all 0.1s',
          color: '#fff !important',
          '&:hover': {
            color: '#fff !important',
          },
        },
        [`${componentCls}-list-picture-card-container`]: {
          // marginBlock: '0 28px !important',
        },
      },

      [`${componentCls}-list-item-error`]: {
        [`${componentCls}-list-item-info img`]: {
          opacity: 0.6,
        },
      },

      [`${componentCls}-drag`]: {
        [`${componentCls}-drag-container`]: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',

          ul: {
            color: token.colorTextSecondary,
            [`${componentCls}-hint`]: {
              textAlign: 'left',
            },
          },
        },
      },
    },
  } as any;
});

export const useUploadStyles = useStyles;
