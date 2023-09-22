import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ token, css }) => {
  return {
    mobileMenu: css`
      --adm-color-primary: ${token.colorPrimary};
      --adm-color-primary-hover: ${token.colorPrimaryHover};
      --adm-color-primary-active: ${token.colorPrimaryActive};
      --padding-left: ${token.paddingSM}px;
      --adm-color-background: ${token.colorBgContainer};
      --adm-color-border: ${token.colorBorder};

      background: ${token.colorBgContainer};
      width: 100%;
      margin-bottom: var(--nb-spacing);
    `,
  };
});

export default useStyles;
