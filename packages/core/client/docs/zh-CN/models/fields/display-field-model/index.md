# DisplayFieldModel

- 文本
- 数字
- 日期

```tsx | pure
// 展示标签
<DisplayField value={[{ name: 'A' }, { name: 'B' }]} labelKey="name" mode="tag" />

// 展示链接
<DisplayField value={[{ name: '官网', url: 'https://nocobase.com' }]} labelKey="name" />

// 展示纯文本
<DisplayField value="NocoBase" mode="span" />

// 对象
<DisplayField value={{ name: 'A' }} labelKey="name" mode="tag" />

// 自定义渲染
<DisplayField
  value={[{ name: 'A', url: 'https://a.com' }, { name: 'B', url: 'https://b.com' }]}
  renderItem={(item) => (
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {item.name}
    </a>
  )}
/>
```
