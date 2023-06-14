import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Popover, Tooltip } from 'antd';
import { useField, observer, useFieldSchema, RecursionField } from '@formily/react';
import { EllipsisWithTooltip } from '../input';
import { FormItem, FormLayout } from '@formily/antd';
import CollectionField from '../../../collection-manager/CollectionField';
import { useCollectionManager } from '../../../collection-manager';
import { FormProvider } from '../../core';
import { ReadPretty as InputReadPretty } from '../input';
import { ReadPretty as UploadReadPretty } from '../upload/ReadPretty';
import { MarkdownReadPretty } from '../markdown/Markdown';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  if (!collectionField) {
    return null;
  }
  const schema: any = {
    name: fieldSchema.name,
    'x-collection-field': fieldSchema['x-collection-field'],
    'x-component': 'CollectionField',
    default: field.value,
    'x-component-props': {
      onChange: async (e) => {
        const data = e?.target?.value;
        if (
          ['circle', 'point', 'richText', 'polygon', 'lineString', 'attachment'].includes(collectionField.interface)
        ) {
          field.value = e;
        } else if (collectionField.interface === 'json') {
          try {
            const v = e.target ? (e.target.value.trim() !== '' ? JSON.parse(e.target.value) : null) : e;
            field.value = v;
            field.setFeedback({});
          } catch (err) {
            field.setFeedback({
              type: 'error',
              code: 'JSONSyntaxError',
              messages: [err.message],
            });
          }
        } else {
          field.value = data;
        }
        field.onInput(field.value);
      },
    },
  };
  const content = (
    <div style={{ width: '100%', height: '100%', minWidth: 300 }}>
      <FormProvider>
        <FormLayout feedbackLayout="popover">
          <RecursionField schema={schema} name={fieldSchema.name} />
        </FormLayout>
      </FormProvider>
    </div>
  );
  const ReadPrettyField = () => {
    switch (collectionField?.interface) {
      case 'richText':
        return <InputReadPretty.Html {...props} value={field.value} ellipsis />;
      case 'circle':
      case 'point':
      case 'polygon':
      case 'lineString':
        return (
          <EllipsisWithTooltip ellipsis={true}>
            {field.value?.map((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',')}
          </EllipsisWithTooltip>
        );
      case 'markdown':
        return field.value ? <MarkdownReadPretty {...props} value={field.value} ellipsis /> : null;
      case 'attachment':
      case 'm2m':
      case 'm2o':
      case 'obo':
        return <UploadReadPretty.File {...props} value={field.value} size="small" />;
      case 'json':
        return <InputReadPretty.JSON {...props} value={field.value ?? undefined} space={1} />;
      default:
        return <InputReadPretty.TextArea {...props} autop={false} value={field.value} ellipsis />;
    }
  };
  return (
    <Popover content={content} trigger="click">
      <span style={{ maxHeight: 30, display: 'block', cursor: 'pointer' }}>
        <Tooltip
          title={field.selfErrors.length > 0 ? field.selfErrors : null}
          overlayInnerStyle={{ color: 'red' }}
          color="#fff"
        >
          {!field.readPretty && !field.readonly && (
            <EditOutlined
              style={{ marginRight: '8px', lineHeight: '35px', float: 'left', color: !field.valid ? 'red' : null }}
            />
          )}
        </Tooltip>
        <ReadPrettyField />
        <FormItem {...props} wrapperStyle={{ visibility: 'hidden' }} feedbackLayout="none">
          <CollectionField value={field.value ?? null} />
        </FormItem>
      </span>
    </Popover>
  );
});
