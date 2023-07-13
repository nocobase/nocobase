export const forEach = (obj: any, callback: (value: any, key: string | number) => void) => {
  if (Array.isArray(obj)) {
    obj.forEach(callback);
  } else {
    Object.keys(obj).forEach((key) => {
      callback(obj[key], key);
    });
  }
};
