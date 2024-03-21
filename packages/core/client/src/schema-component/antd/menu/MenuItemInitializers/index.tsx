import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => ({
  menuItem: {
    paddingLeft: `${token.padding}px !important`,
    paddingRight: `${token.padding}px !important`,
  },
}));
