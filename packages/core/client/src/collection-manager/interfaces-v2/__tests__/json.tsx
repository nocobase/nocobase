import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { CurrentAppInfoContext } from '../../../appInfo';
import { Checkbox } from '../../../schema-component/antd/checkbox';
import { Input } from '../../../schema-component/antd/input';
import { SchemaComponent } from '../../../schema-component/core/SchemaComponent';
import { SchemaComponentProvider } from '../../../schema-component/core/SchemaComponentProvider';
import { json } from '../json';

const Component = () => {
  return (
    <SchemaComponentProvider components={{ Input, Checkbox }}>
      <SchemaComponent schema={json} />
    </SchemaComponentProvider>
  );
};

// TODO: 需要先修复测试中的路径问题：即某些引用路径返回的模块是 undefined
describe('JSON', () => {
  it('should show JSONB when dialect is postgres', async () => {
    render(<Component />, {
      wrapper: ({ children }) => (
        <CurrentAppInfoContext.Provider
          value={{
            data: {
              database: {
                dialect: 'postgres',
              },
            },
          }}
        >
          {children}
        </CurrentAppInfoContext.Provider>
      ),
    });

    await waitFor(() => {
      expect(screen.queryByText('JSONB')).toBeInTheDocument();
    });
  });
});
