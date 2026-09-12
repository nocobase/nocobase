/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { UserPasswordFieldModel } from '../models/UserPasswordFieldModel';
import { UserCreateFormModel, UserEditFormModel } from '../models/UserProfileFormModels';
import { UserRolesSelectFieldModel } from '../models/UserRolesSelectFieldModel';

const { dispatchEventDeep, formBlockContentProps, recordSelectRender } = vi.hoisted(() => ({
  dispatchEventDeep: vi.fn(),
  formBlockContentProps: [] as Array<Record<string, any>>,
  recordSelectRender: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const React = await import('react');

  return {
    Plugin: class Plugin {},
    CreateFormModel: class CreateFormModel {
      props: Record<string, unknown> = {};
      decoratorProps: Record<string, any> = {};
      subModels = {
        grid: {
          uid: 'grid',
        },
      };

      onInit() {}

      setDecoratorProps(props: Record<string, any>) {
        this.decoratorProps = props;
      }
    },
    EditFormModel: class EditFormModel {
      props: Record<string, unknown> = {};
      decoratorProps: Record<string, any> = {};
      subModels = {
        grid: {
          uid: 'grid',
        },
      };
      resource: Record<string, any> = {
        loading: false,
        getMeta: () => 0,
      };
      context = {
        themeToken: {
          colorTextDescription: '#999',
        },
      };

      onInit() {}

      setDecoratorProps(props: Record<string, any>) {
        this.decoratorProps = props;
      }

      hasAvailableData() {
        return true;
      }

      isMultiRecordResource() {
        return Boolean(this.resource?.__isMultiRecordResource);
      }

      translate(value: string) {
        return value;
      }
    },
    FormBlockContent: (props: Record<string, unknown>) => {
      formBlockContentProps.push(props);
      return React.createElement('div', { 'data-testid': 'form-block-content' }, props.footer as React.ReactNode);
    },
    dispatchEventDeep,
    PasswordFieldModel: class PasswordFieldModel {
      props: Record<string, unknown> = {};
      context: Record<string, any> = {};
      parent?: {
        getProps: () => Record<string, unknown>;
        setProps: (props: Record<string, unknown>) => void;
      };
    },
    PasswordInput: (props: { checkStrength?: boolean }) =>
      React.createElement('input', {
        'data-testid': 'password-input',
        'data-check-strength': String(props.checkStrength),
      }),
    RecordSelectFieldModel: class RecordSelectFieldModel {
      resource?: {
        addRequestParameter: (key: string, value: unknown) => void;
        addFilterGroup: (key: string, value: unknown) => void;
      };

      render() {
        recordSelectRender();
        return React.createElement('div', { 'data-testid': 'record-select-field' });
      }
    },
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const React = await import('react');

  class MockMultiRecordResource {
    __isMultiRecordResource = true;
    loading = false;
    page = 1;
    totalPage = 3;
    meta: Record<string, unknown> = {
      count: 3,
    };
    setPage = vi.fn((page: number) => {
      this.page = page;
    });
    refresh = vi.fn();
    getPage = vi.fn(() => this.page);
    getTotalPage = vi.fn(() => this.totalPage);
    getMeta = vi.fn((key: string) => this.meta[key]);
  }

  return {
    FlowModelRenderer: ({ model }: { model: { uid?: string } }) =>
      React.createElement('div', { 'data-testid': 'flow-model-renderer' }, model.uid),
    MultiRecordResource: MockMultiRecordResource,
  };
});

vi.mock('@nocobase/plugin-acl/client-v2', () => ({
  default: class PluginAclClientV2 {},
}));

describe('plugin-users client-v2 field models', () => {
  afterEach(() => {
    vi.clearAllMocks();
    formBlockContentProps.length = 0;
  });

  it('renders password input with strength disabled by default', () => {
    const model = new UserPasswordFieldModel();
    model.props = {};

    render(model.render());

    expect(screen.getByTestId('password-input')).toHaveAttribute('data-check-strength', 'false');
  });

  it('injects the password policy validator once and passes username context', async () => {
    const validator = vi.fn().mockResolvedValue('policy failed');
    const setProps = vi.fn();
    const model = new UserPasswordFieldModel();
    let parentProps = {
      rules: [{ required: true, message: 'required' }],
    };
    model.parent = {
      getProps: () => parentProps,
      setProps: (props) => {
        parentProps = {
          ...parentProps,
          ...props,
        };
        setProps(props);
      },
    };
    model.context = {
      app: {
        pm: {
          get: () => ({
            getPasswordValidators: () => [validator],
          }),
        },
      },
      form: {
        getFieldValue: () => 'alice',
      },
    };

    render(model.render());
    render(model.render());

    expect(setProps).toHaveBeenCalledTimes(1);
    const injectedRules = setProps.mock.calls[0][0].rules as Array<Record<string, any>>;
    expect(injectedRules).toHaveLength(2);
    expect(injectedRules[1].__pluginUsersPasswordPolicy).toBe(true);

    await expect(injectedRules[1].validator({}, 'alice-password')).rejects.toThrow('policy failed');
    expect(validator).toHaveBeenCalledWith('alice-password', { username: 'alice' });
  });

  it('adds role select resource defaults before rendering', () => {
    const model = new UserRolesSelectFieldModel();
    const addRequestParameter = vi.fn();
    const addFilterGroup = vi.fn();
    model.resource = {
      addRequestParameter,
      addFilterGroup,
    };

    render(model.render());

    expect(addRequestParameter).toHaveBeenCalledWith('showAnonymous', true);
    expect(addFilterGroup).toHaveBeenCalledWith('__plugin_users__exclude_root_role__', {
      'name.$ne': 'root',
    });
    expect(recordSelectRender).toHaveBeenCalled();
    expect(screen.getByTestId('record-select-field')).toBeInTheDocument();
  });

  it('initializes create profile form with borderless decorator and renders grid content', () => {
    const model = new UserCreateFormModel();
    model.props = {
      colon: false,
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      layout: 'vertical',
    };

    model.onInit({});
    render(model.renderComponent());

    expect(model.decoratorProps).toEqual(
      expect.objectContaining({
        bordered: false,
        className: expect.any(String),
      }),
    );
    expect(screen.getByTestId('form-block-content')).toBeInTheDocument();
    expect(formBlockContentProps[0]).toEqual(
      expect.objectContaining({
        model,
        gridModel: model.subModels.grid,
        layoutProps: {
          colon: false,
          labelAlign: 'left',
          labelWidth: 120,
          labelWrap: true,
          layout: 'vertical',
        },
      }),
    );
  });

  it('renders edit profile empty state when no data is available', () => {
    const model = new UserEditFormModel();
    model.hasAvailableData = () => false;
    model.resource = {
      loading: false,
      getMeta: () => 0,
    };

    render(model.renderComponent());

    expect(screen.getByText('No available data currently')).toBeInTheDocument();
  });

  it('refreshes multi-record edit profile resource on pagination change', async () => {
    const model = new UserEditFormModel();
    const resource = new MultiRecordResource() as MultiRecordResource & {
      setPage: ReturnType<typeof vi.fn>;
      refresh: ReturnType<typeof vi.fn>;
    };
    model.resource = resource;

    await model.handlePageChange(2);

    expect(resource.setPage).toHaveBeenCalledWith(2);
    expect(resource.loading).toBe(true);
    expect(resource.refresh).toHaveBeenCalled();
    expect(dispatchEventDeep).toHaveBeenCalledWith(model, 'paginationChange');
  });
});
