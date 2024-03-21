import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => {
  return {
    cardActionDisabled: {
      color: token.colorTextDisabled,
      cursor: 'not-allowed',
    },
    pageHeader: {
      backgroundColor: token.colorBgContainer,
      paddingTop: token.paddingSM,
      paddingBottom: 0,
      paddingInline: token.paddingLG,
      '.ant-page-header-footer': { marginBlockStart: '0' },
      '& .ant-tabs-nav': {
        marginBottom: 0,
      },
      '.ant-page-header-heading-title': {
        color: token.colorText,
      },
    },
    pageContent: {
      margin: token.marginLG,
    },
    // pageContent: {
    //   marginTop: token.margin,
    //   marginBottom: token.marginLG,
    //   background: 'transparent',
    //   minHeight: '80vh',
    // },

    PluginDetailBaseInfo: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: token.margin,
    },

    PluginDocument: {
      background: token.colorBgContainer,
      padding: token.paddingLG,
      height: '60vh',
      overflowY: 'auto',
    },

    avatar: {
      '.ant-card-meta-avatar': {
        marginTop: '8px',
        '.ant-avatar': { borderRadius: '2px' },
      },
    },

    version: {
      display: 'block',
      color: token.colorTextDescription,
      fontWeight: 'normal',
      fontSize: token.fontSize,
    },
  };
});
