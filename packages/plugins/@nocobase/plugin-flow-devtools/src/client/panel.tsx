/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Switch,
  Input,
  Select,
  InputNumber,
  Collapse,
  Tabs,
  List,
  Drawer,
  Row,
  Col,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useT } from './locale';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type FlowLogRecord = {
  ts: number;
  level: LogLevel;
  type?: string;
  modelId?: string;
  modelType?: string;
  flowKey?: string;
  stepKey?: string;
  stepType?: string;
  runId?: string;
  eventName?: string;
  duration?: number;
  status?: string;
};

type AnyLogRow = FlowLogRecord & { _groupKey?: string };

interface LogBus {
  getSnapshot?: () => FlowLogRecord[];
  subscribe?: (cb: (rec: FlowLogRecord) => void) => (() => void) | void;
  setCapacity?: (n: number) => void;
  clear?: () => void;
  getSubscriberCount?: () => number;
}

interface LogOptions {
  capacity?: number;
  slowOnly?: { event?: boolean; step?: boolean };
  dropTypes?: string[];
  dropTypePrefixes?: string[];
  samples?: Record<string, number>;
  maxRatePerSec?: number;
  slowStepMs?: number;
  slowEventMs?: number;
  filters?: Record<string, unknown> | undefined;
}

interface LogManager {
  options?: LogOptions;
  setOptions?: (opts: LogOptions) => void;
  bus?: LogBus;
  createLogger?: (arg: { from?: string }) => { info?: (payload: unknown) => void };
}

interface FlowEngineLike {
  logManager?: LogManager;
  createLogger?: (arg: { from?: string }) => { info?: (payload: unknown) => void };
}

type StoredFilters = {
  levels?: LogLevel[];
  typeLike?: string;
  modelId?: string;
  modelType?: string;
  flowKey?: string;
  stepKey?: string;
  eventName?: string;
  runId?: string;
  minDuration?: number;
  slowOnly?: boolean;
};

const levelColor: Record<string, string> = {
  error: 'red',
  warn: 'orange',
  info: 'blue',
  debug: 'green',
  trace: 'default',
};

