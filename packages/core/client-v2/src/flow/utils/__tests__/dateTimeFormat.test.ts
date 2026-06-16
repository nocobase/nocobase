/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { dateTimeFormat } from '../../actions/dateTimeFormat';

describe('dateTimeFormat', () => {
  it('only shows the time format schema for interface time fields', () => {
    const ctx = {
      model: {
        context: {
          collectionField: {
            type: 'string',
            interface: 'time',
          },
        },
      },
    };

    expect(Object.keys(dateTimeFormat.uiSchema(ctx))).toEqual(['timeFormat']);
  });

  it('treats interface time fields as time fields', () => {
    const setProps = vi.fn();
    const ctx = {
      model: {
        context: {
          collectionField: {
            type: 'string',
            interface: 'time',
          },
        },
        setProps,
      },
    };

    dateTimeFormat.handler(ctx, { timeFormat: 'hh:mm:ss a' });

    expect(setProps).toHaveBeenCalledWith({
      timeFormat: 'hh:mm:ss a',
      format: 'hh:mm:ss a',
    });
  });

  it('uses the association title field when deciding the format schema', () => {
    const ctx = {
      model: {
        props: {
          titleField: 'shipmentsTime',
        },
        context: {
          collectionField: {
            type: 'belongsTo',
            targetCollection: {
              getField: (name) =>
                name === 'shipmentsTime'
                  ? {
                      type: 'time',
                      interface: 'time',
                    }
                  : null,
            },
          },
        },
      },
    };

    expect(Object.keys(dateTimeFormat.uiSchema(ctx))).toEqual(['timeFormat']);
  });

  it('saves association title time field format as a time format', () => {
    const setProps = vi.fn();
    const ctx = {
      model: {
        props: {
          titleField: 'shipmentsTime',
        },
        context: {
          collectionField: {
            type: 'belongsTo',
            targetCollection: {
              getField: (name) =>
                name === 'shipmentsTime'
                  ? {
                      type: 'time',
                      interface: 'time',
                    }
                  : null,
            },
          },
        },
        setProps,
      },
    };

    dateTimeFormat.handler(ctx, { timeFormat: 'hh:mm:ss a' });

    expect(setProps).toHaveBeenCalledWith({
      timeFormat: 'hh:mm:ss a',
      format: 'hh:mm:ss a',
    });
  });

  it('applies and persists date time format params when settings are saved', async () => {
    const setProps = vi.fn();
    const save = vi.fn();
    const ctx = {
      model: {
        props: {
          titleField: 'shipmentsDatetime',
        },
        context: {
          collectionField: {
            type: 'belongsTo',
            targetCollection: {
              getField: (name) =>
                name === 'shipmentsDatetime'
                  ? {
                      type: 'datetime',
                      interface: 'datetime',
                    }
                  : null,
            },
          },
        },
        setProps,
        save,
      },
    };

    await dateTimeFormat.beforeParamsSave(ctx, {
      picker: 'date',
      dateFormat: 'YYYY-MM-DD',
      showTime: true,
      timeFormat: 'hh:mm:ss a',
    });

    expect(setProps).toHaveBeenCalledWith({
      picker: 'date',
      dateFormat: 'YYYY-MM-DD',
      showTime: true,
      timeFormat: 'hh:mm:ss a',
      format: 'YYYY-MM-DD hh:mm:ss a',
    });
    expect(save).toHaveBeenCalled();
  });

  it('syncs table association column props when title date time format settings are saved', async () => {
    const setProps = vi.fn();
    const save = vi.fn();
    const setParentProps = vi.fn();
    const saveParent = vi.fn();
    const model = {
      props: {
        titleField: 'shipmentsDatetime',
      },
      context: {
        collectionField: {
          type: 'belongsTo',
          targetCollection: {
            getField: (name) =>
              name === 'shipmentsDatetime'
                ? {
                    type: 'datetime',
                    interface: 'datetime',
                  }
                : null,
          },
        },
      },
      setProps,
      save,
      parent: {
        use: 'TableColumnModel',
        collectionField: {
          isAssociationField: () => true,
        },
        setProps: setParentProps,
        save: saveParent,
      },
    };
    model.parent['subModels'] = {
      field: model,
    };

    await dateTimeFormat.beforeParamsSave(
      { model },
      {
        picker: 'date',
        dateFormat: 'YYYY-MM-DD',
        showTime: true,
        timeFormat: 'hh:mm:ss a',
      },
    );

    expect(setParentProps).toHaveBeenCalledWith({
      picker: 'date',
      dateFormat: 'YYYY-MM-DD',
      showTime: true,
      timeFormat: 'hh:mm:ss a',
      format: 'YYYY-MM-DD hh:mm:ss a',
    });
    expect(saveParent).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });

  it('hides time format for association title date-only fields', () => {
    const ctx = {
      model: {
        props: {
          titleField: 'shipmentsDateOnly',
          showTime: true,
        },
        context: {
          collectionField: {
            type: 'belongsTo',
            targetCollection: {
              getField: (name) =>
                name === 'shipmentsDateOnly'
                  ? {
                      type: 'dateOnly',
                      interface: 'date',
                      getComponentProps: () => ({
                        dateOnly: true,
                        showTime: false,
                      }),
                    }
                  : null,
            },
          },
        },
      },
    };
    const schema = dateTimeFormat.uiSchema(ctx);
    const timeFormatField: any = schema.timeFormat;
    const showTimeField: any = schema.showTime;
    const timeFormatState = {
      hidden: false,
      form: {
        values: {
          picker: 'date',
          showTime: true,
        },
      },
    };
    const showTimeState = {
      hidden: false,
      value: true,
      form: {
        values: {
          picker: 'date',
        },
      },
    };

    timeFormatField['x-reactions'][0](timeFormatState);
    showTimeField['x-reactions'][1](showTimeState);

    expect(timeFormatState.hidden).toBe(true);
    expect(showTimeState.hidden).toBe(true);
    expect(showTimeState.value).toBe(false);
    expect(dateTimeFormat.defaultParams(ctx)).toMatchObject({
      showTime: false,
    });
  });

  it('saves association title date-only field format without time even when params contain showTime', () => {
    const setProps = vi.fn();
    const ctx = {
      model: {
        props: {
          titleField: 'shipmentsDateOnly',
        },
        context: {
          collectionField: {
            type: 'belongsTo',
            targetCollection: {
              getField: (name) =>
                name === 'shipmentsDateOnly'
                  ? {
                      type: 'dateOnly',
                      interface: 'date',
                    }
                  : null,
            },
          },
        },
        setProps,
      },
    };

    dateTimeFormat.handler(ctx, {
      dateFormat: 'YYYY-MM-DD',
      showTime: true,
      timeFormat: 'HH:mm:ss',
    });

    expect(setProps).toHaveBeenCalledWith({
      dateFormat: 'YYYY-MM-DD',
      showTime: false,
      timeFormat: 'HH:mm:ss',
      format: 'YYYY-MM-DD',
    });
  });

  it('uses format as the default time format when timeFormat is missing', () => {
    const ctx = {
      model: {
        props: {},
        context: {
          collectionField: {
            interface: 'time',
            getComponentProps: () => ({
              format: 'hh:mm:ss a',
            }),
          },
        },
      },
    };

    expect(dateTimeFormat.defaultParams(ctx)).toMatchObject({
      timeFormat: 'hh:mm:ss a',
    });
  });

  it('does not use datetime format as the default time format for non-time fields', () => {
    const ctx = {
      model: {
        props: {},
        context: {
          collectionField: {
            type: 'datetime',
            interface: 'datetime',
            getComponentProps: () => ({
              format: 'YYYY-MM-DD hh:mm:ss a',
            }),
          },
        },
      },
    };

    expect(dateTimeFormat.defaultParams(ctx)).toMatchObject({
      timeFormat: 'HH:mm:ss',
    });
  });
});
