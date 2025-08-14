/**
 * defaultShowCode: false
 * title: 变量筛选项组件
 */

import React from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, Typography } from 'antd';
import { ContextFilterItem, transformFilter } from '@nocobase/client';

const { Text, Paragraph } = Typography;

class VariableFilterModel extends FlowModel {
  onInit() {
    // 定义 collection 上下文数据
    this.context.defineProperty('collection', {
      get: () => ({
        id: 1,
        name: '张三',
        email: 'zhangsan@example.com',
        age: 28,
        active: true,
        createdAt: new Date('2023-01-01'),
        profile: {
          id: 101,
          avatar: 'avatar.jpg',
          bio: '这是个人简介',
          department: {
            id: 201,
            name: '技术部',
            code: 'TECH',
            manager: {
              id: 301,
              name: '李经理',
              email: 'manager@example.com',
              phone: '13800138000',
            },
          },
        },
        orders: [
          {
            id: 1001,
            orderNo: 'ORD001',
            amount: 99.99,
            product: {
              id: 2001,
              name: '商品A',
              category: {
                id: 3001,
                name: '电子产品',
                parentCategory: {
                  id: 4001,
                  name: '数码设备',
                  description: '各类数码设备分类',
                },
              },
            },
          },
        ],
      }),
      meta: {
        type: 'object',
        title: '用户集合',
        properties: {
          id: { type: 'number', title: 'ID' },
          name: { type: 'string', title: '姓名' },
          email: { type: 'string', title: '邮箱' },
          age: { type: 'number', title: '年龄' },
          active: { type: 'boolean', title: '激活状态' },
          createdAt: { type: 'string', title: '创建时间' },
          // 第一层关联：用户档案
          profile: {
            type: 'object',
            title: '用户档案',
            properties: {
              id: { type: 'number', title: '档案ID' },
              avatar: { type: 'string', title: '头像' },
              bio: { type: 'string', title: '个人简介' },
              // 第二层关联：部门
              department: {
                type: 'object',
                title: '所属部门',
                properties: {
                  id: { type: 'number', title: '部门ID' },
                  name: { type: 'string', title: '部门名称' },
                  code: { type: 'string', title: '部门编码' },
                  // 第三层关联：部门经理
                  manager: {
                    type: 'object',
                    title: '部门经理',
                    properties: {
                      id: { type: 'number', title: '经理ID' },
                      name: { type: 'string', title: '经理姓名' },
                      email: { type: 'string', title: '经理邮箱' },
                      phone: { type: 'string', title: '联系电话' },
                    },
                  },
                },
              },
            },
          },
          // 另一个关联示例：订单
          orders: {
            type: 'array',
            title: '订单列表',
            properties: {
              id: { type: 'number', title: '订单ID' },
              orderNo: { type: 'string', title: '订单号' },
              amount: { type: 'number', title: '订单金额' },
              // 第二层关联：商品
              product: {
                type: 'object',
                title: '商品信息',
                properties: {
                  id: { type: 'number', title: '商品ID' },
                  name: { type: 'string', title: '商品名称' },
                  // 第三层关联：商品分类
                  category: {
                    type: 'object',
                    title: '商品分类',
                    properties: {
                      id: { type: 'number', title: '分类ID' },
                      name: { type: 'string', title: '分类名称' },
                      // 第四层关联：父分类
                      parentCategory: {
                        type: 'object',
                        title: '父分类',
                        properties: {
                          id: { type: 'number', title: '父分类ID' },
                          name: { type: 'string', title: '父分类名称' },
                          description: { type: 'string', title: '分类描述' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 自定义翻译方法
    this.context.defineMethod('t', (key) => {
      const translations = {
        'Select context variable': '选择上下文变量',
        'Select operator': '选择操作符',
        'Enter value': '输入值',
        equals: '等于',
        'not equals': '不等于',
        'greater than': '大于',
        'less than': '小于',
        contains: '包含',
        'is empty': '为空',
      };
      return translations[key] || key;
    });
  }

  render() {
    const filterValue = observable({
      leftValue: '',
      operator: '',
      rightValue: '',
    });

    const self = this;

    const DemoContent = observer(() => {
      // 将单个条件转换为查询对象
      const getTransformedFilter = () => {
        try {
          // 如果没有有效的条件，返回空对象
          if (!filterValue.leftValue || !filterValue.operator) {
            return {};
          }

          // 构造FilterGroup格式
          const filterGroup = {
            logic: '$and' as const,
            items: [
              {
                leftValue: filterValue.leftValue,
                operator: filterValue.operator,
                rightValue: filterValue.rightValue,
              },
            ],
          };

          return transformFilter(filterGroup);
        } catch (error) {
          return { error: error.message };
        }
      };

      return (
        <div style={{ padding: 16 }}>
          <Card size="small" title="变量筛选项组件示例">
            <ContextFilterItem value={filterValue} model={self} />

            <div style={{ marginTop: 24 }}>
              <Text strong>当前筛选条件：</Text>
              <Paragraph>
                <pre style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(filterValue, null, 2)}
                </pre>
              </Paragraph>

              <Text strong>transformFilter 转换结果：</Text>
              <Paragraph>
                <pre style={{ backgroundColor: '#f0f9ff', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(getTransformedFilter(), null, 2)}
                </pre>
              </Paragraph>
            </div>
          </Card>
        </div>
      );
    });

    return <DemoContent />;
  }
}

class PluginVariableFilterItemDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ VariableFilterModel });

    const model = this.flowEngine.createModel({
      use: 'VariableFilterModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginVariableFilterItemDemo],
});

export default app.getRootComponent();
