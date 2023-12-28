import { Registry } from '@nocobase/utils';
import {
  MetricReader,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
  MeterProvider,
} from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';

export type MetricOptions = {
  meterName?: string;
  readerName?: string | string[];
};

export class Metric {
  meterName: string;
  readerName: string | string[];
  readers = new Registry<MetricReader>();
  provider: MeterProvider;

  constructor(options?: MetricOptions) {
    const { meterName, readerName } = options || {};
    this.readerName = readerName || 'console';
    this.meterName = meterName || 'nocobase-meter';
    this.registerReader(
      'console',
      new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
      }),
    );
  }

  init(resource: Resource) {
    this.provider = new MeterProvider({ resource });
  }

  registerReader(name: string, reader: MetricReader) {
    this.readers.register(name, reader);
  }

  getReader(name: string) {
    return this.readers.get(name);
  }

  getMeter(name?: string) {
    name = name || this.meterName;
    return this.provider.getMeter(name);
  }

  start() {
    let readerName = this.readerName;
    if (typeof readerName === 'string') {
      readerName = readerName.split(',');
    }
    readerName.forEach((name) => {
      const reader = this.getReader(name);
      this.provider.addMetricReader(reader);
    });
  }

  shutdown() {
    return this.provider.shutdown();
  }
}
