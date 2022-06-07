import { Area, Bar, Column, Line, Pie } from '@antv/g2plot';
import { observer, useField } from '@formily/react';
import cls from 'classnames';
import React, { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { G2PlotDesigner } from './G2PlotDesigner';

export type ReactG2PlotProps<O> = {
  readonly className?: string;
  readonly plot: any;
  readonly config: O;
};

const plots = { Area, Column, Line, Pie, Bar };

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
  const field = useField();
  const { t } = useTranslation();
  if (!plot || !config) {
    return <div style={{ opacity: .3 }}>{t('In configuration')}...</div>
  }
  return (
    <div>
      {field.title && <h2>{field.title}</h2>}
      <G2PlotRenderer plot={plots[plot]} config={config} />
    </div>
  );
});

G2Plot.Designer = G2PlotDesigner;
G2Plot.plots = plots;
