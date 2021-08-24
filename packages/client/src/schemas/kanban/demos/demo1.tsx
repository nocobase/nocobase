import React from 'react';
import { ISchema, SchemaRenderer } from '../../';
import { Kanban } from '..';
import { uid } from '@formily/shared';

const schema: ISchema = {
  type: 'array',
  name: 'kanban1',
  'x-component': 'Kanban',
  'x-component-props': {
    groupField: {
      name: 'type',
      enum: [
        {
          label: 'A',
          value: 'A',
          color: 'magenta',
        },
        {
          label: 'B',
          value: 'B',
          color: 'green',
        },
        {
          label: 'C',
          value: 'C',
          color: 'blue',
        },
        {
          label: 'D',
          value: 'D',
          color: 'purple',
        },
      ],
    },
  },
  default: [
    {
      id: '1',
      type: 'A',
      title: 'A1',
      content: (
        <p>
          Lorem ipsum dolor sit amet, no dolor graeco pro, te sea bonorum
          dolorum theophrastus.{' '}
        </p>
      ),
    },
    {
      id: '2',
      type: 'A',
      title: 'A2',
      content: (
        <p>
          Lorem ipsum dolor sit amet, no dolor graeco pro, te sea bonorum
          dolorum theophrastus.{' '}
        </p>
      ),
    },
    {
      id: '3',
      type: 'A',
      title: 'A3',
    },
    {
      id: '4',
      type: 'B',
      title: 'B4',
      content: (
        <p>
          Lorem ipsum dolor sit amet, no dolor graeco pro, te sea bonorum
          dolorum theophrastus. Vim ea utamur appetere molestiae, ad harum
          alienum indoctum ius. No quo laoreet laboramus comprehensam, eos paulo
          integre vivendo eu, an nam alia facilisi consetetur. Pro exerci iisque
          et, no amet magna iracundia vim. Vis erant consectetuer te, mei
          menandri liberavisse at, no latine consulatu deseruisse eos. Mel an
          novum nostrud scripserit, velit virtute delicata eam ad, eum ne etiam
          omnesque.
        </p>
      ),
    },
    {
      id: '5',
      type: 'B',
      title: 'B5',
      content: (
        <p>
          Lorem ipsum dolor sit amet, no dolor graeco pro, te sea bonorum
          dolorum theophrastus. Vim ea utamur appetere molestiae, ad harum
          alienum indoctum ius. No quo laoreet laboramus comprehensam, eos paulo
          integre vivendo eu, an nam alia facilisi consetetur. Pro exerci iisque
          et, no amet magna iracundia vim. Vis erant consectetuer te, mei
          menandri liberavisse at, no latine consulatu deseruisse eos. Mel an
          novum nostrud scripserit, velit virtute delicata eam ad, eum ne etiam
          omnesque.
        </p>
      ),
    },
    {
      id: '6',
      type: 'B',
      title: 'B6',
    },
    {
      id: '7',
      type: 'C',
      title: 'C7',
      content: (
        <p>
          Lorem ipsum dolor sit amet, no dolor graeco pro, te sea bonorum
          dolorum theophrastus.{' '}
        </p>
      ),
    },
    {
      id: '8',
      type: 'C',
      title: 'C8',
    },
    {
      id: '9',
      type: 'C',
      title: 'C9',
    },
  ],
  properties: {
    create: {
      type: 'void',
      title: '新增卡片',
      // 'x-designable-bar': 'Kanban.AddCardDesignableBar',
      'x-component': 'Kanban.Card.AddNew',
      // 'x-decorator': 'AddNew.Displayed',
      'x-component-props': {
        type: 'text',
        icon: 'PlusOutlined',
      },
      properties: {
        modal: {
          type: 'void',
          title: '新增数据',
          'x-decorator': 'Form',
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Kanban.useCreateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
    card1: {
      type: 'void',
      name: uid(),
      'x-decorator': 'Form',
      'x-component': 'Kanban.Card',
      'x-designable-bar': 'Kanban.Card.DesignableBar',
      'x-read-pretty': true,
      'x-decorator-props': {
        useResource: '{{ Kanban.useSingleResource }}',
      },
      properties: {
        // [uid()]: {
        //   type: 'void',
        //   'x-decorator': 'BlockItem',
        //   'x-decorator-props': {
        //     draggable: false,
        //   },
        //   'x-component': 'Grid',
        //   'x-designable-bar': 'Kanban.Card.DesignableBar',
        //   // 'x-component-props': {
        //   //   addNewComponent: 'AddNew.FormItem',
        //   // },
        // },
      },
    },
    view1: {
      type: 'void',
      title: '修改数据',
      'x-decorator': 'Form',
      'x-component': 'Kanban.Card.View',
      'x-component-props': {
        useOkAction: '{{ Kanban.useUpdateAction }}',
      },
      'x-decorator-props': {
        useResource: '{{ Kanban.useSingleResource }}',
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Grid',
          'x-component-props': {
            addNewComponent: 'AddNew.FormItem',
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer scope={{ Kanban }} components={{ Kanban }} schema={schema} />;
};
