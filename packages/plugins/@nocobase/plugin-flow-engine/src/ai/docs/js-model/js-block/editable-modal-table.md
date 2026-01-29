---
title: "Editable Modal Table"
description: "Shared helpers used by the following snippets."
---

# Editable Modal Table

## Setup

Shared helpers used by the following snippets.

```ts
ctx.useResource('MultiRecordResource');
const collectionName = ctx.args?.collectionName || 'contacts';
ctx.resource.setResourceName(collectionName);
ctx.resource.setPageSize(10);
await ctx.resource.refresh();

const initialRows = Array.isArray(ctx.resource.getData?.()) ? ctx.resource.getData() : [];
const React = ctx.React;
const { Table, Button, Modal, Form, Input, Space, Tag } = ctx.libs.antd;

ctx.render(<EditableModalTable />);
```

## Editable Modal Table

Use this snippet to editable modal table.

```ts
const [form] = Form.useForm();
const [rows, setRows] = React.useState(initialRows);
const [editingRow, setEditingRow] = React.useState(null);
const [open, setOpen] = React.useState(false);

const startEdit = (record) => {
  setEditingRow(record);
  setOpen(true);
  form.setFieldsValue({
    name: record.name,
    title: record.title,
    email: record.email,
    tags: record.tags || [],
  });
};

const submit = async () => {
  const values = await form.validateFields();
  setRows((current) =>
    current.map((row) => (row.id === editingRow?.id ? { ...row, ...values, tags: values.tags?.split?.(',') || [] } : row)),
  );
  setOpen(false);
  setEditingRow(null);
  ctx.message?.success?.('Client-side preview updated (persist with ctx.runAction if needed)');
};

const columns = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Title', dataIndex: 'title' },
  { title: 'Email', dataIndex: 'email' },
  {
    title: 'Tags',
    dataIndex: 'tags',
    render: (tags) =>
      Array.isArray(tags) && tags.length ? (
        <Space wrap>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ) : (
        <span style={{ color: '#999' }}>None</span>
      ),
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Button type="link" onClick={() => startEdit(record)}>
        Edit
      </Button>
    ),
  },
];

return (
  <div style={{ padding: 12 }}>
    <Table columns={columns} dataSource={rows} pagination={false} rowKey="id" size="small" />
    <Modal
      open={open}
      title={editingRow ? `Edit ${editingRow.name}` : 'Edit contact'}
      onCancel={() => {
        setOpen(false);
        setEditingRow(null);
        form.resetFields();
      }}
      onOk={submit}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Contact name" />
        </Form.Item>
        <Form.Item label="Title" name="title">
          <Input placeholder="Job title" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ type: 'email', message: 'Use a valid email address' }]}
        >
          <Input placeholder="user@example.com" />
        </Form.Item>
        <Form.Item label="Tags (comma separated)" name="tags">
          <Input placeholder="VIP,Hot lead" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
);
```
