const deepUpdateObj = (obj: any, path: string[], value: any): any => {
  if (path.length === 0) {
    return obj;
  }
  if (path.length === 1) {
    if (value === null || value === undefined) {
      const newObj = { ...obj };
      delete newObj[path[0]];
      return newObj;
    }
    return {
      ...obj,
      [path[0]]: value,
    };
  }
  return {
    ...obj,
    [path[0]]: deepUpdateObj(obj[path[0]] ?? {}, path.slice(1), value),
  };
};

export default deepUpdateObj;
