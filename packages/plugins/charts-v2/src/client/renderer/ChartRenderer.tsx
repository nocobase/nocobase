import { GeneralSchemaDesigner, SchemaSettings } from '@nocobase/client';
import React, { useContext } from 'react';
import { Empty, Result, Typography } from 'antd';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block';
import { useFieldSchema, useField } from '@formily/react';
import { useChartComponent } from './ChartLibrary';
import { ErrorBoundary } from 'react-error-boundary';
const { Paragraph, Text } = Typography;

export type ChartRendererProps = {
  query?: Partial<{
    measures: {
      field: string;
      aggregate?: string;
      alias?: string;
    }[];
    dimensions: {
      field: string;
      alias?: string;
      format?: string;
    }[];
    sort: {
      field: string;
      order: 'asc' | 'desc';
    };
    filter: any;
  }>;
  config?: {
    chartType: string;
    chartConfig: string;
  };
};

export const ChartRenderer: React.FC<ChartRendererProps> & {
  Designer: React.FC;
} = (props) => {
  const { query, config } = props;
  const data = [
    {
      Date: '2010-01',
      scales: 1998,
    },
    {
      Date: '2010-02',
      scales: 1850,
    },
    {
      Date: '2010-03',
      scales: 1720,
    },
    {
      Date: '2010-04',
      scales: 1818,
    },
    {
      Date: '2010-05',
      scales: 1920,
    },
    {
      Date: '2010-06',
      scales: 1802,
    },
    {
      Date: '2010-07',
      scales: 1945,
    },
    {
      Date: '2010-08',
      scales: 1856,
    },
    {
      Date: '2010-09',
      scales: 2107,
    },
    {
      Date: '2010-10',
      scales: 2140,
    },
    {
      Date: '2010-11',
      scales: 2311,
    },
    {
      Date: '2010-12',
      scales: 1972,
    },
    {
      Date: '2011-01',
      scales: 1760,
    },
    {
      Date: '2011-02',
      scales: 1824,
    },
    {
      Date: '2011-03',
      scales: 1801,
    },
    {
      Date: '2011-04',
      scales: 2001,
    },
    {
      Date: '2011-05',
      scales: 1640,
    },
    {
      Date: '2011-06',
      scales: 1502,
    },
    {
      Date: '2011-07',
      scales: 1621,
    },
    {
      Date: '2011-08',
      scales: 1480,
    },
    {
      Date: '2011-09',
      scales: 1549,
    },
    {
      Date: '2011-10',
      scales: 1390,
    },
    {
      Date: '2011-11',
      scales: 1325,
    },
    {
      Date: '2011-12',
      scales: 1250,
    },
    {
      Date: '2012-01',
      scales: 1394,
    },
    {
      Date: '2012-02',
      scales: 1406,
    },
    {
      Date: '2012-03',
      scales: 1578,
    },
    {
      Date: '2012-04',
      scales: 1465,
    },
    {
      Date: '2012-05',
      scales: 1689,
    },
    {
      Date: '2012-06',
      scales: 1755,
    },
  ];
  const { t } = useChartsTranslation();
  const C = () => {
    const chartType = config?.chartType || '-';
    const [library, type] = chartType.split('-');
    const Component = useChartComponent(library, type);
    let chartConfig = {};
    try {
      chartConfig = JSON.parse(config?.chartConfig || '{}');
    } catch (err) {
      console.error(err);
    }

    return Component ? (
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <Component {...{ ...chartConfig, data }} />
      </ErrorBoundary>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Chart not configured.')} />
    );
  };
  return <C />;
};

ChartRenderer.Designer = function Designer() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const field = useField();
  const schema = useFieldSchema();
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.Item
        key="configure"
        onClick={() => {
          setCurrent({ schema, field, collection: field?.componentProps?.collection });
          setVisible(true);
        }}
      >
        {t('Configure')}
      </SchemaSettings.Item>
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        // removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ChartV2Block',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

const ErrorFallback = ({ error }) => {
  const { t } = useChartsTranslation();

  return (
    <div style={{ backgroundColor: 'white' }}>
      <Result status="error" title={t('Render Failed')} subTitle={t('Please check the configuration.')}>
        <Paragraph copyable>
          <Text type="danger" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
            {error.message}
          </Text>
        </Paragraph>
      </Result>
    </div>
  );
};
