import {
  Area,
  Bar,
  BidirectionalBar,
  Box,
  Bullet,
  Chord,
  CirclePacking,
  Column,
  DualAxes,
  Facet,
  Funnel,
  Gauge,
  Heatmap,
  Histogram,
  Line,
  Liquid,
  Mix,
  Pie,
  Progress,
  Radar,
  RadialBar,
  RingProgress,
  Rose,
  Sankey,
  Scatter,
  Stock,
  Sunburst,
  TinyArea,
  TinyColumn,
  TinyLine,
  Treemap,
  Venn,
  Violin,
  Waterfall,
  WordCloud
} from '@antv/g2plot';
import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import { Spin } from 'antd';
import cls from 'classnames';
import React, { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { G2PlotDesigner } from './G2PlotDesigner';

export type ReactG2PlotProps<O> = {
  readonly className?: string;
  readonly plot: any;
  readonly config: O;
};

const plots = {
  Line,
  Area,
  Column,
  Bar,
  Pie,
  Rose,
  WordCloud,
  Scatter,
  Radar,
  DualAxes,
  TinyLine,
  TinyColumn,
  TinyArea,
  Histogram,
  Progress,
  RingProgress,
  Heatmap,
  Box,
  Violin,
  Venn,
  Stock,
  Funnel,
  Liquid,
  Bullet,
  Sunburst,
  Gauge,
  Waterfall,
  RadialBar,
  BidirectionalBar,
  Treemap,
  Sankey,
  Chord,
  CirclePacking,
  Mix,
  Facet,
};

export const G2PlotRenderer = forwardRef(function <O = any>(props: ReactG2PlotProps<O>, ref: any) {
  const { className, plot, config } = props;

  const containerRef = useRef(undefined);
  const plotRef = useRef(undefined);

  function syncRef(source, target) {
    if (typeof target === 'function') {
      target(source.current);
    } else if (target) {
      target.current = source.current;
    }
  }

  function renderPlot() {
    if (plotRef.current) {
      plotRef.current.update(config);
    } else {
      plotRef.current = new plot(containerRef.current, config);
      plotRef.current.render();
    }

    syncRef(plotRef, ref);
  }

  function destoryPlot() {
    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = undefined;
    }
  }

  useEffect(() => {
    renderPlot();

    return () => destoryPlot();
  }, [config, plot]);

  return <div className={cls(['g2plot', className])} ref={containerRef} />;
});

export const G2Plot: any = observer((props: any) => {
  const { plot, config } = props;
  const field = useField<Field>();
  const { t } = useTranslation();
  const api = useAPIClient();
  useEffect(() => {
    field.data = field.data || {};
    field.data.loading = true;
    const fn = config?.data;
    if (typeof fn === 'function') {
      const result = fn.bind({ api })();
      if (result?.then) {
        result.then((data) => {
          if (Array.isArray(data)) {
            field.componentProps.config.data = data;
          }
          field.data.loading = false;
        });
      } else {
        field.data.loading = false;
      }
    } else {
      field.data.loading = false;
    }
  }, []);
  if (!plot || !config) {
    return <div style={{ opacity: 0.3 }}>{t('In configuration')}...</div>;
  }
  if (field?.data?.loading !== false) {
    return <Spin />;
  }
  return (
    <div>
      {field.title && <h2>{field.title}</h2>}
      <G2PlotRenderer
        plot={plots[plot]}
        config={{
          ...config,
          data: Array.isArray(config?.data) ? config.data : [],
        }}
      />
    </div>
  );
});

G2Plot.Designer = G2PlotDesigner;
G2Plot.plots = plots;
