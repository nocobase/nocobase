import { createStyles } from 'antd-style';

export const useStyles = createStyles(() => {
  return {
    toolbar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      zIndex: 1,

      '&:hover > div': {
        display: 'block !important',
      },
    },
    toolbarContent: {
      position: 'absolute',
      zIndex: 999,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      display: 'none',
      border: '2px solid var(--colorBorderSettingsHover)',
      background: 'var(--colorBgSettingsHover)',
      pointerEvents: 'none',

      '.ant-space-item .anticon': {
        margin: 0,
      },
    },
    toolbarTitle: {
      pointerEvents: 'none',
      position: 'absolute',
      fontSize: 12,
      padding: 0,
      lineHeight: '16px',
      height: '16px',
      borderBottomRightRadius: 2,
      borderRadius: 2,
      top: 2,
      left: 2,
    },
    toolbarTitleTag: {
      padding: '0 3px',
      borderRadius: 2,
      background: 'var(--colorSettings)',
      color: '#fff',
      display: 'block',
    },
    toolbarIcons: {
      position: 'absolute',
      right: '2px',
      top: '2px',
      lineHeight: '16px',
      pointerEvents: 'all',
      '.ant-space-item': {
        backgroundColor: 'var(--colorSettings)',
        color: '#fff',
        lineHeight: '16px',
        width: '16px',
        paddingLeft: '1px',
        alignSelf: 'stretch',
      },
    },
  };
});
