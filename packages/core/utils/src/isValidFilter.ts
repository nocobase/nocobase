export function isValidFilter(condition: any) {
  if (!condition) {
    return false;
  }

  const group = condition.$and || condition.$or;

  if (!group) {
    return Object.keys(condition).length > 0;
  }

  return group.some((item) => {
    if (item.$and || item.$or) {
      return isValidFilter(item);
    }

    const [name] = Object.keys(item);
    if (!name || !item[name]) {
      return false;
    }
    const [op] = Object.keys(item[name]);

    if (!op || typeof item[name][op] === 'undefined') {
      return false;
    }

    return true;
  });
}
