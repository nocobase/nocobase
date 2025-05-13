import React, {  } from 'react';
import { Card, Divider } from 'antd';
import { FilterFlowManager, FilterHandler, BaseModel, useObservableModel } from '@nocobase/client';
import markdown from 'markdown-it';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器组
filterFlowManager.addFilterGroup({
  name: 'block',
  title: '区块处理',
  sort: 1,
});

// 注册Markdown渲染过滤器
filterFlowManager.addFilter({
  name: 'block:markdown',
  title: 'Markdown区块',
  description: '处理Markdown内容',
  group: 'block',
  uiSchema: {},
  handler: ((model: BaseModel, params) => {    
    // 获取参数
    const { content, height, useTemplate, templateData } = params || {};
    
    // 处理内容
    let processedContent = content || '';
    
    // 如果启用模板，处理简单的模板语法
    if (useTemplate && templateData && processedContent) {
      // 替换简单变量 {{variable}}
      Object.entries(templateData).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          processedContent = processedContent.replace(
            new RegExp(`{{\\s*${key}\\s*}}`, 'g'), 
            String(value)
          );
        }
      });
      
      // 处理列表 {{#each items}} {{this}} {{/each}}
      const eachRegex = /{{#each\s+(\w+)\s*}}([\s\S]*?){{\/each}}/g;
      processedContent = processedContent.replace(eachRegex, (match, arrayName, template) => {
        const array = templateData[arrayName];
        if (Array.isArray(array)) {
          return array.map(item => 
            template.replace(/{{this}}/g, item)
          ).join('');
        }
        return '';
      });
    }
    
    // 渲染Markdown
    const md = markdown();
    const html = md.render(processedContent);
    
    // 更新模型属性
    model.setProps({
      content: processedContent,
      html,
      height: height || 200,
      useTemplate: useTemplate || false,
      templateData: templateData || {}
    });
  }) as FilterHandler<BaseModel>,
});

// 创建过滤器流
filterFlowManager.addFlow({
  key: 'block:markdown',
  title: 'Markdown区块流程',
  steps: [
    {
      key: 'block:markdown:options',
      filterName: 'block:markdown',
      title: 'Markdown选项',
    }
  ],
});

// Markdown设置组件
interface MarkdownSettingsProps {
//   height: number;
//   useTemplate: boolean;
//   onHeightChange: (height: number) => void;
//   onTemplateChange: (enabled: boolean) => void;
}

// const MarkdownSettings: React.FC<MarkdownSettingsProps> = ({
// //   height,
// //   useTemplate,
// //   onHeightChange,
// //   onTemplateChange
// }) => {
//   return (
//     <Space>
//       <Card title="设置区块高度" size="small" style={{ minWidth: 200 }}>
//         <InputNumber 
//           value={height} 
//           onChange={value => onHeightChange(value as number)}
//           min={100}
//           max={800}
//           style={{ width: '100%' }}
//         />
//       </Card>
      
//       <Card title="使用模板" size="small" style={{ minWidth: 200 }}>
//         <Switch 
//           checked={useTemplate}
//           onChange={onTemplateChange}
//           checkedChildren="启用"
//           unCheckedChildren="禁用"
//         />
//       </Card>
//       <Card title="内容" size="small" style={{ minWidth: 200 }}>
//         {/* <Input.TextArea 
//           value={templateData}
//           onChange={e => setTemplateData(e.target.value)}
//           rows={6}
//           placeholder="输入模板数据"
//         /> */}
//       </Card>
//     </Space>
//   );
// };

const MarkdownSettings = () => {
  return <></>
}

// Markdown区块组件
const MarkdownBlock = ({ uid }: { uid: string }) => {
  const model = useObservableModel(uid);
  
  // 从模型中获取属性
  const props = model.getProps();
  
  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
        
        <MarkdownSettings />
        <Divider />
        
        <Card title="Markdown 渲染结果">
          <div 
            style={{ 
              height: props.height, 
              overflow: 'auto', 
              padding: 16,
              border: '1px solid #eee',
              borderRadius: 4
            }}
            dangerouslySetInnerHTML={{ __html: props.html }}
          />
        </Card>
    </div>
  );
};

export default function Demo() {
  return <MarkdownBlock uid="markdown-block" />;
}
