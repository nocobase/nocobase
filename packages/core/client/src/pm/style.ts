import { createStyles } from 'antd-style';

export const useStyles = createStyles(() => {
  return {
    pageHeader: {
      backgroundColor: 'white',
      paddingBottom: 0,
      paddingTop: 12,
      '& .ant-tabs-nav': {
        marginBottom: 0,
      },
    },
  };
});
