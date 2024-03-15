const getSubAppName = (publicPath = '/') => {
  const pattern = `^${publicPath}apps/([^/]*)/`;
  const match = window.location.pathname.match(pattern);
  if (!match) {
    return '';
  }
  return match[1];
};

export default getSubAppName;
