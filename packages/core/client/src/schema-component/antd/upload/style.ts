import { genStyleHook } from '../__builtins__';

export const useStyles = genStyleHook('upload', (token) => {
  const { componentCls, antCls } = token;

  return {
    [`${componentCls}-wrapper`]: {
      '&.nb-upload-small': {
        [`${componentCls}-list-picture-card-container${componentCls}-list-picture-card-container`]: {
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
            padding: '1px !important',
          },
      },
      '&.nb-upload-large': {
        [`${componentCls}-list-picture-card-container${componentCls}-list-picture-card-container`]: {
          margin: '0 3px 3px 0 !important',
          height: '160px !important',
          width: '160px !important',
          marginBlock: '0 28px !important',
        },
      },
      '&.nb-upload': {
        [`${componentCls}-list-item${componentCls}-list-item-list-type-picture-card`]: {
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
          marginTop: '10px',
          fontSize: '13px',
          color: '#636363',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item::before`]: {
          display: 'none !important',
        },
        [`${componentCls}-list-picture-card ${componentCls}-list-item-progress`]: {
          bottom: 'calc(50% - 11px)',
          pointerEvents: 'none',
        },
        [`${antCls}-btn`]: {
          background: 'rgba(0, 0, 0, 0.5)',
        },
        [`${componentCls}-list-picture-card-container`]: {
          marginBlock: '0 28px !important',
        },
      },
    },
  } as any;
});
