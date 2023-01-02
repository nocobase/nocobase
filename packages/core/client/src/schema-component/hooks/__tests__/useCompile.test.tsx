import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../useCompile';
import { SchemaComponentOptions } from '../..';

describe('useCompile', () => {
  it('useCompile', () => {
    const wrapper: React.FC<any> = ({ children }) => {
      return <SchemaComponentOptions>{children}</SchemaComponentOptions>;
    };
    const { result } = renderHook(
      () => {
        const { t } = useTranslation();
        const title = '{{t("Hello", { ns: "test" })}}';
        const compile = useCompile();
        return compile(title,{t});
      },
      { wrapper },
    );
    expect(result.current).toBe('Hello');
  });
});
