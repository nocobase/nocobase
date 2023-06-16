import { render, screen } from '@testing-library/react';
import { ChartLibraryProvider, ChartRenderer, ChartRendererProvider } from '../renderer';
import React from 'react';

describe('ChartRenderer', () => {
  it('should render correctly', () => {
    render(
      <ChartLibraryProvider
        name="Test"
        charts={{
          chart: {
            name: 'Chart',
            component: () => <div role="chart">Chart</div>,
          },
        }}
        useProps={(info) => info}
      >
        <ChartRendererProvider
          query={{}}
          config={{
            chartType: 'Test-chart',
            general: {},
            advanced: {},
          }}
          collection=""
          transform={[]}
        >
          <ChartRenderer />
        </ChartRendererProvider>
      </ChartLibraryProvider>,
    );
    expect(screen.getByText('Please configure and run query')).toBeInTheDocument();
  });
});
