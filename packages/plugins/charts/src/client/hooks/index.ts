import { useChartQueryMetadataContext } from '../ChartQueryMetadataProvider';
import { useEffect, useState } from 'react';

const useFieldsById = (queryId: number) => {
  const [fields, setFields] = useState([]);
  const ctx = useChartQueryMetadataContext();
  useEffect(() => {
    const chartQueryList = ctx?.data;
    if (chartQueryList && Array.isArray(chartQueryList)) {
      const currentQuery = chartQueryList.find((chartQuery) => chartQuery.id === queryId);
      setFields(currentQuery?.fields || []);
    }
  }, [queryId]);
  return {
    fields,
  };
};

export { useFieldsById };
