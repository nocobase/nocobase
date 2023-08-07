export default function getValueByPath(obj: any, path: string[]): any {
  if (!obj) {
    return undefined;
  }
  return path.reduce((prev, key) => {
    if (prev) {
      return prev[key];
    }
    return undefined;
  }, obj);
}
