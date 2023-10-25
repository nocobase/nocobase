import { genStyleHook } from './../__builtins__';

export const useStyles = genStyleHook('nb-variable', (token) => {
  const { componentCls, lineWidth, colorFillQuaternary } = token;
  const inputPaddingHorizontalBase = token.paddingSM - 1;
  const tagPaddingHorizontal = 8; // Fixed padding.
  const paddingInline = tagPaddingHorizontal - lineWidth;
  const tagFontSize = token.fontSizeSM;
  const tagLineHeight = `${token.lineHeightSM * tagFontSize}px`;
  const defaultBg = colorFillQuaternary;

  return {
    [componentCls]: {
      width: 'auto',
      display: 'flex',
      '&.ant-input-group-compact': { display: 'flex' },
      '.ant-input-disabled': {
        '.ant-tag': { color: '#bfbfbf', borderColor: '#d9d9d9' },
      },
      '.ant-input.null-value': { width: '4em', minWidth: '4em' },

      '.ant-formily-item .ant-formily-item-control .ant-formily-item-control-content .ant-formily-item-control-content-component':
        {
          lineHeight: 'normal',
        },

      '.ant-formily-item': {
        marginBottom: 0,
      },

      '.ant-input': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },

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
      },

      '.ant-tag-blue': {
        color: token.colorPrimaryText,
        background: token.colorPrimaryBg,
        borderColor: token.colorPrimaryBorder,
      },

      '.clear-button': {
        position: 'absolute',
        top: '50%',
        insetInlineStart: 'auto',
        insetInlineEnd: inputPaddingHorizontalBase,
        zIndex: 1,
        display: 'none',
        width: token.fontSizeIcon,
        height: token.fontSizeIcon,
        marginTop: -token.fontSizeIcon / 2,
        color: token.colorTextQuaternary,
        fontSize: token.fontSizeIcon,
        fontStyle: 'normal',
        lineHeight: 1,
        textAlign: 'center',
        textTransform: 'none',
        background: token.colorBgContainer,
        cursor: 'pointer',
        opacity: 0.8,
        transition: `color ${token.motionDurationMid} ease, opacity ${token.motionDurationSlow} ease`,
        textRendering: 'auto',
        userSelect: 'none',

        '&:before': {
          display: 'block',
        },

        '&:hover': {
          color: token.colorTextTertiary,
        },
      },

      '.ant-btn': {
        height: 'auto',
      },

      '.variable': {
        flex: 1,
      },
    },
  };
});
