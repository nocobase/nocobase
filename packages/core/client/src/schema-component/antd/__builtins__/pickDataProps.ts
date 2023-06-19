export const pickDataProps = (props: any = {}) => {
  const results = {};

  for (const key in props) {
    if (key.indexOf('data-') > -1) {
      results[key] = props[key];
    }
  }

  return results;
};
