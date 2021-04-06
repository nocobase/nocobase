import PageLoader from '@/components/pages';

// TODO：这部分现在还是写在代码里的，待改进
export const templates = {
  AdminLoader: require('@/components/pages/AdminLoader').default,
  login: require('@/pages/login').default,
  register: require('@/pages/register').default,
  lostpassword: require('@/pages/lostpassword').default,
  resetpassword: require('@/pages/resetpassword').default,
};

export default PageLoader;
