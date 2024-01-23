import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Result } from 'ahooks/es/useRequest/src/types';
import { useRequest, useAPIClient } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const CollectionManageSettingContext = createContext<Result<any, any>>(null);

export const useCollectionManageSetting = () => {
  return useContext(CollectionManageSettingContext);
};

export const CollectionManageSettingProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const { render } = useAppSpin();
  const api = useAPIClient();
  const result = useRequest({
    url: 'applicationPlugins:get/1?filterByTk=2',
  });

  const data = (result as any)?.data?.data?.options;
  console.log('data:', data);
  const update = async () => {
    const allSelected: any = [
      ERandomUidType.TABLE_NAME,
      ERandomUidType.TABLE_FIELD,
      ERandomUidType.SELECT_OPTION,
      ERandomUidType.FOREIGN_KEY,
    ];

    await api
      .request({
        url: 'applicationPlugins:update',
        method: 'post',
        data: {
          options: {
            randomUidBlacklist: allSelected,
          },
        },
        params: {
          filterByTk: 2,
        },
      })
      .then(() => {
        localStorage.setItem(CONSTANT.RANDOM_UID_OPTIONS, allSelected);
        result.run();
      });
  };

  useRequest(() => update(), {
    ready: data !== undefined && data?.randomUidBlacklist.length === 0 && data?.type !== CONSTANT.ALL_SELECTED_EMPTY,
  });

  useEffect(() => {
    const data = (result as any)?.data?.data?.options?.randomUidBlacklist;
    localStorage.setItem(CONSTANT.RANDOM_UID_OPTIONS, data);
  }, [result]);
  if (result.loading) {
    return render();
  }
  return (
    <CollectionManageSettingContext.Provider value={result}>{props.children}</CollectionManageSettingContext.Provider>
  );
};

/** 随机UId生成的类型 */
export enum ERandomUidType {
  /** 数据表标识 */
  TABLE_NAME = 'TABLE_NAME',
  /** 数据表字段 */
  TABLE_FIELD = 'TABLE_FIELD',
  /** 表格下拉枚举 */
  SELECT_OPTION = 'SELECT_OPTION',
  /** 外键 */
  FOREIGN_KEY = 'FOREIGN_KEY',
}

/** 常量 */
export const CONSTANT = {
  /** 随机uid选项 */
  RANDOM_UID_OPTIONS: 'RANDOM_UID_OPTIONS',
  /** 所有选择为空 */
  ALL_SELECTED_EMPTY: 'ALL_SELECTED_EMPTY',
};

/** 获取uid黑名单 */
export const useRandomUidBlacklist = () => {
  const { data } = useCollectionManageSetting();
  const randomUidBlacklist = data?.data?.options?.randomUidBlacklist;
  return randomUidBlacklist;
};

/** 获取是否通过uid生成的name */
export const getRandomUidName = (data: any, type: ERandomUidType, name: string) => {
  return !data.includes(type) ? '' : name;
};
