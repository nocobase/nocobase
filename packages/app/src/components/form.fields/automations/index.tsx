import React, { useEffect, useState } from 'react';
import { connect } from '@formily/react-schema-renderer'
import { Button, Select, DatePicker, Tag, InputNumber, TimePicker, Input } from 'antd';
import {
  Select as AntdSelect,
  mapStyledProps,
  mapTextComponent
} from '../shared'
import moment from 'moment';
import './style.less';
import api from '@/api-client';
import { useRequest } from 'umi';

export const DateTime = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})((props) => {
  const { associatedKey, automationType, filter, onChange } = props;
  const [aKey, setaKey] = useState(associatedKey);
  const [aType, setaType] = useState(automationType);
  console.log('Automations.DateTime', aKey, associatedKey)
  const [value, setValue] = useState(props.value||{});
  const [offsetType, setOffsetType] = useState(() => {
    if (!value.offset) {
      return 'current';
    }
    if (value.offset > 0) {
      return 'after';
    }
    if (value.offset < 0) {
      return 'before';
    }
    return 'current';
  })
  
  useEffect(() => {
    if (associatedKey !== aKey || automationType !== aType) {
      setOffsetType('current');
      setValue({
        value: null,
        byField: null,
        offset: 0,
        unit: undefined,
      });
      onChange({
        value: null,
        byField: null,
        offset: 0,
        unit: undefined,
      });
      setaKey(associatedKey)
    }
  }, [ associatedKey, automationType, aKey, aType ]);
  const { data = [], loading = true } = useRequest(() => {
    return associatedKey && automationType !== 'schedule' ? api.resource('collections.fields').list({
      associatedKey,
      filter: filter||{
        type: 'date',
      },
    }) : Promise.resolve({data: []});
  }, {
    refreshDeps: [associatedKey, automationType, filter]
  });
  console.log({data});
  return (
    <div>
      <div>
        {automationType === 'schedule' ? (
          <DatePicker showTime onChange={(m, dateString) => {
            onChange({value: m.toISOString()});
            setValue({value: m.toISOString()});
            // console.log('Automations.DateTime', m.toISOString(), {m, dateString})
          }} defaultValue={(() => {
            if (!value.value) {
              return undefined;
            }
            const m = moment(value.value);
            return m.isValid() ? m : undefined;
          })()}/>
        ) : (
          <Input.Group compact>
            <Select style={{width: 120}} value={value.byField} onChange={(v) => {
              setValue({...value, byField: v});
              onChange({...value, byField: v});
            }} loading={loading} options={data.map(item => ({
              value: item.name,
              label: item.title||item.name,
            }))} placeholder={'选择日期字段'}></Select>
            <Select onChange={(offsetType) => {
              let values = {...value};
              switch (offsetType) {
                case 'current':
                  values = {byField: values.byField, offset: 0};
                  break;
                case 'before':
                  if (values.offset) {
                    values.offset = -1 * Math.abs(values.offset);
                  }
                  break;
                case 'after': 
                  if (values.offset) {
                    values.offset = Math.abs(values.offset);
                  }
                  break;
              }
              setOffsetType(offsetType);
              setValue(values);
              onChange(values);
            }} value={offsetType} placeholder={'选择日期字段'}>
              <Select.Option value={'current'}>当天</Select.Option>
              <Select.Option value={'before'}>之前</Select.Option>
              <Select.Option value={'after'}>之后</Select.Option>
            </Select>
            {offsetType !== 'current' && (
              <InputNumber step={1} min={1} value={Math.abs(value.offset)||undefined} onChange={(offset: number) => {
                const values = {
                  unit: 'day',...value,
                }
                if (offsetType === 'before') {
                  values.offset = -1 * Math.abs(offset);
                } else if (offsetType === 'after') {
                  values.offset = Math.abs(offset);
                }
                setValue(values);
                onChange(values);
                console.log('Automations.DateTime', values)
                // console.log(offsetType);
              }} placeholder={'数字'}/>
            )}
            {offsetType !== 'current' && (
              <Select onChange={(v) => {
                setValue({...value, unit: v});
                onChange({...value, unit: v});
              }} value={value.unit} placeholder={'选择单位'}>
                <Select.Option value={'second'}>秒</Select.Option>
                <Select.Option value={'minute'}>分钟</Select.Option>
                <Select.Option value={'hour'}>小时</Select.Option>
                <Select.Option value={'day'}>天</Select.Option>
                <Select.Option value={'week'}>周</Select.Option>
                <Select.Option value={'month'}>月</Select.Option>
              </Select>
            )}
            {offsetType !== 'current' && value.unit && ['day', 'week', 'month'].indexOf(value.unit) !== -1 && (
              <TimePicker value={(() => {
                const m = moment(value.time, 'HH:mm:ss');
                return m.isValid() ? m : undefined;
              })()} onChange={(m, dateString) => {
                console.log('Automations.DateTime', m, dateString)
                setValue({...value, time: dateString});
                onChange({...value, time: dateString});
              }}/>
            )}
          </Input.Group>
        )}
      </div>
    </div>
  )
})

