/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItem, useRequest, useAPIClient, useDesignable, usePlugin } from '@nocobase/client';
import React from 'react';
import { CopyOutlined, LoadingOutlined } from '@ant-design/icons';
// import { cloneDeep } from 'lodash';
import * as _ from 'lodash';
import { uid } from '@nocobase/utils/client';
import PluginBlockTemplateClient from '..';

export function convertTplBlock(tpl, virtual = false, isRoot = true, newRootId?: string) {
  if (!newRootId) {
    newRootId = uid();
  }
  // 如果是Grid, Grid.Row, Grid.Col, 则复制一份
  if (tpl['x-component'] === 'Grid' || tpl['x-component'] === 'Grid.Row' || tpl['x-component'] === 'Grid.Col') {
    // const newTpl = cloneDeep(tpl);
    // TODO: 这么做内部的一些引用会丢失， 准备维护一个key的映射表，然后再遍历一次，替换掉引用
    const newTpl = _.cloneDeep({
      ...tpl,
      'x-virtual': virtual,
      'x-uid': uid(), // 生成一个新的uid
      properties: {},
    });
    if (newTpl['x-initializer'] === 'template:addBlock') {
      delete newTpl['x-initializer'];
    }
    for (const key in tpl.properties) {
      const t = convertTplBlock(tpl.properties[key], virtual, isRoot, newRootId);
      if (isRoot) {
        newRootId = uid(); // 多个Grid.Row的时候，每个Grid.Row都要生成一个新的uid
      }
      if (t) {
        newTpl.properties[key] = t;
      }
    }
    return newTpl;
  } else {
    const newSchema = {
      // ...tpl,
      // 'x-component': rootComponent === tpl ? 'XTemplate' : tpl['x-component'],
      // 'x-decorator': tpl['x-decorator'],
      // type: rootComponent ? 'void' : tpl.type,
      // name: tpl.name,
      'x-uid': `${newRootId}-${tpl['x-uid']}`,
      'x-template-uid': tpl['x-uid'],
      'x-virtual': virtual,
      properties: {},
    };

    if (isRoot) {
      newSchema['x-template-root-uid'] = tpl['x-uid'];
      newSchema['x-uid'] = newRootId;
    }
    // filter should be in tpl
    if (_.get(tpl, 'x-filter-targets')) {
      newSchema['x-filter-targets'] = tpl['x-filter-targets'];
    }
    for (const key in tpl.properties) {
      newSchema.properties[key] = convertTplBlock(tpl.properties[key], virtual, false, newRootId);
    }
    return newSchema;
  }
}

function getSchemaUidMaps(schema, idMap = {}) {
  if (schema['x-template-uid']) {
    idMap[schema['x-template-uid']] = schema['x-uid'];
  }
  if (schema.properties) {
    for (const key in schema.properties) {
      getSchemaUidMaps(schema.properties[key], idMap);
    }
  }
  return idMap;
}

function correctIdReference(schema, idMaps) {
  for (const key in schema) {
    if (key !== 'x-uid' && key !== 'x-template-uid' && key !== 'x-template-root-uid') {
      if (schema[key] && typeof schema[key] === 'string') {
        schema[key] = idMaps[schema[key]] || schema[key];
      }
      if (schema[key] && typeof schema[key] === 'object') {
        correctIdReference(schema[key], idMaps);
      }
    }
  }
}

function correctIdReferences(schemas) {
  const idMaps = {};
  for (const schema of schemas) {
    _.merge(idMaps, getSchemaUidMaps(schema));
  }
  for (const schema of schemas) {
    correctIdReference(schema, idMaps);
  }
}

function convertTemplateToBlock(data) {
  // debugger;
  let tpls = data?.properties; // Grid开始的区块
  tpls = _.get(Object.values(tpls), '0.properties'); // Grid.Row开始的区块
  const schemas = [];
  // 遍历 tpl的所有属性，每一个属性其实是一个区块
  for (const key in tpls) {
    const tpl = tpls[key];
    const schema = convertTplBlock(tpl);
    if (schema) {
      schemas.push(schema);
    }
  }

  return schemas;
}

function saveSchemasToCache(schemas, template, templateschemacache) {
  const findTemplateSchema = (uid, tpl) => {
    if (tpl['x-uid'] === uid) {
      return tpl;
    }
    if (tpl.properties) {
      for (const key in tpl.properties) {
        const t = findTemplateSchema(uid, tpl.properties[key]);
        if (t) {
          return t;
        }
      }
    }
  };
  const saveSchemaToCache = (schema) => {
    if (schema['x-template-root-uid']) {
      templateschemacache[schema['x-template-root-uid']] = findTemplateSchema(schema['x-template-root-uid'], template);
    } else {
      if (schema.properties) {
        for (const key in schema.properties) {
          saveSchemaToCache(schema.properties[key]);
        }
      }
    }
  };
  for (const schema of schemas) {
    saveSchemaToCache(schema);
  }
}

export const TemplateBlockInitializer = () => {
  const api = useAPIClient();
  // const { options } = useSchemaInitializer();
  const { insertAdjacent } = useDesignable();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const handleClick = async ({ item }) => {
    const { value: uid } = item;
    const { data } = await api.request({
      url: `uiSchemas:getProperties/${uid}`,
    });

    const template = data?.data;
    const schemas = convertTemplateToBlock(template);
    // save the schemas to the cache
    saveSchemasToCache(schemas, template, plugin.templateschemacache);

    correctIdReferences(schemas);
    for (const schema of schemas) {
      await new Promise((resolve) => {
        insertAdjacent('beforeEnd', schema, {
          onSuccess: resolve,
        });
      });
    }
  };
  const { data, loading } = useRequest<{
    data: {
      title: string;
      description: string;
      uid: string;
    }[];
  }>(
    {
      url: 'blockTemplates:list',
      method: 'get',
    },
    {
      uid: 'blockTemplates',
    },
  );

  if (loading) {
    return (
      <div>
        <LoadingOutlined /> Templates
      </div>
    );
  }
  const menuItems = data?.data.map((item) => {
    return {
      label: item.title,
      value: item.uid,
    };
  });
  return (
    <SchemaInitializerItem
      closeInitializerMenuWhenClick={true}
      title={'Templates'}
      icon={<CopyOutlined />}
      items={menuItems}
      name={'templates'}
      onClick={handleClick}
    />
  );
};
