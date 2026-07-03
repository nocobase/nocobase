/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  filterCreateFieldInterfacesByCollectionTemplate,
  filterFieldInterfacesByCollectionTemplate,
} from '../collectionTemplateFieldInterfaces';

const fieldInterfaces = [
  {
    name: 'input',
    group: 'basic',
  },
  {
    name: 'number',
    group: 'basic',
  },
  {
    name: 'createdAt',
    group: 'systemInfo',
  },
  {
    name: 'tableoid',
    group: 'systemInfo',
  },
];

describe('collection template field interface filters', () => {
  it('filters interfaces with include and exclude policies', () => {
    expect(
      filterFieldInterfacesByCollectionTemplate(
        fieldInterfaces,
        {
          title: 'General',
          fieldInterfaces: {
            include: ['input', { interface: 'number' }],
          },
        },
        {},
      ).map((item) => item.name),
    ).toEqual(['input', 'number', 'createdAt']);

    expect(
      filterFieldInterfacesByCollectionTemplate(
        fieldInterfaces,
        {
          title: 'General',
          fieldInterfaces: {
            exclude: ['number'],
          },
        },
        {
          createdAt: false,
        },
        {
          databaseDialect: 'mysql',
        },
      ).map((item) => item.name),
    ).toEqual(['input']);
  });

  it('keeps PostgreSQL tableoid by default and supports deprecated availableFieldInterfaces', () => {
    expect(
      filterFieldInterfacesByCollectionTemplate(
        fieldInterfaces,
        {
          title: 'General',
        },
        {},
        {
          databaseDialect: 'postgres',
        },
      ).map((item) => item.name),
    ).toEqual(['input', 'number', 'createdAt', 'tableoid']);

    expect(
      filterFieldInterfacesByCollectionTemplate(
        fieldInterfaces,
        {
          title: 'Legacy',
          availableFieldInterfaces: {
            include: [{ name: 'tableoid' }],
          },
        },
        {},
        {
          databaseDialect: 'mysql',
        },
      ).map((item) => item.name),
    ).toEqual(['createdAt', 'tableoid']);
  });

  it('filters create interfaces with create-specific include and exclude policies', () => {
    expect(
      filterCreateFieldInterfacesByCollectionTemplate(fieldInterfaces, {
        title: 'General',
        fieldInterfaces: {
          create: {
            include: [{ name: 'input' }],
          },
        },
      }).map((item) => item.name),
    ).toEqual(['input']);

    expect(
      filterCreateFieldInterfacesByCollectionTemplate(fieldInterfaces, {
        title: 'General',
        fieldInterfaces: {
          create: {
            exclude: ['number'],
          },
        },
      }).map((item) => item.name),
    ).toEqual(['input', 'createdAt', 'tableoid']);
  });
});
