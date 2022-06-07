import { Area, Bar, Column, Line, Pie } from '@antv/g2plot';
import { observer, useField } from '@formily/react';
import cls from 'classnames';
import React, { forwardRef, useEffect, useRef } from 'react';
import { G2PlotDesigner } from './G2PlotDesigner';

export type ReactG2PlotProps<O> = {
  readonly className?: string;
  readonly plot: any;
  readonly config: O;
};

export const G2Plot: any = forwardRef(function <O = any>(props: ReactG2PlotProps<O>, ref: any) {
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

G2Plot.Designer = G2PlotDesigner;

const plots = { Area, Column, Line, Pie, Bar };

Object.keys(plots).forEach((key) => {
  G2Plot[key] = observer((props: any) => {
    const field = useField();
    return (
      <div>
        {field.title && <h2>{field.title}</h2>}
        <G2Plot plot={plots[key]} config={props.config} />
      </div>
    );
  });
});
