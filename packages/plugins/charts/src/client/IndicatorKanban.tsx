import * as React from 'react';
import { useMemo, useState } from 'react';
import { Card, Divider, Spin } from 'antd';

type Props = {
  config: {
    metric: string;
    aggregation: string;
    title: string;
  };
  dataSet: object[];
};

function aggregationComputed(dataSet: object[], metric: string, aggregation: string) {
  if (!dataSet || dataSet.length === 0 || !metric || !aggregation) {
    return <Spin />;
  }
  switch (aggregation) {
    case 'SUM':
      return dataSet.reduce((acc, cur) => acc + cur[metric], 0);
    case 'AVG':
      return dataSet.reduce((acc, cur) => acc + cur[metric], 0) / dataSet.length;
    case 'COUNT':
      return dataSet.length;
    case 'MAX':
      return Math.max(...dataSet.map((item) => item[metric]));
    case 'MIN':
      return Math.min(...dataSet.map((item) => item[metric]));
    case 'NONE':
      return dataSet[0][metric];
  }
}

export function IndicatorKanban(props: Props) {
  const { config, dataSet } = props;
  const { metric, aggregation, title } = config;
  const result = useMemo(() => aggregationComputed(dataSet, metric, aggregation), [dataSet, metric, aggregation]);
  return (
    <div>
      {result && (
        <Card title={title ?? ''} bordered={false}>
          {result}
        </Card>
      )}
    </div>
  );
}
