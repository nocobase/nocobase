import * as types from './types';

export const groups= new Map(Object.entries({
  basic: '基本类型',
  media: '多媒体类型',
  choices: '选择类型',
  datetime: '日期和时间',
  relation: '关系类型',
  systemInfo: '系统信息',
  developerMode: '开发者模式',
  others: '其他'
}));

export const interfaces = new Map<string, any>();

export function registerInterface(name: string, options: any) {
  interfaces.set(name, options);
}

export function registerInterfaces(values: any) {
  Object.keys(values).forEach(name => {
    registerInterface(name, {
      ...values[name],
      interface: name,
    });
  });
}

export function getOptions() {
  const options = [];
  const map = new Map();
  for (const [key, item] of interfaces) {
    const { title, group } = item;
    if (!map.has(group)) {
      map.set(group, []);
    }
    map.get(group).push({
      key: key,
      value: key,
      label: title,
    });
  }
  for (const [key, label] of groups) {
    options.push({
      key,
      label,
      children: map.get(key) || [],
    });
  }
  return options;
}

export function getInterfaceLinkages() {
  let xlinkages = [];
  for (const [key, item] of interfaces) {
    const { linkages = {}, properties = {} } = item;
    xlinkages.push({
      "type": "value:visible",
      "target": `x-${key}-props.*`,
      "condition": `{{ $self.value === '${key}' }}`,
    });
    if (linkages.interface) {
      xlinkages.push(linkages.interface);
    }
    if (linkages.interface) {
      xlinkages = xlinkages.concat(linkages.interface.map(linkage => {
        if (properties[linkage.target]) {
          linkage.target = `x-${key}-props.${linkage.target}`;
        }
        return linkage;
      }));
    }
  }
  return xlinkages;
}

export function getInterfaceFields() {
  const fields = new Map();
  fields.set('interface', {
    interface: 'select',
    type: 'string',
    name: 'interface',
    title: '字段类型',
    required: true,
    dataSource: getOptions(),
    createOnly: true,
    component: {
      type: 'select',
    },
    linkages: getInterfaceLinkages(),
  });
  for (const [key, item] of interfaces) {
    const { properties = {}, linkages = {} } = item;
    Object.keys(properties).forEach(name => {
      const property = {
        ...properties[name],
        name,
      };
      if (property.type === 'virtual') {
        property.name = `x-${key}-props.${name}`;
      }
      if (linkages[name]) {
        property.linkages = linkages[name].map((linkage: any) => {
          linkage.target = `x-${key}-props.${linkage.target}`;
          return linkage;
        });
      }
      fields.set(`x-${key}-props.${name}`, property);
    });
  }
  return [...fields.values()];
}

registerInterfaces(types);
