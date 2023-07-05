import { useFieldSchema } from '@formily/react';
import { forEach } from '@nocobase/utils/client';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock } from '../../../block-provider';
import { useFormFieldsNames } from '../../../block-provider/hooks';
import { useCollectionManager } from '../../../collection-manager';
import { useDuplicatefieldsContext } from '../../../schema-initializer/components';
export interface ITemplate {
  config?: {
    [key: string]: {
      /** 设置的数据范围 */
      filter?: any;
      /** 设置的标题字段 */
      titleField?: string;
    };
  };
  items: {
    key: string;
    title: string;
    collection: string;
    dataId: number;
    fields: string[];
    default?: boolean;
  }[];
  /** 是否在 Form 区块显示模板选择器 */
  display: boolean;
}

const useDataTemplates = () => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const data = useDuplicatefieldsContext();
  const { getCollectionJoinField } = useCollectionManager();
  if (data) {
    return data;
  }
  const { items = [], display = true } = findDataTemplates(fieldSchema);
  // 过滤掉已经被删除的字段
  items.forEach((item) => {
    try {
      item.fields = item.fields
        ?.map((field) => {
          const joinField = getCollectionJoinField(`${item.collection}.${field}`);
          if (joinField) {
            return field;
          }
          return '';
        })
        .filter(Boolean);
    } catch (err) {
      console.error(err);
      item.fields = [];
    }
  });

  const templates: any = [
    {
      key: 'none',
      title: t('None'),
    },
  ].concat(items.map<any>((t, i) => ({ key: i, ...t })));

  const defaultTemplate = items.find((item) => item.default);
  return {
    templates,
    display,
    defaultTemplate,
    enabled: items.length > 0 && items.every((item) => item.dataId !== undefined),
  };
};

export const Templates = ({ style = {}, form }) => {
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const [value, setValue] = React.useState(defaultTemplate?.key || 'none');
  const api = useAPIClient();
  const { t } = useTranslation();
  const formFields = useFormFieldsNames(defaultTemplate || templates);
  const previousFormFields = useRef(null);
  const { getCollectionFields } = useCollectionManager();
  useEffect(() => {
    if (
      enabled &&
      formFields &&
      (previousFormFields.current === null || !_.isEqual(formFields, previousFormFields.current))
    ) {
      previousFormFields.current = formFields;
      form.__template = true;
      getTemplateData(defaultTemplate || templates?.find((v) => v.key === value));
    }
  }, [formFields]);

  const handleChange = useCallback(
    async (value, option) => {
      setValue(value);
      if (option.key !== 'none') {
        getTemplateData(option);
      } else {
        form?.reset();
      }
    },
    [formFields],
  );

  const getTemplateData = (option) => {
    const collectionFields = getCollectionFields(option.collection);
    const combineFields = [...new Set([...formFields].concat(option.fields))];
    const targetFields = combineFields.filter((v) => {
      return collectionFields.find((k) => v?.includes(k.name));
    });
    fetchTemplateData(api, { ...option, targetFields })
      .then((data) => {
        if (form && data) {
          forEach(data, (value, key) => {
            if (value) {
              form.values[key] = value;
            }
          });
        }
        return data;
      })
      .catch((err) => {
        console.error(err);
      });
  };

  if (!enabled || !display) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', padding: '1em', ...style }}>
      <label style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: 8 }}>
        {t('Data template')}:{' '}
      </label>
      <Select
        dropdownMatchSelectWidth={false}
        options={templates}
        fieldNames={{ label: 'title', value: 'key' }}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

function findDataTemplates(fieldSchema): ITemplate {
  const formSchema = findFormBlock(fieldSchema);
  if (formSchema) {
    return _.cloneDeep(formSchema['x-data-templates']) || {};
  }
  return {} as ITemplate;
}

export async function fetchTemplateData(
  api,
  template: { collection: string; dataId: number; fields?: string[]; targetFields: string[] },
) {
  if (template.targetFields.length === 0 || !template.dataId) {
    return;
  }
  return api
    .resource(template.collection)
    .get({
      filterByTk: template.dataId,
      fields: template.targetFields,
      isTemplate: true,
    })
    .then((data) => {
      return data.data?.data;
    });
}
