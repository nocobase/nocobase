const getSubAppName = (publicPath = '/') => {
  const prefix = `${publicPath}apps/`;
  if (!window.location.pathname.startsWith(prefix)) {
    return;
  }
  const pathname = window.location.pathname.substring(prefix.length);
  const args = pathname.split('/', 1);
  return args[0] || '';
};

export default getSubAppName;
