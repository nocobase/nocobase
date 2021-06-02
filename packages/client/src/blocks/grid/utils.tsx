import set from 'lodash/set';
import { uid } from '@formily/shared';

export const grid = (...rows: any[]) => {
  const rowProperties = {};
  rows.forEach((row, index) => {
    set(row, 'x-component-props.rowOrder', index);
    rowProperties[row.name] = row;
  });
  const name = `g_${uid()}`;
  return {
    type: 'void',
    name,
    'x-component': 'Grid',
    'x-component-props': {},
    properties: rowProperties,
  };
};

export const row = (...cols: any[]) => {
  const rowName = `r_${uid()}`;
  const colsProperties = {};
  cols.forEach((col, index) => {
    set(col, 'x-component-props.columnOrder', index);
    set(col, 'x-component-props.span', 24 / cols.length);
    colsProperties[col.name] = col;
  });
  return {
    type: 'void',
    name: rowName,
    'x-component': 'Grid.Row',
    'x-component-props': {},
    properties: colsProperties,
  };
};

export const column = (...blocks: any[]) => {
  const colName = `c_${uid()}`;
  const properties = {};
  blocks.forEach((item) => {
    properties[item.name] = item;
  });
  return {
    name: colName,
    type: 'void',
    'x-component': 'Grid.Column',
    'x-read-pretty': true,
    'x-component-props': {
      labelCol: 6,
      wrapperCol: 10,
      span: 24,
    },
    properties,
  };
};

export const block = (...fields: any[]) => {
  const blockName = `b_${uid()}`;
  const properties = {};
  fields.forEach((item) => {
    const name = item.name || `f_${uid()}`;
    properties[name] = item;
  });
  const lastComponentType = fields[fields.length - 1]['x-component'];
  return {
    name: blockName,
    type: 'void',
    'x-component': 'Grid.Block',
    'x-component-props': {
      lastComponentType,
    },
    'x-read-pretty': false,
    properties,
  };
};

export function blocks2properties(blocks: any[]) {
  const obj = {
    rows: [],
  };
  blocks.forEach(block => {
    const path = ['rows', block['rowOrder'], block['columnOrder'], block['blockOrder']];
    console.log(path);
    set(obj, path, block);
  });
  return grid(...obj.rows.filter(Boolean).map((cols) => {
    return row(
      ...cols.filter(Boolean).map((items: any[]) => {
        console.log({items: items.filter(Boolean)})
        return column(...items.filter(Boolean).map(item => block(item)));
      }),
    );
  }));
}