const cronmap = {
  none: '不重复',
  everysecond: '每秒',
  everyminute: '每分钟',
  everyhour: '每小时',
  everyday: '每天',
  everyweek: '每周',
  everymonth: '每月',
  custom: '自定义',
};

export const Cron = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})((props) => {
  const { value, onChange } = props;

  console.log('Automations.DateTime', {value})

  const re = /every_(\d+)_(.+)/i;

  const match = cronmap[value] ? null : re.exec(value);

  const [unit, setUnit] = useState(match ? match[2] : 'days');
  const [num, setNum] = useState<any>(match ? parseInt(match[1]) : undefined);
  const [cron, setCron] = useState(() => {
    if (!value) {
      return 'none';
    }
    return match ? 'custom' : cronmap[value];
  })

  return (
    <div>
      <Input.Group compact>
        <Select value={cron} onChange={(v) => {
          setCron(v);
          onChange(v);
        }}>
          {Object.keys(cronmap).map(key => {
            return (
              <Select.Option value={key}>{cronmap[key]}</Select.Option>
            );
          })}
        </Select>
        {cron === 'custom' && (
          <Input type={'number'} onChange={(e) => {
            const v = parseInt(e.target.value);
            setNum(v);
            onChange(`every_${v}_${unit}`);
          }} defaultValue={num} addonBefore={'每'}/>
        )}
        {cron === 'custom' && (
          <Select onChange={(v) => {
            setUnit(v);
            onChange(`every_${num}_${v}`);
          }} defaultValue={unit}>
            <Select.Option value={'seconds'}>秒</Select.Option>
            <Select.Option value={'minutes'}>分钟</Select.Option>
            <Select.Option value={'hours'}>小时</Select.Option>
            <Select.Option value={'days'}>天</Select.Option>
            <Select.Option value={'weeks'}>周</Select.Option>
            <Select.Option value={'months'}>月</Select.Option>
          </Select>
        )}
      </Input.Group>
    </div>
  )
})

export const EndMode = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})((props) => {
  const { value = 'none', onChange, automationType } = props;
  const re = /after_(\d+)_times/i;
  const match = re.exec(value);

  const [mode, setMode] = useState(() => {
    if (automationType === 'schedule' && value === 'byField') {
      return 'none';
    } else if (automationType === 'collections:schedule' && value === 'customTime') {
      return 'none';
    }
    
    return match ? 'times' : value;
  });

  const [num, setNum] = useState(match ? parseInt(match[1]) : undefined);

  useEffect(() => {
    if (automationType === 'schedule' && value === 'byField') {
      setMode('none')
      onChange('none')
    } else if (automationType === 'collections:schedule' && value === 'customTime') {
      setMode('none')
      onChange('none')
    }
  }, [automationType]);
  console.log('Automations.DateTime', {value, automationType, mode})

  return (
    <div>
      <Input.Group compact>
        <Select style={{width: 150}} value={mode} onChange={(v) => {
          setMode(v);
          onChange(v);
        }}>
          <Select.Option value={'none'}>永不结束</Select.Option>
          <Select.Option value={'times'}>指定重复次数</Select.Option>
          {automationType === 'schedule' && <Select.Option value={'customTime'}>自定义时间</Select.Option>}
          {automationType === 'collections:schedule' && <Select.Option value={'byField'}>根据日期字段</Select.Option>}
        </Select>
        {mode === 'times' && <Input type={'number'} onChange={(e) => {
            const v = parseInt(e.target.value);
            setNum(v);
            onChange(`after_${v}_times`);
        }} defaultValue={num} addonAfter={'次'}/>}
      </Input.Group>
    </div>
  )
})

export const Automations = {
  DateTime, Cron, EndMode
};

