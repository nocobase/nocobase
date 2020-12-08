import _ from 'lodash';

export function filterByFields(data: any, fields: any = {}): any {
  const {
    only = Array.isArray(fields) ? fields : null,
    except = []
  } = fields;

  // ['user.profile.age', 'user.status', 'user', 'title', 'status']
  // to
  // {
  //   user: {
  //     profile: { age: true },
  //     status: true
  //   },
  //   title: true,
  //   status: true
  // }
  // 
  function makeMap(array: string[]) {
    const map = {};
    array.forEach(key => {
      _.set(map, key, true);
    });

    return map;
  }

  const onlyMap = only ? makeMap(only) : null;
  const exceptMap = makeMap(except);

  function filter(value, { onlyMap, exceptMap }: { onlyMap?: any, exceptMap?: any }) {
    const isArray = Array.isArray(value);
    const values = isArray ? value : [value];

    const results = values.map(v => {
      const result = {};
      Object.keys(v).forEach(key => {
        // 未定义 except 时继续判断 only
        if (!exceptMap || typeof exceptMap[key] === 'undefined') {
          if (onlyMap) {
            if (typeof onlyMap[key] !== 'undefined') {
              // 防止 fields 参数和传入类型不匹配时的报错
              if (onlyMap[key] === true || typeof v[key] !== 'object') {
                result[key] = v[key];
              } else {
                result[key] = filter(v[key], { onlyMap: onlyMap[key] });
              }
            }
          } else {
            result[key] = v[key];
          }
        } else {
          // 定义了 except 子级
          if (typeof exceptMap[key] === 'object' && typeof v[key] === 'object') {
            result[key] = filter(v[key], {
              // onlyMap[key] === true 或不存在时，对子级只考虑 except
              onlyMap: onlyMap && typeof onlyMap[key] === 'object' ? onlyMap[key] : null,
              exceptMap: exceptMap[key]
            });
          }
          // 其他情况直接跳过
        }
      });

      return result;
    });

    return isArray ? results : results[0];
  }

  return filter(data, { onlyMap, exceptMap });
}
