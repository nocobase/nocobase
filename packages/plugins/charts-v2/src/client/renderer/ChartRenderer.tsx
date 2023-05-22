import { CardItem, GeneralSchemaDesigner, SchemaSettings, useDesigner } from '@nocobase/client';
import React, { useContext } from 'react';
import { css } from '@emotion/css';
import { Line } from '@ant-design/plots';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block/ChartConfigure';

const designerCss = css`
  position: relative;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-form-item:hover {
    > .general-schema-designer {
      background: rgba(241, 139, 98, 0.06) !important;
      border: 0 !important;
      top: -5px !important;
      bottom: -5px !important;
      left: -5px !important;
      right: -5px !important;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    border: 2px solid rgba(241, 139, 98, 0.3);
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

export const ChartRenderer: React.FC & {
  Designer: React.FC;
} = () => {
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
  const config = {
    data,
    xField: 'Date',
    yField: 'scales',
    xAxis: {
      // type: 'timeCat',
      tickCount: 5,
    },
  };
  return (
    // <div className={designerCss}>
    <Line {...config} />
    // </div>
  );
};

ChartRenderer.Designer = function Designer() {
  const { t } = useChartsTranslation();
  const { setVisible } = useContext(ChartConfigContext);
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.Item
        onClick={() => {
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
