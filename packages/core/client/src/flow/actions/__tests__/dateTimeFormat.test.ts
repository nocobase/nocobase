/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { dateTimeFormat } from '../dateTimeFormat';

describe('dateTimeFormat', () => {
  it('only shows the time format schema for interface time fields', () => {
    const ctx = {
      model: {
        context: {
          collectionField: {
            type: 'string',
            interface: 'time',
          },
        },
      },
    };

    expect(Object.keys(dateTimeFormat.uiSchema(ctx))).toEqual(['timeFormat']);
  });

  it('treats interface time fields as time fields', () => {
    const setProps = vi.fn();
    const ctx = {
      model: {
        context: {
          collectionField: {
            type: 'string',
            interface: 'time',
          },
        },
        setProps,
      },
    };

    dateTimeFormat.handler(ctx, { timeFormat: 'hh:mm:ss a' });

    expect(setProps).toHaveBeenCalledWith({
      timeFormat: 'hh:mm:ss a',
      format: 'hh:mm:ss a',
    });
  });

  it('uses format as the default time format when timeFormat is missing', () => {
    const ctx = {
      model: {
        props: {},
        context: {
          collectionField: {
            interface: 'time',
            getComponentProps: () => ({
              format: 'hh:mm:ss a',
            }),
          },
        },
      },
    };

    expect(dateTimeFormat.defaultParams(ctx)).toMatchObject({
      timeFormat: 'hh:mm:ss a',
    });
  });

  it('does not use datetime format as the default time format for non-time fields', () => {
    const ctx = {
      model: {
        props: {},
        context: {
          collectionField: {
            type: 'datetime',
            interface: 'datetime',
            getComponentProps: () => ({
              format: 'YYYY-MM-DD hh:mm:ss a',
            }),
          },
        },
      },
    };

    expect(dateTimeFormat.defaultParams(ctx)).toMatchObject({
      timeFormat: 'HH:mm:ss',
    });
  });
});
