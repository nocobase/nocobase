export function deepFind(value: any, fn: (v: any) => boolean) {
  const res = [];
  function deep(v) {
    if (fn?.(v)) {
      res.push(v);
    } else if (v?.properties) {
      Object.keys(v?.properties).forEach((key) => {
        deep(v.properties[key]);
      });
    }
  }
  deep(value);
  return res;
}

export function deepGetParents(value: any, fn: (v: any) => boolean) {
  const res = [];
  function deep(v) {
    if (v?.parent) {
      res.unshift(v);
    }
    if (fn(v?.parent) !== true) {
      deep(v?.parent);
    }
  }
  deep(value);
  return res;
}
