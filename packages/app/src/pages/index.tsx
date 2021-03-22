import PageLoader from '@/components/pages';

export const templates = {
  TopMenuLayout: require('@/components/pages/TopMenuLayout').default,
  SideMenuLayout: require('@/components/pages/SideMenuLayout').default,
  AdminLoader: require('@/components/pages/AdminLoader').default,
  login: require('@/pages/login').default,
  register: require('@/pages/register').default,
  lostpassword: require('@/pages/lostpassword').default,
  resetpassword: require('@/pages/resetpassword').default,
};

export default PageLoader;
