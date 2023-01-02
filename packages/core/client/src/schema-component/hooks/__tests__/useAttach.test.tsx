import React, { useMemo } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { createForm, Field } from '@formily/core';
import { useField } from '@formily/react';
import { render } from '@testing-library/react';
import { useAttach } from '../useAttach';

describe('useAttach', () => {
  it('useAttach', () => {
    const onMount = jest.fn();
    const { rerender } = renderHook(() => {
      const field = useField<Field>() || { props: { name: 'test' } };
      const form = useMemo(() => createForm(), []);
      return useAttach({ ...form.createVoidField({ ...field.props, basePath: '' }), onMount });
    });
    rerender();
    expect(onMount).toBeCalledTimes(2);
  });
});
