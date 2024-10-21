/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react-hooks';
import { PopupContext, usePopupContextInActionOrAssociationField } from '../usePopupContextInActionOrAssociationField';

vi.mock('../../../hooks/useDesignable', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useDesignable() {
      return { dn: dnMock };
    },
  };
});

vi.mock('@formily/react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useFieldSchema() {
      return fieldSchemaMock;
    },
  };
});

let fieldSchemaMock = null;
let dnMock = null;

describe('usePopupContextInActionOrAssociationField', () => {
  test('updatePopupContext should update the x-action-context field in the popup schema', () => {
    fieldSchemaMock = {
      properties: {
        drawer: {
          'x-uid': 'drawer',
        },
      },
      'x-uid': 'fieldSchemaMock',
    };

    dnMock = {
      emit: vi.fn(),
    };

    const { result } = renderHook(() => usePopupContextInActionOrAssociationField());

    const context: PopupContext = {
      dataSource: 'dataSource',
      collection: 'collection',
      association: 'association',
    };

    result.current.updatePopupContext(context);

    expect(dnMock.emit).toHaveBeenCalledWith('initializeActionContext', {
      schema: {
        'x-uid': fieldSchemaMock['x-uid'],
        'x-action-context': context,
      },
    });
    expect(dnMock.emit).toHaveBeenCalledTimes(1);
    expect(fieldSchemaMock).toEqual({
      properties: {
        drawer: {
          'x-uid': 'drawer',
        },
      },
      'x-action-context': context,
      'x-uid': 'fieldSchemaMock',
    });

    // Updating with the same values again should not trigger emit
    result.current.updatePopupContext(context);
    expect(dnMock.emit).toHaveBeenCalledTimes(1);

    // It will filter out null and undefined values
    result.current.updatePopupContext({
      ...context,
      collection: undefined,
    });
    expect(dnMock.emit).toHaveBeenCalledWith('initializeActionContext', {
      schema: {
        'x-uid': fieldSchemaMock['x-uid'],
        'x-action-context': {
          dataSource: 'dataSource',
          association: 'association',
        },
      },
    });
    expect(dnMock.emit).toHaveBeenCalledTimes(2);
  });
});
