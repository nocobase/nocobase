import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => {
  return {
    pageHeader: {
      backgroundColor: token.colorBgContainer,
      paddingBottom: 0,
      paddingTop: token.paddingSM,
      paddingInline: token.paddingLG,
      '& .ant-tabs-nav': {
        marginBottom: 0,
      },
    },
  };
});
