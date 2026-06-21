/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import {
  MetricReader,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
  MeterProvider,
  type MeterProviderOptions,
  ViewOptions,
  AggregationType,
  AggregationTemporality,
} from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import opentelemetry from '@opentelemetry/api';

export type MetricOptions = {
  meterName?: string;
  version?: string;
  readerName?: string | string[];
};

type GetMetricReader = () => MetricReader;

export class Metric {
  meterName: string;
  version: string;
  readerName: string | string[];
  readers = new Registry<GetMetricReader>();
  provider?: MeterProvider;
  resource?: Resource;
  activeReaders: MetricReader[] = [];

  constructor(options?: MetricOptions) {
    const { meterName, readerName, version } = options || {};
    this.readerName = readerName || 'console';
    this.meterName = meterName || 'nocobase-meter';
    this.version = version || '';

    this.registerReader(
      'console',
      () =>
        new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter({
            temporalitySelector: () => AggregationTemporality.DELTA,
          }),
        }),
    );
  }

  init(resource: Resource) {
    this.resource = resource;
  }

  registerReader(name: string, reader: GetMetricReader) {
    this.readers.register(name, reader);
  }

  getReader(name: string) {
    return this.readers.get(name);
  }

  start() {
    if (!this.resource) {
      throw new Error('Metric.init(resource) must be called before start()');
    }

    const metricNames = new Set(
      (process.env.TELEMETRY_METRICS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    const views: ViewOptions[] = [];

    if (metricNames.size > 0) {
      for (const metricName of metricNames) {
        views.push({
          instrumentName: metricName,
        });
      }
      views.push({
        instrumentName: '*',
        aggregation: { type: AggregationType.DROP },
      });
    }

    let readerNames = this.readerName;
    if (typeof readerNames === 'string') {
      readerNames = readerNames
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
    }

    const readers: MetricReader[] = [];

    for (const name of readerNames) {
      const reader = this.readers.get(name);

      if (!reader) {
        continue;
      }

      readers.push(reader());
    }

    this.activeReaders = readers;

    const providerOptions: MeterProviderOptions = {
      resource: this.resource,
      readers,
    };
    if (views.length > 0) {
      providerOptions.views = views;
    }

    this.provider = new MeterProvider(providerOptions);
    opentelemetry.metrics.setGlobalMeterProvider(this.provider);
  }

  getMeter(name?: string, version?: string) {
    if (!this.provider) {
      return null;
    }
    return this.provider.getMeter(name || this.meterName, version || this.version);
  }

  async shutdown() {
    await Promise.all(this.activeReaders.map((r) => r.shutdown()));
    await this.provider?.shutdown();
  }
}
