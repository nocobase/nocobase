import { genStyleHook } from './../__builtins__';

export const useStyles = genStyleHook('nb-variable', (token) => {
  const { componentCls, lineWidth, colorFillQuaternary } = token;
  const inputPaddingHorizontalBase = token.paddingSM - 1;
  const tagPaddingHorizontal = 8; // Fixed padding.
  const paddingInline = tagPaddingHorizontal - lineWidth;
  const tagFontSize = token.fontSizeSM;
  const tagLineHeight = `${token.lineHeightSM * tagFontSize}px`;
  const defaultBg = colorFillQuaternary;
  const lightColor = token[`blue1`];
  const lightBorderColor = token[`blue3`];
  const textColor = token[`blue7`];

  return {
    [componentCls]: {
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
        color: textColor,
        background: lightColor,
        borderColor: lightBorderColor,
      },

      '.clear-button': {
        position: 'absolute',
        top: '50%',
        insetInlineStart: 'auto',
        insetInlineEnd: inputPaddingHorizontalBase,
        zIndex: 1,
        display: 'inline-block',
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
        opacity: 0,
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
    },
  };
});
