/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDataSourceManager } from '../../../data-source/data-source';
import { useEvent } from '../../hooks/useEvent';
import { EventParam, EventSetting, EventDefinition, EventParamKey, StateParamKey, SystemParamKey } from '../../types';

const useCurrentEventParams = (event?: EventSetting['event']) => {
  const { definitions } = useEvent();
  const definition = definitions?.find(
    (d) => d.name === event?.definition && d.pageUid === event.pageUid && d.blockUid === event.blockUid,
  );
  const eventParams = definition?.events?.find((e) => e.name === event?.event)?.params;
  return eventParams;
};

const useStateDefine = () => {
  const { definitions } = useEvent();
  const stateDefineOptions = {};
  definitions
    .filter((item) => item.states && item.blockUid) // 必须为区块的数据
    .forEach((definition) => {
      stateDefineOptions[definition.blockUid] = {
        name: definition.blockUid,
        title: `${definition.title}-${definition.blockUid}`,
        type: 'object',
        properties: definition.states,
      };
    });

  return { stateDefineOptions };
};

export const useFilterOptions = (event?: EventSetting['event']) => {
  const currentEventParamsDefine: EventParam[] = useCurrentEventParams(event);
  const { stateDefineOptions } = useStateDefine();
  console.log('useFilterOptions', event, currentEventParamsDefine, stateDefineOptions);

  const options: EventParam[] = [
    {
      name: EventParamKey,
      title: '事件参数',
      type: 'object',
      properties: currentEventParamsDefine,
    },
    {
      name: StateParamKey,
      title: '组件数据',
      type: 'object',
      properties: stateDefineOptions,
    },
    {
      name: SystemParamKey,
      title: '应用数据',
      type: 'object',
      properties: {},
    },
  ];
  const dm = useDataSourceManager();

  const getOption = (opt: EventParam) => {
    if (opt.type === 'object' && opt.properties) {
      return {
        name: opt.name,
        title: opt.title,
        children: Object.keys(opt.properties).map((key) =>
          getOption({
            ...opt.properties[key],
            name: key,
          }),
        ),
      };
    }
    if (opt.type === 'array' && opt.items) {
      //TODO: 处理数组
      return {
        name: opt.name,
        title: opt.title,
        children: [],
      };
    }
    const fieldInterface = dm?.collectionFieldInterfaceManager.getFieldInterface(opt?.interface || opt.type);
    const { nested, children, operators } = fieldInterface?.filterable || {};
    const res = {
      name: opt.name,
      type: opt.type,
      // target: opt.target,
      title: opt?.uiSchema?.title || opt.title || opt.name,
      schema: opt?.uiSchema,
      interface: opt.interface,
      operators:
        operators?.filter?.((operator) => {
          return !operator?.visible || operator.visible(opt);
        }) || [],
    };
    return res;
  };
  return options.map((opt) => getOption(opt));
};
