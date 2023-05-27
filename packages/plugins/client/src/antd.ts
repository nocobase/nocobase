export const getAntdLocale = (lang) => {
  const lng = lang.replace('-', '_');
  try {
    return import(`antd/es/locale/${lng}`);
  } catch (error) {
    return import(`antd/es/locale/en_US`);
  }
};
