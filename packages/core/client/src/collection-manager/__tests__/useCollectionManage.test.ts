import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCollection } from '../hooks/useCollection';

describe('useCollection', () => {
    it('returns fields and getField', () => {
      const { result } = renderHook(() => useCollection());
      const [ fields, getField ]: [any[], Function] = result.current;
  
    //   expect(fields).toBe([]);
      expect(getField).toBeDefined();
  
    });
  });