import React, { useMemo, useState } from 'react';
import { Card } from 'antd';
import { FlowContext, FlowContextProvider } from '@nocobase/flow-engine';
import { TextAreaWithContextSelector } from '../../../../../../src/flow/components/TextAreaWithContextSelector';

export default () => {
  const [value, setValue] = useState<string>('Hello, {{ ctx.user.name }}');

  const ctx = useMemo(() => {
    const c = new FlowContext();
    c.defineProperty('user', {
      value: { name: 'Alice' },
      meta: {
        title: 'User',
        type: 'object',
        properties: { name: { title: 'Name', type: 'string' } },
      },
    });
    return c;
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <Card size="small" title="简单示例">
        <FlowContextProvider context={ctx}>
          <TextAreaWithContextSelector value={value} onChange={setValue} rows={2} />
        </FlowContextProvider>
        <pre style={{ marginTop: 12, background: '#f7f7f7', padding: 8, borderRadius: 4 }}>{value}</pre>
      </Card>
    </div>
  );
};
