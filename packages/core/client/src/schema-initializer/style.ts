import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => {
  return {
    nbMenuItemGroup: {
      maxHeight: '50vh',
      overflowY: 'auto',
    },

    nbMenuItemSubMenu: {
      maxHeight: '50vh',
      overflowY: 'auto',
      boxShadow: token.boxShadowSecondary,
      borderRadius: token.borderRadiusLG,
    },
  };
});
