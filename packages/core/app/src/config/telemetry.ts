import { TelemetryOptions } from '@nocobase/telemetry';

export const telemetry: TelemetryOptions & { enabled?: boolean } = {
  enabled: process.env.TELEMETRY_ENABLED === 'true',
  metric: {
    readerName: process.env.TELEMETRY_METRIC_READER_NAME,
  },
  trace: {
    exporterName: process.env.TELEMETRY_TRACE_EXPORTER_NAME,
  },
};
