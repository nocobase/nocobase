import { useFieldSchema } from '@formily/react';
import { useBlockResource } from '@nocobase/client';
import { EventContext, useAddEventListener, useApplyFilter } from '@nocobase/plugin-event-filter-system/client';
import { Spin, Table, Button, Space, Row, Flex } from 'antd';
import React, { useMemo } from 'react';
import { useApp } from '@nocobase/client';

const DemoTable = (props) => {
  const { done, result } = useApplyFilter('core:block:table', { props });
  const fieldSchema = useFieldSchema();
  const resource = useBlockResource();
  const app = useApp();

  useAddEventListener('core:block:table:refresh', (ctx: EventContext) => {
    console.log('core:block:table:refresh', ctx);
    resource.list();
  });

  const actionEventContext: EventContext = useMemo(() => {
    return {
      source: {
        uischema: fieldSchema.toJSON(),
      },
    };
  }, [fieldSchema]);

  if (!done) {
    return <Spin />;
  }

  const columns = result?.columns || [];
  const data = result?.data?.data || [];
  const actions = result?.actions || [];

  return (
    <Flex vertical style={{ height: result?.height, width: result?.width }}>
      <Row justify="end" style={{ marginBottom: '16px' }}>
        <Space>
          {actions.map((action) => (
            <Button key={action.label} onClick={async () => await action.handle(actionEventContext)}>
              {action.label}
            </Button>
          ))}
        </Space>
      </Row>
      <Table style={{ width: '100%' }} columns={columns} dataSource={data} />
    </Flex>
  );
};

export default DemoTable;
