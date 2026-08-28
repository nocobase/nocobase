/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChinaRegionFieldModel } from '../models/ChinaRegionFieldModel';

type RegionOption = {
  children?: RegionOption[];
  code: string;
  isLeaf?: boolean;
  level: number;
  loading?: boolean;
  name: string;
  sort?: number;
};

type CascaderProps = {
  changeOnSelect?: boolean;
  displayRender?: (labels: string[], selectedOptions: RegionOption[]) => string;
  fieldNames?: {
    children: string;
    label: string;
    value: string;
  };
  loadData?: (selectedOptions: RegionOption[]) => Promise<void>;
  loading?: boolean;
  multiple?: boolean;
  onChange?: (value: unknown, selectedOptions: RegionOption[]) => void;
  onDropdownVisibleChange?: (visible: boolean) => void;
  options?: RegionOption[];
  value?: string[];
};

const mocks = vi.hoisted(() => ({
  cascaderProps: [] as CascaderProps[],
  list: vi.fn(),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    Cascader: (props: CascaderProps) => {
      mocks.cascaderProps.push(props);
      return ReactModule.createElement('div', { 'data-testid': 'china-region-cascader' });
    },
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: (name: string) => {
          expect(name).toBe('chinaRegions');
          return {
            list: mocks.list,
          };
        },
      },
    }),
  };
});

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ahooks')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    useRequest: (
      service: () => Promise<RegionOption[]>,
      options: {
        onSuccess?: (data: RegionOption[]) => void;
      },
    ) => {
      const [data, setData] = ReactModule.useState<RegionOption[]>();
      const run = ReactModule.useCallback(async () => {
        const result = await service();
        setData(result);
        options.onSuccess?.(result);
        return result;
      }, [options, service]);
      return {
        data,
        loading: false,
        run,
      };
    },
  };
});

function createModel(props: Record<string, unknown> = {}) {
  const engine = new FlowEngine();
  engine.registerModels({ ChinaRegionFieldModel });
  return engine.createModel<ChinaRegionFieldModel>({
    use: 'ChinaRegionFieldModel',
    uid: 'china-region-field',
    props,
  });
}

function latestCascaderProps() {
  const props = mocks.cascaderProps.at(-1);
  expect(props).toBeDefined();
  return props as CascaderProps;
}

describe('ChinaRegionFieldModel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.cascaderProps = [];
  });

  it('loads province options when the dropdown opens', async () => {
    mocks.list.mockResolvedValueOnce({
      data: {
        data: [{ code: '11', name: '北京市', level: 1 }],
      },
    });

    const model = createModel({
      maxLevel: 1,
    });
    render(model.render());

    await act(async () => {
      latestCascaderProps().onDropdownVisibleChange?.(true);
    });

    expect(mocks.list).toHaveBeenCalledWith({
      sort: 'code',
      paginate: false,
      filter: {
        level: 1,
      },
    });
    await waitFor(() => {
      expect(latestCascaderProps().options).toEqual([{ code: '11', name: '北京市', level: 1, isLeaf: true }]);
    });
  });

  it('loads child regions and marks them as leaves at max level', async () => {
    mocks.list.mockResolvedValueOnce({
      data: {
        data: [{ code: '1101', name: '北京市', level: 2 }],
      },
    });
    const targetOption: RegionOption = {
      code: '11',
      name: '北京市',
      level: 1,
    };

    render(createModel({ maxLevel: 2 }).render());

    await act(async () => {
      await latestCascaderProps().loadData?.([targetOption]);
    });

    expect(mocks.list).toHaveBeenCalledWith({
      sort: 'code',
      paginate: false,
      filter: {
        parentCode: '11',
      },
    });
    expect(targetOption.loading).toBe(false);
    expect(targetOption.children).toEqual([{ code: '1101', name: '北京市', level: 2, isLeaf: true }]);
  });

  it('converts object values for Cascader and renders labels from selected region objects', () => {
    const onChange = vi.fn();
    const model = createModel({
      changeOnSelectLast: true,
      labelInValue: true,
      onChange,
      value: [
        { code: '1101', name: '北京市', level: 2 },
        { code: '11', name: '北京市', level: 1 },
      ],
    });

    render(model.render());

    expect(latestCascaderProps()).toMatchObject({
      changeOnSelect: false,
      fieldNames: {
        label: 'name',
        value: 'code',
        children: 'children',
      },
      multiple: false,
      value: ['1101', '11'],
    });
    expect(latestCascaderProps().displayRender?.(['省', '市'], [{ code: '11', name: '北京市', level: 1 }])).toBe(
      '北京市 / 北京市',
    );

    latestCascaderProps().onChange?.(
      ['11'],
      [
        {
          code: '11',
          name: '北京市',
          level: 1,
          children: [{ code: '1101', name: '北京市', level: 2 }],
        },
      ],
    );
    expect(onChange).toHaveBeenCalledWith([{ code: '11', name: '北京市', level: 1 }]);
  });

  it('passes raw values when labelInValue is disabled', () => {
    const onChange = vi.fn();

    render(
      createModel({
        changeOnSelect: true,
        labelInValue: false,
        onChange,
        value: '330000',
      }).render(),
    );

    expect(latestCascaderProps()).toMatchObject({
      changeOnSelect: true,
      value: ['330000'],
    });

    latestCascaderProps().onChange?.(undefined, []);
    expect(onChange).toHaveBeenCalledWith(null);

    latestCascaderProps().onChange?.(['330000'], [{ code: '330000', name: '浙江省', level: 1 }]);
    expect(onChange).toHaveBeenCalledWith(['330000']);
  });
});
