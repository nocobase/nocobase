import Mock from 'mockjs';

export async function getOptions(req: any, res: any) {
  res.json({
    data: {
      name:  'grid1',
      'x-component': 'GridBlock',
      blocks: [
        {
          name: 'form1',
          resource: {
            resourceName: 'users',
            resourceKey: 1,
          },
          fields: [
            {
              interface: 'string',
              type: 'string',
              title: `单行文本`,
              name: 'username',
              required: true,
              component: {
                type: 'string',
                default: 'abcdefg',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: 'please enter',
                },
              },
            },
          ],
        },
      ],
    },
  });
}
