import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => {
  return {
    cardActionDisabled: {
      color: token.colorTextDisabled,
      cursor: 'not-allowed',
    },
    pageHeader: {
      paddingBottom: 0,
      paddingTop: token.paddingSM,
      paddingInline: token.paddingLG,
      '.ant-page-header-footer': { marginBlockStart: '0' },
      '& .ant-tabs-nav': {
        marginBottom: 0,
      },
    },

    pageContent: {
      margin: token.marginLG,
    },

    PluginDetailBaseInfo: {
      display: 'flex',
      flexDirection: 'column',
    },

    PluginDocument: {
      background: token.colorBgContainer,
      padding: token.paddingLG,
      height: '60vh',
      overflowY: 'auto',
    },

    CommonCard: {
      width: `calc(20% - ${token.marginLG}px)`,
      marginRight: token.marginLG,
      marginBottom: token.marginLG,
      transition: 'all 0.35s ease-in-out',
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
