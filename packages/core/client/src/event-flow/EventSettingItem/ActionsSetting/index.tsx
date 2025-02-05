/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useMemo } from 'react';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useCollectionParentRecordData } from '../../../data-source/collection-record/CollectionRecordProvider';
import { CollectionProvider } from '../../../data-source/collection/CollectionProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { RecordProvider } from '../../../record-provider';
import { SchemaComponent, useProps } from '../../../schema-component';
import { SubFormProvider } from '../../../schema-component/antd/association-field/hooks';
import { DynamicComponentProps } from '../../../schema-component/antd/filter/DynamicComponent';
import { FilterContext } from '../../../schema-component/antd/filter/context';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import { ActionsField } from './Actions';
import { FormProvider, createSchemaField } from '@formily/react';
import { ArrayCollapse } from '../components/LinkageHeader';
import { Filter } from '../Filter';
import { ArrayBase, Select, DatePicker, Editable, Input, ArrayItems, FormItem } from '@formily/antd-v5';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { EventDefinition, EventSetting } from '../../types';
import { useVariableOptions } from '../hooks/useVariableOptions';
import { uniqBy } from 'lodash';
import { AddBtn, DeleteBtn } from './AddBtn';
import { ActionSelect } from '../components/ActionSelect';
import { ActionParamSelect } from '../components/ActionParamSelect';
import { Space } from 'antd';
import { useFormBlockContext } from '../../../block-provider';
import ConditionSelect from '../components/ConditionSelect';
import { actionsSchema } from '../schemas/actions';

const SchemaField = createSchemaField({
  components: {
    FormItem,
    DatePicker,
    Editable,
    Space, // 使用antd包内的Space组件，包含Compact
    Compact: Space.Compact,
    Input,
    Select,
    ArrayItems,
    ArrayCollapse,
    Filter,
    ActionSelect,
    ActionParamSelect,
    ConditionSelect,
  },
  scope: {
    emptyParams(field, target) {
      const params = field.query('.params').take(1);
      params.value = [];
    },
  },
});
export interface Props {
  dynamicComponent: any;
  definitions: EventDefinition[];
}
