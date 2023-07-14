import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => {
  return {
    pageHeader: {
      backgroundColor: token.colorBgContainer,
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

    PluginDetail: {
      '.ant-modal-header': { paddingBottom: token.paddingXS },
      '.ant-modal-body': { paddingTop: 0 },
      '.ant-modal-content': {
        '.plugin-desc': { paddingBottom: token.paddingXS },
      },
      '.version-tag': {
        verticalAlign: 'middle',
        marginTop: -token.marginXXS,
        marginLeft: token.marginXS,
      },
    },

    PluginDocument: {
      background: token.colorBgContainer,
      padding: token.paddingLG,
      height: '60vh',
      overflowY: 'auto',
    },
  };
});
