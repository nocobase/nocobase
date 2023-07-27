export const getAntdLocale = (lang) => {
  const lng = lang.replace('-', '_');
  try {
    require.resolve(`antd/lib/locale/${lng}`);
    return require(`antd/lib/locale/${lng}`).default;
  } catch (error) {
    return require(`antd/lib/locale/en_US`).default;
  }
};