export const FlowLogsPanel: React.FC = () => {
  const t = useT();
  const engine = useFlowEngine() as FlowEngineLike | undefined;
  // 初始快照：来自根引擎（视图作用域通过 Proxy 将日志发布到根引擎）
  const initial = React.useMemo<FlowLogRecord[]>(() => engine?.logManager?.bus?.getSnapshot?.() || [], [engine]);
  const [rows, setRows] = React.useState<FlowLogRecord[]>(() => initial);
  React.useEffect(() => {
    setRows(initial);
  }, [initial]);
  const [live, setLive] = React.useState(true);
  const liveRef = React.useRef(live);
  React.useEffect(() => {
    liveRef.current = live;
  }, [live]);
  const STORAGE_KEYS = React.useMemo(
    () => ({ options: 'nb.flow.logs.options', filters: 'nb.flow.logs.filters' }) as const,
    [],
  );
  const loadJSON = <T,>(k: string): T | undefined => {
    try {
      const s = localStorage.getItem(k);
      return s ? (JSON.parse(s) as T) : undefined;
    } catch (e) {
      console.warn('FlowDevtools: loadJSON failed', e);
      return undefined;
    }
  };
  const saveJSON = <T,>(k: string, v: T) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.warn('FlowDevtools: saveJSON failed', e);
    }
  };
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('table');
  const [focusRunId, setFocusRunId] = React.useState<string | undefined>();
  const [detail, setDetail] = React.useState<FlowLogRecord | Record<string, unknown> | null>(null);

  // filter state
  const [levels, setLevels] = React.useState<LogLevel[]>(['error', 'warn', 'info', 'debug']);
  const [typeLike, setTypeLike] = React.useState<string>('');
  const [modelId, setModelId] = React.useState<string | undefined>();
  const [modelType, setModelType] = React.useState<string | undefined>();
  const [flowKey, setFlowKey] = React.useState<string | undefined>();
  const [stepKey, setStepKey] = React.useState<string | undefined>();
  const [eventName, setEventName] = React.useState<string | undefined>();
  const [runId, setRunId] = React.useState<string | undefined>();
  const [minDuration, setMinDuration] = React.useState<number | undefined>();
  const [slowOnly, setSlowOnly] = React.useState<boolean>(false);
  // publish-side options (initialized from engine.logManager.options)
  const [optSlowEvent, setOptSlowEvent] = React.useState<boolean>(!!engine?.logManager?.options?.slowOnly?.event);
  const [optSlowStep, setOptSlowStep] = React.useState<boolean>(!!engine?.logManager?.options?.slowOnly?.step);
  const [optDropStepStart, setOptDropStepStart] = React.useState<boolean>(
    Array.isArray(engine?.logManager?.options?.dropTypes)
      ? (engine.logManager.options.dropTypes as string[]).includes('step.start')
      : true,
  );
  const [optDropCache, setOptDropCache] = React.useState<boolean>(
    Array.isArray(engine?.logManager?.options?.dropTypePrefixes)
      ? (engine.logManager.options.dropTypePrefixes as string[]).includes('cache.')
      : true,
  );
  const [optSampleStepStart, setOptSampleStepStart] = React.useState<number>(
    Number(engine?.logManager?.options?.samples?.['step.start'] ?? 10),
  );
  const [optSampleModelUpdate, setOptSampleModelUpdate] = React.useState<number>(
    Number(engine?.logManager?.options?.samples?.['model.update'] ?? 10),
  );
  const [capacity, setCapacity] = React.useState<number>(Number(engine?.logManager?.options?.capacity ?? 2000));
  const [maxRate, setMaxRate] = React.useState<number | undefined>(
    typeof engine?.logManager?.options?.maxRatePerSec === 'number'
      ? Number(engine.logManager.options.maxRatePerSec)
      : undefined,
  );
  const engineReady = !!(engine?.logManager?.bus?.getSnapshot && engine?.logManager?.setOptions);

  // Restore options and filters from localStorage on mount
  React.useEffect(() => {
    const storedOpt = loadJSON<LogOptions>(STORAGE_KEYS.options);
    if (engine && storedOpt && typeof storedOpt === 'object') {
      const next: LogOptions = Object.assign({}, engine.logManager?.options || {}, storedOpt);
      engine.logManager?.setOptions?.(next);
      if (typeof next.capacity === 'number') {
        engine.logManager?.bus?.setCapacity?.(next.capacity);
      }
      if (typeof storedOpt.capacity === 'number') setCapacity(storedOpt.capacity);
      setOptSlowEvent(!!storedOpt?.slowOnly?.event);
      setOptSlowStep(!!storedOpt?.slowOnly?.step);
      setOptDropStepStart(Array.isArray(storedOpt?.dropTypes) ? storedOpt.dropTypes.includes('step.start') : true);
      setOptDropCache(
        Array.isArray(storedOpt?.dropTypePrefixes) ? storedOpt.dropTypePrefixes.includes('cache.') : true,
      );
      if (storedOpt?.samples) {
        if (typeof storedOpt.samples['step.start'] === 'number')
          setOptSampleStepStart(Number(storedOpt.samples['step.start']));
        if (typeof storedOpt.samples['model.update'] === 'number')
          setOptSampleModelUpdate(Number(storedOpt.samples['model.update']));
      }
    }
    const storedFilters = loadJSON<StoredFilters>(STORAGE_KEYS.filters);
    if (storedFilters && typeof storedFilters === 'object') {
      const f = storedFilters;
      Array.isArray(f.levels) && setLevels(f.levels);
      typeof f.typeLike === 'string' && setTypeLike(f.typeLike);
      setModelId(f.modelId || undefined);
      setModelType(f.modelType || undefined);
      setFlowKey(f.flowKey || undefined);
      setStepKey(f.stepKey || undefined);
      setEventName(f.eventName || undefined);
      setRunId(f.runId || undefined);
      setMinDuration(typeof f.minDuration === 'number' ? f.minDuration : undefined);
      setSlowOnly(!!f.slowOnly);
    }
    const snap = engine?.logManager?.bus?.getSnapshot?.() || [];
    setRows(snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // 订阅根引擎的增量事件
  React.useEffect(() => {
    const bufferRef: { buf: FlowLogRecord[]; timer: number | null } = { buf: [], timer: null };
    const flush = () => {
      bufferRef.timer = null;
      if (!liveRef.current || bufferRef.buf.length === 0) return;
      const batch = bufferRef.buf;
      bufferRef.buf = [];
      setRows((prev) => {
        const merged = prev.concat(batch);
        if (merged.length > capacity) merged.splice(0, merged.length - capacity);
        return merged.slice();
      });
    };
    const onRec = (rec: FlowLogRecord) => {
      if (!liveRef.current) return;
      bufferRef.buf.push(rec);
      if (!bufferRef.timer) {
        try {
          const raf = (window as any).requestAnimationFrame as ((cb: FrameRequestCallback) => number) | undefined;
          bufferRef.timer = raf ? raf(flush) : (setTimeout(flush, 16) as unknown as number);
        } catch (e) {
          console.warn('FlowDevtools: schedule flush failed, fallback to setTimeout', e);
          bufferRef.timer = setTimeout(flush, 16) as unknown as number;
        }
      }
    };
    const unsub = engine?.logManager?.bus?.subscribe?.(onRec);
    return () => {
      if (typeof unsub === 'function') unsub();
      if (bufferRef.timer) {
        try {
          const caf = (window as any).cancelAnimationFrame as ((h: number) => void) | undefined;
          caf ? caf(bufferRef.timer) : clearTimeout(bufferRef.timer);
        } catch (e) {
          console.warn('FlowDevtools: cancel flush timer failed', e);
          clearTimeout(bufferRef.timer);
        }
      }
      bufferRef.buf = [];
      bufferRef.timer = null;
    };
  }, [engine, capacity]);

  const nowrapStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
    wordBreak: 'keep-all' as React.CSSProperties['wordBreak'],
  };
  const wrapStyle: React.CSSProperties = {
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere' as React.CSSProperties['overflowWrap'],
  };
  const headerNoWrap = { onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) } as const;
  const columns: ColumnsType<FlowLogRecord> = [
    {
      title: t('Time'),
      dataIndex: 'ts',
      width: 160,
      render: (ts: number) => new Date(ts).toLocaleTimeString(),
      ...headerNoWrap,
    },
    {
      title: t('Level'),
      dataIndex: 'level',
      width: 90,
      render: (lvl: LogLevel) => <Tag color={levelColor[lvl] || 'default'}>{lvl}</Tag>,
      ...headerNoWrap,
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      width: 220,
      ellipsis: true,
      render: (v?: string) => (
        <span style={nowrapStyle} title={v || ''}>
          {v || ''}
        </span>
      ),
      ...headerNoWrap,
    },
    {
      title: t('Model'),
      dataIndex: 'modelId',
      ellipsis: true,
      render: (v: string | undefined, r: FlowLogRecord) => (
        <span style={nowrapStyle} title={v ? `${v}${r.modelType ? ` (${r.modelType})` : ''}` : ''}>
          {v ? `${v}${r.modelType ? ` (${r.modelType})` : ''}` : ''}
        </span>
      ),
      ...headerNoWrap,
    },
    // Flow 列：固定宽度并允许换行（避免字符级断行），保留横向滚动
    {
      title: t('Flow'),
      dataIndex: 'flowKey',
      width: 260,
      render: (v?: string) => <span style={wrapStyle}>{v || ''}</span>,
      ...headerNoWrap,
    },
    {
      title: t('Step'),
      dataIndex: 'stepKey',
      width: 200,
      ellipsis: true,
      render: (v?: string) => (
        <span style={nowrapStyle} title={v || ''}>
          {v || ''}
        </span>
      ),
      ...headerNoWrap,
    },
    {
      title: t('Event'),
      dataIndex: 'eventName',
      width: 180,
      ellipsis: true,
      render: (v?: string) => (
        <span style={nowrapStyle} title={v || ''}>
          {v || ''}
        </span>
      ),
      ...headerNoWrap,
    },
    {
      title: t('Run'),
      dataIndex: 'runId',
      width: 260,
      ellipsis: true,
      render: (v?: string) => (
        <span style={nowrapStyle} title={v || ''}>
          {v || ''}
        </span>
      ),
      ...headerNoWrap,
    },
    { title: t('Duration(ms)'), dataIndex: 'duration', width: 120, ...headerNoWrap },
    {
      title: t('Status'),
      dataIndex: 'status',
      width: 160,
      ellipsis: true,
      render: (v?: string) => (
        <span style={nowrapStyle} title={v || ''}>
          {v || ''}
        </span>
      ),
      ...headerNoWrap,
    },
  ];

  // build options from rows for select inputs
  const uniq = React.useMemo(() => {
    const use = (key: keyof FlowLogRecord, max = 50) => {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const v = r[key] as unknown;
        if (!v) return;
        const s = String(v as unknown as string);
        m.set(s, (m.get(s) || 0) + 1);
      });
      return Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, max)
        .map(([value]) => ({ value, label: value }));
    };
    return {
      types: use('type'),
      modelIds: use('modelId'),
      modelTypes: use('modelType'),
      flowKeys: use('flowKey'),
      stepKeys: use('stepKey'),
      eventNames: use('eventName'),
      runIds: use('runId', 20),
    };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const tlike = (typeLike || '').toLowerCase();
    const slowThreshold = Math.min(
      Number(engine?.logManager?.options?.slowStepMs ?? 16),
      Number(engine?.logManager?.options?.slowEventMs ?? 16),
    );
    return rows.filter((r) => {
      if (levels.length && !levels.includes(r.level)) return false;
      if (typeLike && !(r.type || '').toLowerCase().includes(tlike)) return false;
      if (modelId && r.modelId !== modelId) return false;
      if (modelType && r.modelType !== modelType) return false;
      if (flowKey && r.flowKey !== flowKey) return false;
      if (stepKey && r.stepKey !== stepKey) return false;
      if (eventName && r.eventName !== eventName) return false;
      if (runId && r.runId !== runId) return false;
      if (typeof minDuration === 'number') {
        if (typeof r.duration !== 'number' || r.duration < minDuration) return false;
      }
      if (slowOnly && !(typeof r.duration === 'number' && r.duration >= slowThreshold)) return false;
      return true;
    });
  }, [rows, levels, typeLike, modelId, modelType, flowKey, stepKey, eventName, runId, minDuration, slowOnly]);

  // Timeline data (group by runId or focusRunId)
  const timelineRunId = focusRunId || runId;
  const timelineRows = React.useMemo(() => {
    const list = filteredRows.filter((r) => (timelineRunId ? r.runId === timelineRunId : !!r.runId));
    return list.sort((a, b) => a.ts - b.ts);
  }, [filteredRows, timelineRunId]);

  // TopN slow rows (step.end/event.end)
  const [topTypes, setTopTypes] = React.useState<string[]>(['event.end', 'step.end']);
  const [topGroupBy, setTopGroupBy] = React.useState<'none' | 'modelId' | 'flowKey' | 'stepKey'>('none');
  const topNRows = React.useMemo<AnyLogRow[]>(() => {
    const list = filteredRows.filter((r) => topTypes.includes(r.type || '') && typeof r.duration === 'number');
    if (topGroupBy === 'none') {
      return list.sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 50);
    }
    const map = new Map<string, { key: string; count: number; sum: number; max: number; sample: FlowLogRecord }>();
    list.forEach((r) => {
      const key = (r as Record<string, string | undefined>)[topGroupBy] || '';
      if (!key) return;
      const cur = map.get(key) || { key, count: 0, sum: 0, max: 0, sample: r };
      const d = Number(r.duration || 0);
      cur.count += 1;
      cur.sum += d;
      if (d > cur.max) cur.max = d;
      cur.sample = r;
      map.set(key, cur);
    });
    const rows = Array.from(map.values()).map((v) => ({
      ts: v.sample?.ts,
      level: v.sample?.level,
      type: `agg:${topGroupBy}`,
      modelId: v.sample?.modelId,
      modelType: v.sample?.modelType,
      flowKey: v.sample?.flowKey,
      stepKey: v.sample?.stepKey,
      eventName: v.sample?.eventName,
      runId: v.sample?.runId,
      duration: Math.round(v.max),
      status: `count=${v.count}, avg=${Math.round(v.sum / v.count)}`,
      _groupKey: v.key,
    }));
    return rows.sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0)).slice(0, 50);
  }, [filteredRows, topTypes, topGroupBy]);

  const onClear = () => {
    if (!engine?.logManager?.bus?.clear) {
      console.warn('FlowDevtools: engine log bus not available to clear');
    }
    engine?.logManager?.bus?.clear?.();
    setRows([]);
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSnapshot = () => {
    if (!engine?.logManager?.bus?.getSnapshot) {
      console.warn('FlowDevtools: engine log bus snapshot unavailable');
      return;
    }
    const snap = engine.logManager.bus.getSnapshot();
    setRows(snap);
  };

  return (
    <div style={{ padding: 12 }}>
      {!engineReady && (
        <Alert
          type="warning"
          message={t('Flow engine logs are unavailable (logManager not ready)')}
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}
      <Space style={{ marginBottom: 8 }} wrap>
        <Switch size="small" checked={live} onChange={setLive} />
        <Typography.Text>{t('Live')}</Typography.Text>
        <Button size="small" onClick={onSnapshot} disabled={!engineReady}>
          {t('Snapshot')}
        </Button>
        <Button size="small" onClick={onClear} disabled={!engineReady}>
          {t('Clear')}
        </Button>
        <Button size="small" onClick={onExport}>
          {t('Export')}
        </Button>
        <Button
          size="small"
          onClick={() => {
            const now = Date.now();
            try {
              engine?.logManager
                ?.createLogger?.({ from: 'devtools' })
                ?.info?.({ type: 'devtools.test', ts: now, message: 'hello from devtools' });
            } catch (e) {
              console.warn('FlowDevtools: Emit test log failed', e);
            }
          }}
          disabled={!engineReady}
        >
          {t('Emit test log')}
        </Button>
        <Button size="small" onClick={() => setFiltersOpen((o) => !o)}>
          {filtersOpen ? t('Hide filters') : t('Show filters')}
        </Button>
        <Typography.Text type="secondary">
          {`${t('Diag')}: subs=${engine?.logManager?.bus?.getSubscriberCount?.() || 0}, rows=${rows.length}`}
        </Typography.Text>
        <Space>
          <Typography.Text type="secondary">{t('Capacity')}</Typography.Text>
          <InputNumber
            size="small"
            min={100}
            step={100}
            value={capacity}
            onChange={(v) => setCapacity(Number(v || 2000))}
            style={{ width: 120 }}
          />
          <Button
            size="small"
            onClick={() => {
              if (!engine?.logManager?.setOptions) {
                console.warn('FlowDevtools: cannot apply capacity, setOptions unavailable');
                return;
              }
              const next = Object.assign({}, engine.logManager.options || {}, { capacity });
              engine.logManager.setOptions(next);
              saveJSON(STORAGE_KEYS.options, next);
              onSnapshot();
            }}
            disabled={!engineReady}
          >
            {t('Apply capacity')}
          </Button>
        </Space>
        <Space>
          <Typography.Text type="secondary">{t('Max rate(/s)')}</Typography.Text>
          <InputNumber
            size="small"
            min={0}
            placeholder={t('unlimited')}
            value={maxRate}
            onChange={(v) => setMaxRate(typeof v === 'number' ? v : undefined)}
            style={{ width: 140 }}
          />
          <Button
            size="small"
            onClick={() => {
              if (!engine?.logManager?.setOptions) {
                console.warn('FlowDevtools: cannot apply rate, setOptions unavailable');
                return;
              }
              const next = Object.assign({}, engine.logManager.options || {}, {
                maxRatePerSec: typeof maxRate === 'number' ? maxRate : undefined,
              });
              engine.logManager.setOptions(next);
              saveJSON(STORAGE_KEYS.options, next);
            }}
            disabled={!engineReady}
          >
            {t('Apply rate')}
          </Button>
        </Space>
        <div style={{ height: 8 }} />
      </Space>
      {filtersOpen && (
        <Collapse defaultActiveKey={['f']} style={{ marginBottom: 8 }}>
          <Collapse.Panel header={t('Filters')} key="f">
            <div>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Select<string>
                    mode="multiple"
                    allowClear
                    placeholder={t('Levels')}
                    value={levels}
                    onChange={(v) => setLevels(v as unknown as LogLevel[])}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: 'error', label: 'error' },
                      { value: 'warn', label: 'warn' },
                      { value: 'info', label: 'info' },
                      { value: 'debug', label: 'debug' },
                    ]}
                  />
                </Col>
                <Col span={12}>
                  <Input
                    size="small"
                    placeholder={t('type contains...')}
                    value={typeLike}
                    onChange={(e) => setTypeLike(e.target.value)}
                  />
                </Col>
                <Col span={6}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="modelId"
                    value={modelId}
                    onChange={(v) => setModelId(v ?? undefined)}
                    options={uniq.modelIds}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="modelType"
                    value={modelType}
                    onChange={(v) => setModelType(v ?? undefined)}
                    options={uniq.modelTypes}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="flowKey"
                    value={flowKey}
                    onChange={(v) => setFlowKey(v ?? undefined)}
                    options={uniq.flowKeys}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="stepKey"
                    value={stepKey}
                    onChange={(v) => setStepKey(v ?? undefined)}
                    options={uniq.stepKeys}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="eventName"
                    value={eventName}
                    onChange={(v) => setEventName(v ?? undefined)}
                    options={uniq.eventNames}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={10}>
                  <Select<string>
                    size="small"
                    allowClear
                    showSearch
                    placeholder="runId"
                    value={runId}
                    onChange={(v) => setRunId(v ?? undefined)}
                    options={uniq.runIds}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    size="small"
                    min={0}
                    placeholder={t('min duration(ms)')}
                    value={minDuration}
                    onChange={(v) => setMinDuration(typeof v === 'number' ? v : undefined)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Switch size="small" checked={slowOnly} onChange={setSlowOnly} />
                    <Typography.Text>{t('Slow only')}</Typography.Text>
                  </Space>
                </Col>
              </Row>
              <div style={{ height: 8 }} />
              <Space wrap>
                <Button
                  size="small"
                  onClick={() => {
                    setLevels(['error', 'warn', 'info', 'debug']);
                    setTypeLike('');
                    setModelId(undefined);
                    setModelType(undefined);
                    setFlowKey(undefined);
                    setStepKey(undefined);
                    setEventName(undefined);
                    setRunId(undefined);
                    setMinDuration(undefined);
                    setSlowOnly(false);
                    saveJSON(STORAGE_KEYS.filters, {
                      levels: ['error', 'warn', 'info', 'debug'],
                      typeLike: '',
                      modelId: undefined,
                      modelType: undefined,
                      flowKey: undefined,
                      stepKey: undefined,
                      eventName: undefined,
                      runId: undefined,
                      minDuration: undefined,
                      slowOnly: false,
                    });
                  }}
                >
                  {t('Reset')}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const engineFilters: Record<string, unknown> = {};
                    const typesSel: string[] = uniq.types
                      .map((o) => o.value as string)
                      .filter((s) => (typeLike ? s.toLowerCase().includes(typeLike.toLowerCase()) : true));
                    if (typeLike && typesSel.length) engineFilters.types = typesSel;
                    if (modelId) engineFilters.modelId = [modelId];
                    if (modelType) engineFilters.modelType = [modelType];
                    if (flowKey) engineFilters.flowKey = [flowKey];
                    if (stepKey) engineFilters.stepKey = [stepKey];
                    if (eventName) engineFilters.eventName = [eventName];
                    if (runId) engineFilters.runId = [runId];
                    if (!engine?.logManager?.setOptions) {
                      console.warn('FlowDevtools: cannot apply engine filters, setOptions unavailable');
                      return;
                    }
                    const next = Object.assign({}, engine.logManager.options || {}, {
                      filters: Object.keys(engineFilters).length ? engineFilters : undefined,
                    });
                    engine.logManager.setOptions(next);
                    saveJSON(STORAGE_KEYS.filters, {
                      levels,
                      typeLike,
                      modelId,
                      modelType,
                      flowKey,
                      stepKey,
                      eventName,
                      runId,
                      minDuration,
                      slowOnly,
                    });
                    const snap = engine.logManager.bus?.getSnapshot?.() || [];
                    setRows(snap);
                  }}
                  disabled={!engineReady}
                >
                  {t('Apply engine filters')}
                </Button>
                <Space size={8}>
                  <Typography.Text type="secondary">{t('Presets')}</Typography.Text>
                  <Select
                    allowClear
                    placeholder={t('Select preset')}
                    style={{ width: 200 }}
                    options={(() => {
                      const obj = loadJSON<Record<string, StoredFilters>>('nb.flow.logs.filterPresets') || {};
                      return Object.keys(obj).map((name) => ({ value: name, label: name }));
                    })()}
                    onChange={(name) => {
                      try {
                        const obj = loadJSON<Record<string, StoredFilters>>('nb.flow.logs.filterPresets') || {};
                        const p = name ? obj?.[name as string] : undefined;
                        if (!p) return;
                        Array.isArray(p.levels) && setLevels(p.levels as LogLevel[]);
                        typeof p.typeLike === 'string' && setTypeLike(p.typeLike);
                        setModelId(p.modelId || undefined);
                        setModelType(p.modelType || undefined);
                        setFlowKey(p.flowKey || undefined);
                        setStepKey(p.stepKey || undefined);
                        setEventName(p.eventName || undefined);
                        setRunId(p.runId || undefined);
                        setMinDuration(typeof p.minDuration === 'number' ? p.minDuration : undefined);
                        setSlowOnly(!!p.slowOnly);
                      } catch (e) {
                        console.warn('FlowDevtools: apply preset failed', e);
                      }
                    }}
                  />
                  <Input placeholder={t('Preset name')} style={{ width: 200 }} id="nb-flow-logs-preset-name" />
                  <Button
                    onClick={() => {
                      const nameEl = document.getElementById('nb-flow-logs-preset-name') as HTMLInputElement | null;
                      const name = nameEl?.value?.trim();
                      if (!name) return;
                      const obj = loadJSON('nb.flow.logs.filterPresets') || {};
                      obj[name] = {
                        levels,
                        typeLike,
                        modelId,
                        modelType,
                        flowKey,
                        stepKey,
                        eventName,
                        runId,
                        minDuration,
                        slowOnly,
                      };
                      saveJSON('nb.flow.logs.filterPresets', obj);
                    }}
                  >
                    {t('Save')}
                  </Button>
                  <Button
                    danger
                    onClick={() => {
                      const nameEl = document.getElementById('nb-flow-logs-preset-name') as HTMLInputElement | null;
                      const name = nameEl?.value?.trim();
                      if (!name) return;
                      const obj = loadJSON('nb.flow.logs.filterPresets') || {};
                      if (obj[name]) {
                        delete obj[name];
                        saveJSON('nb.flow.logs.filterPresets', obj);
                      }
                    }}
                  >
                    {t('Delete')}
                  </Button>
                </Space>
              </Space>
            </div>
          </Collapse.Panel>
          <Collapse.Panel header={t('Publish options')} key="p">
            <Space wrap>
              <Space>
                <Switch size="small" checked={optSlowEvent} onChange={setOptSlowEvent} />
                <Typography.Text>{t('slowOnly(event)')}</Typography.Text>
              </Space>
              <Space>
                <Switch size="small" checked={optSlowStep} onChange={setOptSlowStep} />
                <Typography.Text>{t('slowOnly(step)')}</Typography.Text>
              </Space>
              <Space>
                <Switch size="small" checked={optDropStepStart} onChange={setOptDropStepStart} />
                <Typography.Text>{t('drop(step.start)')}</Typography.Text>
              </Space>
              <Space>
                <Switch size="small" checked={optDropCache} onChange={setOptDropCache} />
                <Typography.Text>{t('drop(cache.*)')}</Typography.Text>
              </Space>
              <Space>
                <Typography.Text>{t('sample(step.start)')}</Typography.Text>
                <InputNumber
                  size="small"
                  min={1}
                  value={optSampleStepStart}
                  onChange={(v) => setOptSampleStepStart(Number(v || 1))}
                  style={{ width: 100 }}
                />
              </Space>
              <Space>
                <Typography.Text>{t('sample(model.update)')}</Typography.Text>
                <InputNumber
                  size="small"
                  min={1}
                  value={optSampleModelUpdate}
                  onChange={(v) => setOptSampleModelUpdate(Number(v || 1))}
                  style={{ width: 120 }}
                />
              </Space>
              <Button
                size="small"
                onClick={() => {
                  const patch: LogOptions = {
                    slowOnly: { event: optSlowEvent || undefined, step: optSlowStep || undefined },
                    dropTypes: optDropStepStart ? ['step.start'] : [],
                    dropTypePrefixes: optDropCache ? ['cache.'] : [],
                    samples: { 'step.start': optSampleStepStart, 'model.update': optSampleModelUpdate },
                    capacity,
                  };
                  if (!engine?.logManager?.setOptions) {
                    console.warn('FlowDevtools: cannot apply publish options, setOptions unavailable');
                    return;
                  }
                  const next: LogOptions = Object.assign({}, engine.logManager.options || {}, patch);
                  engine.logManager.setOptions(next);
                  saveJSON(STORAGE_KEYS.options, next);
                  const snap = engine.logManager.bus?.getSnapshot?.() || [];
                  setRows(snap);
                }}
                disabled={!engineReady}
              >
                {t('Apply publish options')}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const next: LogOptions = {
                    slowOnly: undefined,
                    dropTypes: ['step.start'],
                    dropTypePrefixes: ['cache.'],
                    samples: { 'step.start': 10, 'model.update': 10, 'event.flow.dispatch': 5 },
                    capacity: 2000,
                    maxRatePerSec: undefined,
                    // maxPerSecByType intentionally omitted in type
                  };
                  if (!engine?.logManager?.setOptions) {
                    console.warn('FlowDevtools: cannot reset publish options, setOptions unavailable');
                    return;
                  }
                  const merged: LogOptions = Object.assign({}, engine.logManager.options || {}, next);
                  engine.logManager.setOptions(merged);
                  saveJSON(STORAGE_KEYS.options, merged);
                  const snap = engine.logManager.bus?.getSnapshot?.() || [];
                  setRows(snap);
                }}
                disabled={!engineReady}
              >
                {t('Reset publish options')}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  const next: LogOptions = {
                    slowOnly: undefined,
                    dropTypes: ['step.start'],
                    dropTypePrefixes: ['cache.'],
                    samples: { 'step.start': 10, 'model.update': 10, 'event.flow.dispatch': 5 },
                  };
                  if (!engine?.logManager?.setOptions) {
                    console.warn('FlowDevtools: cannot apply default noise reduction, setOptions unavailable');
                    return;
                  }
                  const merged: LogOptions = Object.assign({}, engine.logManager.options || {}, next);
                  engine.logManager.setOptions(merged);
                  setOptSlowEvent(false);
                  setOptSlowStep(false);
                  setOptDropStepStart(true);
                  setOptDropCache(true);
                  setOptSampleStepStart(10);
                  setOptSampleModelUpdate(10);
                  saveJSON(STORAGE_KEYS.options, merged);
                  const snap = engine.logManager.bus?.getSnapshot?.() || [];
                  setRows(snap);
                }}
                disabled={!engineReady}
              >
                {t('Default noise reduction')}
              </Button>
            </Space>
          </Collapse.Panel>
        </Collapse>
      )}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'table',
            label: t('Table'),
            children: (
              <Table<FlowLogRecord>
                size="small"
                columns={columns}
                dataSource={filteredRows}
                rowKey={(r) => `${r.ts}-${r.type}-${r.runId || ''}-${r.stepKey || ''}-${r.modelId || ''}`}
                pagination={{ pageSize: 50 }}
                scroll={{ y: 560, x: 1200 }}
                tableLayout="fixed"
                onRow={(r) => ({
                  onClick: () => {
                    r.modelId && setModelId(r.modelId);
                    r.flowKey && setFlowKey(r.flowKey);
                    r.runId && setRunId(r.runId);
                    setFocusRunId(r.runId);
                    setFiltersOpen(true);
                    setActiveTab('timeline');
                  },
                  onDoubleClick: () => setDetail(r),
                })}
              />
            ),
          },
          {
            key: 'perf',
            label: t('Perf'),
            children: (() => {
              const perfTypes = new Set<string>([
                'variables.resolve.server',
                'variables.resolve.final',
                'step.params.resolve',
                'model.render',
                'event.end',
                'step.end',
              ]);
              const m = new Map<string, { count: number; sum: number; max: number }>();
              filteredRows.forEach((r) => {
                if (!perfTypes.has(r.type)) return;
                const d = typeof r.duration === 'number' ? r.duration : 0;
                const cur = m.get(r.type) || { count: 0, sum: 0, max: 0 };
                cur.count += 1;
                cur.sum += d;
                if (d > cur.max) cur.max = d;
                m.set(r.type, cur);
              });
              const data = Array.from(m.entries()).map(([type, v]) => ({
                type,
                count: v.count,
                max: Math.round(v.max),
                avg: v.count ? Math.round(v.sum / v.count) : 0,
              }));
              return (
                <Table<{ type: string; count: number; max: number; avg: number }>
                  size="small"
                  columns={
                    [
                      { title: t('Type'), dataIndex: 'type' },
                      { title: t('Count'), dataIndex: 'count', width: 100 },
                      { title: t('Max(ms)'), dataIndex: 'max', width: 120 },
                      { title: t('Avg(ms)'), dataIndex: 'avg', width: 120 },
                    ] as ColumnsType<{ type: string; count: number; max: number; avg: number }>
                  }
                  dataSource={data}
                  pagination={false}
                  rowKey={(r) => r.type}
                />
              );
            })(),
          },
          {
            key: 'timeline',
            label: `${t('Timeline')}${timelineRunId ? ` (${timelineRunId.slice(0, 8)}…)` : ''}`,
            children: (
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Typography.Text>{t('RunId focus:')}</Typography.Text>
                  <Input
                    style={{ width: 320 }}
                    value={timelineRunId}
                    onChange={(e) => setFocusRunId(e.target.value || undefined)}
                    placeholder="runId"
                  />
                  <Button onClick={() => setFocusRunId(undefined)}>{t('Clear focus')}</Button>
                </Space>
                <List
                  size="small"
                  dataSource={timelineRows}
                  renderItem={(r) => (
                    <List.Item>
                      <Space>
                        <Typography.Text type="secondary">{new Date(r.ts).toLocaleTimeString()}</Typography.Text>
                        <Tag color={levelColor[r.level] || 'default'}>{r.level}</Tag>
                        <Typography.Text>{r.type}</Typography.Text>
                        {r.flowKey && (
                          <Typography.Text>
                            {t('flow=')}
                            {r.flowKey}
                          </Typography.Text>
                        )}
                        {r.stepKey && (
                          <Typography.Text>
                            {t('step=')}
                            {r.stepKey}
                          </Typography.Text>
                        )}
                        {typeof r.duration === 'number' && (
                          <Typography.Text>
                            {t('duration=')}
                            {r.duration}ms
                          </Typography.Text>
                        )}
                        {r.status && (
                          <Typography.Text>
                            {t('status=')}
                            {r.status}
                          </Typography.Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                  style={{ maxHeight: 560, overflow: 'auto' }}
                />
              </div>
            ),
          },
          {
            key: 'topn',
            label: t('TopN slow'),
            children: (
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Typography.Text>{t('Types:')}</Typography.Text>
                  <Select<string>
                    mode="multiple"
                    value={topTypes}
                    onChange={(v) => setTopTypes(v as string[])}
                    style={{ width: 360 }}
                    options={[
                      { value: 'event.end', label: 'event.end' },
                      { value: 'step.end', label: 'step.end' },
                      { value: 'model.render', label: 'model.render' },
                      { value: 'step.params.resolve', label: 'step.params.resolve' },
                      { value: 'variables.resolve.server', label: 'variables.resolve.server' },
                      { value: 'variables.resolve.final', label: 'variables.resolve.final' },
                    ]}
                  />
                  <Typography.Text>{t('Group by:')}</Typography.Text>
                  <Select<'none' | 'modelId' | 'flowKey' | 'stepKey'>
                    value={topGroupBy}
                    onChange={(v) => setTopGroupBy(v)}
                    style={{ width: 160 }}
                    options={[
                      { value: 'none', label: t('none') },
                      { value: 'modelId', label: 'modelId' },
                      { value: 'flowKey', label: 'flowKey' },
                      { value: 'stepKey', label: 'stepKey' },
                    ]}
                  />
                </Space>
                <Table<AnyLogRow>
                  size="small"
                  columns={columns as ColumnsType<AnyLogRow>}
                  dataSource={topNRows}
                  rowKey={(r) =>
                    `${r.ts}-${r.type}-${r._groupKey || ''}-${r.runId || ''}-${r.stepKey || ''}-${r.modelId || ''}`
                  }
                  pagination={{ pageSize: 50 }}
                  scroll={{ y: 520, x: 1200 }}
                  tableLayout="fixed"
                  onRow={(r) => ({
                    onClick: () => {
                      if (r._groupKey && topGroupBy !== 'none') {
                        if (r.runId) setFocusRunId(r.runId);
                        setActiveTab('timeline');
                      } else if (r.runId) {
                        setFocusRunId(r.runId);
                        setActiveTab('timeline');
                      }
                    },
                    onDoubleClick: () => setDetail(r),
                  })}
                />
              </div>
            ),
          },
        ]}
      />
      <Drawer open={!!detail} title={t('Log detail')} width={720} destroyOnClose onClose={() => setDetail(null)}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{detail ? JSON.stringify(detail, null, 2) : ''}</pre>
      </Drawer>
    </div>
  );
};

export default FlowLogsPanel;
