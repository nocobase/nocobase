export function isValidFilter(condition: any) {
  if (!condition) {
    return false;
  }
  // Check if condition is a non-empty object
  if (typeof condition === 'object' && condition !== null && Object.keys(condition).length > 0) {
    return true;
  }

  const group = condition.$and || condition.$or;

  if (!group) {
    return false;
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
