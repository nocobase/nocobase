const getSubAppName = () => {
  const match = window.location.pathname.match(/^\/apps\/([^/]*)\//);
  if (!match) {
    return '';
  }
  return match[1].toUpperCase();
};

export default getSubAppName;
