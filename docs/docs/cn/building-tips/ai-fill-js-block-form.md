---
title: '让 AI 员工填写 JS 区块中的自定义表单'
description: '通过 Ant Design Form 和少量桥接代码，让 AI 员工识别并填写 JS 区块中自行编写的复杂表单。'
keywords: 'NocoBase,AI 员工,JS 区块,Ant Design Form,填写表单,Dex,自定义表单'
---

# 让 AI 员工填写 JS 区块中的自定义表单

NocoBase 的 AI 员工可以使用“填写表单”工具，把邮件、聊天记录或文档中的信息整理后填入表单。

对于 NocoBase 原生表单区块，这项能力可以直接使用。但在一些个性化页面或复杂场景中，我们可能会在 JS 区块里自行编写表单。这类表单不属于原生表单区块，默认情况下 AI 员工无法自动识别和填写。

本文以一份 Event Planning Request 表单为例，介绍如何使用 Ant Design Form 编写一个包含分组布局、条件字段和自动摘要的 JS 区块表单，并让 AI 员工填写它。

![](https://static-docs.nocobase.com/202607160920575.png)

## 使用方式

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/ai-fill-form.mp4" type="video/mp4">
</video>

完成配置后，可以按下面的方式使用：

1. 打开 AI 员工，例如内置的 [Dex：数据整理专家](/ai-employees/built-in/dex)；
2. 点击“添加上下文”，选择“选择区块”；
3. 选中页面上的 Event Planning Request 区块；
4. 发送一段活动需求描述；
5. AI 员工提取信息，并把结果填写到表单中。

例如发送：

```text
Please fill in the event planning form:
The Developer Education team is organizing a hybrid API Design Workshop
for 80 external developers on October 12–13, 2026. The budget is USD 18,000.
Use the North Campus Learning Center and provide an online stream for remote
attendees. Recording, interpretation and catering are required. Please include
vegetarian and gluten-free meals. The request is currently in review and the
next action is to confirm the facilitator and publish the registration page.
```

## 实现思路

这个技巧包含两个部分。

第一部分是让 JS 区块中的 Ant Design Form 可以接收 AI 员工填写的字段值：

```jsx
ctx.model.form = form;
```

第二部分是给 AI 提供字段描述，让它知道：

- 有哪些字段；
- 字段使用什么名称；
- 字段值是什么类型；
- Select、Radio 和多选字段应该使用哪个选项值；
- 日期字段应该使用什么格式；
- 调用工具时应该使用哪个区块 UID。

字段描述和表单代码放在同一个 JS 区块中，修改字段时可以一起维护。

## 添加 JS 区块

![](https://static-docs.nocobase.com/202607160905767.png)

在页面中添加一个 [JS 区块](/interface-builder/blocks/other-blocks/js-block)，打开 JavaScript 编辑器，然后粘贴下面的完整代码。

### 完整示例代码

<details>
<summary>点击展开，可直接复制</summary>

```jsx
const React = ctx.libs.React;
const { useEffect, useMemo } = React;
const {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Radio,
  Space,
  Tag,
  DatePicker,
} = ctx.libs.antd;
const dayjs = ctx.libs.dayjs;

const BRAND = '#5B6CFF';

const TEAM_OPTIONS = [
  { value: 'product-design', label: 'Product Design' },
  { value: 'developer-education', label: 'Developer Education' },
  { value: 'customer-learning', label: 'Customer Learning' },
  { value: 'operations', label: 'Operations' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'community-meetup', label: 'Community Meetup' },
  { value: 'team-offsite', label: 'Team Offsite' },
];

const FORMAT_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'virtual', label: 'Virtual' },
];

const AUDIENCE_OPTIONS = [
  { value: 'employees', label: 'Employees' },
  { value: 'customers', label: 'Customers' },
  { value: 'partners', label: 'Partners' },
  { value: 'developers', label: 'Developers' },
  { value: 'public', label: 'General Public' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', readiness: 15 },
  { value: 'in-review', label: 'In Review', readiness: 45 },
  { value: 'approved', label: 'Approved', readiness: 80 },
  { value: 'scheduled', label: 'Scheduled', readiness: 100 },
  { value: 'cancelled', label: 'Cancelled', readiness: 0 },
];

const SERVICE_OPTIONS = [
  { value: 'catering', label: 'Catering' },
  { value: 'recording', label: 'Recording' },
  { value: 'interpretation', label: 'Interpretation' },
  { value: 'photography', label: 'Photography' },
  { value: 'printed-materials', label: 'Printed Materials' },
  { value: 'accessibility-support', label: 'Accessibility Support' },
];

const CANCELLATION_REASON_OPTIONS = [
  { value: 'schedule-conflict', label: 'Schedule conflict' },
  { value: 'budget-unavailable', label: 'Budget unavailable' },
  { value: 'low-registration', label: 'Low registration' },
  { value: 'venue-unavailable', label: 'Venue unavailable' },
  { value: 'scope-changed', label: 'Scope changed' },
  { value: 'other', label: 'Other' },
];

const FORM_FIELDS = [
  {
    name: 'eventTitle',
    title: 'Event Title',
    type: 'string',
    required: true,
  },
  {
    name: 'organizerTeam',
    title: 'Organizer Team',
    type: 'string',
    required: true,
    enum: TEAM_OPTIONS,
  },
  {
    name: 'eventType',
    title: 'Event Type',
    type: 'string',
    required: true,
    enum: EVENT_TYPE_OPTIONS,
  },
  {
    name: 'format',
    title: 'Event Format',
    type: 'string',
    required: true,
    enum: FORMAT_OPTIONS,
  },
  {
    name: 'audience',
    title: 'Primary Audience',
    type: 'string',
    required: true,
    enum: AUDIENCE_OPTIONS,
  },
  {
    name: 'attendeeCount',
    title: 'Expected Attendees',
    type: 'number',
    required: true,
  },
  {
    name: 'budgetUsd',
    title: 'Estimated Budget (USD)',
    type: 'number',
  },
  {
    name: 'startDate',
    title: 'Start Date',
    type: 'string',
    required: true,
    prompt: 'Use YYYY-MM-DD format.',
  },
  {
    name: 'endDate',
    title: 'End Date',
    type: 'string',
    required: true,
    prompt: 'Use YYYY-MM-DD format.',
  },
  {
    name: 'venueName',
    title: 'Venue Name',
    type: 'string',
    prompt: 'Fill this field only for On-site or Hybrid events.',
  },
  {
    name: 'streamingNotes',
    title: 'Streaming Requirements',
    type: 'string',
    prompt: 'Fill this field only for Hybrid or Virtual events.',
  },
  {
    name: 'services',
    title: 'Required Services',
    type: 'array',
    enum: SERVICE_OPTIONS,
    prompt: 'Use an array containing service option values.',
  },
  {
    name: 'dietaryNotes',
    title: 'Dietary Requirements',
    type: 'string',
    prompt: 'Fill this field when Required Services includes Catering.',
  },
  {
    name: 'status',
    title: 'Request Status',
    type: 'string',
    required: true,
    enum: STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
  },
  {
    name: 'readiness',
    title: 'Readiness (%)',
    type: 'number',
  },
  {
    name: 'cancellationReason',
    title: 'Cancellation Reason',
    type: 'string',
    enum: CANCELLATION_REASON_OPTIONS,
    prompt: 'Fill this field only when Request Status is Cancelled.',
  },
  {
    name: 'objectives',
    title: 'Event Objectives',
    type: 'string',
  },
  {
    name: 'agendaNotes',
    title: 'Agenda Notes',
    type: 'string',
  },
  {
    name: 'risks',
    title: 'Risks and Constraints',
    type: 'string',
  },
  {
    name: 'nextAction',
    title: 'Next Action',
    type: 'string',
  },
];

ctx.model.setTitle('Event Planning Request');

ctx.model.setProps({
  aiForm: {
    prompt: `This is a fillable Event Planning Request form. Use the Fill form tool when the user asks to populate it. Use the current block UID as the form target: ${ctx.model.uid}. Always use enum values instead of labels, use YYYY-MM-DD for date fields, and use an array for services.`,
    fields: FORM_FIELDS,
  },
});

const styles = {
  shell: {
    overflow: 'hidden',
    border: '1px solid #E7E8F3',
    borderRadius: 18,
    background: '#F7F8FC',
    boxShadow: '0 16px 42px rgba(31, 35, 76, 0.10)',
  },
  body: {
    padding: 24,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: 18,
  },
  summaryItem: {
    minHeight: 72,
    padding: '12px 14px',
    border: '1px solid #ECECF5',
    borderRadius: 12,
    background: '#FFFFFF',
  },
  summaryLabel: {
    marginBottom: 5,
    color: '#8A8FA8',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: '#252842',
    fontSize: 14,
    fontWeight: 700,
  },
  section: {
    marginBottom: 16,
    padding: '18px 18px 4px',
    border: '1px solid #ECECF5',
    borderRadius: 14,
    background: '#FFFFFF',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionNumber: {
    display: 'inline-flex',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    color: BRAND,
    background: '#EEF0FF',
    fontSize: 12,
    fontWeight: 800,
  },
  sectionTitle: {
    color: '#30334F',
    fontSize: 14,
    fontWeight: 750,
  },
  sectionHint: {
    marginLeft: 'auto',
    color: '#9A9EB4',
    fontSize: 11,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    columnGap: 18,
  },
  infoPanel: {
    marginBottom: 24,
    padding: '13px 14px',
    border: '1px dashed #D9DDFC',
    borderRadius: 10,
    background: '#F8F9FF',
  },
  actionBar: {
    position: 'sticky',
    bottom: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '18px -24px -24px',
    padding: '13px 24px',
    borderTop: '1px solid #E8E9F2',
    background: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(10px)',
  },
};

function Section({ number, title, hint, children }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionNumber}>{number}</span>
        <span style={styles.sectionTitle}>{title}</span>
        {hint ? <span style={styles.sectionHint}>{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={styles.summaryItem}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={styles.summaryValue}>{value || '—'}</div>
    </div>
  );
}

function DateField({ name, label, required = false }) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={
        required ? [{ required: true, message: `Please select ${label}` }] : []
      }
      getValueProps={(value) => ({
        value: value ? dayjs(String(value).slice(0, 10)) : null,
      })}
      getValueFromEvent={(value) => (value ? value.format('YYYY-MM-DD') : null)}
    >
      <DatePicker
        format="YYYY/MM/DD"
        placeholder="YYYY/MM/DD"
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}

function EventPlanningForm() {
  const [form] = Form.useForm();
  const watchedValues =
    Form.useWatch([], {
      form,
      preserve: true,
    }) || {};

  const values = {
    format: 'hybrid',
    status: 'draft',
    readiness: 15,
    services: [],
    ...watchedValues,
  };

  const teamLabel = TEAM_OPTIONS.find(
    (item) => item.value === values.organizerTeam,
  )?.label;
  const formatLabel = FORMAT_OPTIONS.find(
    (item) => item.value === values.format,
  )?.label;
  const status = STATUS_OPTIONS.find((item) => item.value === values.status);
  const hasPhysicalVenue =
    values.format === 'onsite' || values.format === 'hybrid';
  const needsStreaming =
    values.format === 'virtual' || values.format === 'hybrid';
  const needsCatering = values.services?.includes('catering');
  const isCancelled = values.status === 'cancelled';

  const dateRange = [values.startDate, values.endDate]
    .filter(Boolean)
    .join(' — ');

  const budgetLevel = useMemo(() => {
    const budget = Number(values.budgetUsd || 0);

    if (budget >= 50000) {
      return 'Large';
    }

    if (budget >= 10000) {
      return 'Medium';
    }

    return budget > 0 ? 'Small' : '';
  }, [values.budgetUsd]);

  useEffect(() => {
    const previousForm = ctx.model.form;

    // Allow the Fill form tool to write values into this form.
    ctx.model.form = form;

    return () => {
      if (ctx.model.form === form) {
        ctx.model.form = previousForm;
      }
    };
  }, [form]);

  useEffect(() => {
    if (!status) {
      return;
    }

    const currentReadiness = form.getFieldValue('readiness');

    if (currentReadiness !== status.readiness) {
      form.setFieldsValue({ readiness: status.readiness });
    }
  }, [form, status]);

  const handleFinish = (formValues) => {
    console.log('Event planning form values:', formValues);
    ctx.message.success('The form is complete and ready for submission.');
  };

  return (
    <div style={styles.shell}>
      <div style={styles.body}>
        <div style={styles.summary}>
          <SummaryItem
            label="Event"
            value={values.eventTitle || 'Untitled event'}
          />
          <SummaryItem label="Organizer" value={teamLabel} />
          <SummaryItem label="Format" value={formatLabel} />
          <SummaryItem label="Schedule" value={dateRange} />
          <SummaryItem
            label="Audience Size"
            value={
              values.attendeeCount
                ? `${values.attendeeCount} attendees`
                : undefined
            }
          />
          <SummaryItem label="Budget Level" value={budgetLevel} />
        </div>

        <Form
          form={form}
          layout="vertical"
          size="large"
          variant="filled"
          initialValues={{
            format: 'hybrid',
            status: 'draft',
            readiness: 15,
            services: [],
          }}
          onFinish={handleFinish}
        >
          <Section
            number="1"
            title="Event Overview"
            hint="Define the event and its audience"
          >
            <div style={styles.grid}>
              <Form.Item
                name="eventTitle"
                label="Event Title"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the event title',
                  },
                ]}
              >
                <Input placeholder="e.g. API Design Workshop" />
              </Form.Item>

              <Form.Item
                name="organizerTeam"
                label="Organizer Team"
                rules={[
                  {
                    required: true,
                    message: 'Please select the organizer team',
                  },
                ]}
              >
                <Select options={TEAM_OPTIONS} placeholder="Select team" />
              </Form.Item>

              <Form.Item
                name="eventType"
                label="Event Type"
                rules={[
                  {
                    required: true,
                    message: 'Please select the event type',
                  },
                ]}
              >
                <Select
                  options={EVENT_TYPE_OPTIONS}
                  placeholder="Select event type"
                />
              </Form.Item>

              <Form.Item
                name="audience"
                label="Primary Audience"
                rules={[
                  {
                    required: true,
                    message: 'Please select the primary audience',
                  },
                ]}
              >
                <Select
                  options={AUDIENCE_OPTIONS}
                  placeholder="Select audience"
                />
              </Form.Item>

              <Form.Item
                name="attendeeCount"
                label="Expected Attendees"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the expected attendee count',
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                  placeholder="e.g. 80"
                />
              </Form.Item>

              <Form.Item name="budgetUsd" label="Estimated Budget">
                <InputNumber
                  min={0}
                  precision={0}
                  addonBefore="USD"
                  style={{ width: '100%' }}
                  placeholder="e.g. 18000"
                />
              </Form.Item>
            </div>
          </Section>

          <Section
            number="2"
            title="Schedule & Format"
            hint="Set dates and delivery requirements"
          >
            <Form.Item
              name="format"
              label="Event Format"
              rules={[
                {
                  required: true,
                  message: 'Please select the event format',
                },
              ]}
            >
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={FORMAT_OPTIONS}
              />
            </Form.Item>

            <div style={styles.grid}>
              <DateField name="startDate" label="Start Date" required />
              <DateField name="endDate" label="End Date" required />

              {hasPhysicalVenue ? (
                <Form.Item
                  name="venueName"
                  label="Venue Name"
                  rules={[
                    {
                      required: true,
                      message: 'Please enter the venue name',
                    },
                  ]}
                >
                  <Input placeholder="e.g. North Campus Learning Center" />
                </Form.Item>
              ) : null}

              {needsStreaming ? (
                <Form.Item name="streamingNotes" label="Streaming Requirements">
                  <Input placeholder="Access, recording and moderation needs" />
                </Form.Item>
              ) : null}
            </div>
          </Section>

          <Section
            number="3"
            title="Services & Approval"
            hint="Capture operational support and status"
          >
            <div style={styles.grid}>
              <Form.Item name="services" label="Required Services">
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  options={SERVICE_OPTIONS}
                  placeholder="Select services"
                />
              </Form.Item>

              {needsCatering ? (
                <Form.Item name="dietaryNotes" label="Dietary Requirements">
                  <Input placeholder="Meal preferences and allergies" />
                </Form.Item>
              ) : null}

              <Form.Item
                name="status"
                label="Request Status"
                rules={[
                  {
                    required: true,
                    message: 'Please select the request status',
                  },
                ]}
              >
                <Select
                  options={STATUS_OPTIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  placeholder="Select status"
                />
              </Form.Item>

              <Form.Item name="readiness" label="Readiness (%)">
                <InputNumber
                  min={0}
                  max={100}
                  precision={0}
                  addonAfter="%"
                  style={{ width: '100%' }}
                  disabled
                />
              </Form.Item>

              {isCancelled ? (
                <Form.Item
                  name="cancellationReason"
                  label="Cancellation Reason"
                  rules={[
                    {
                      required: true,
                      message: 'Please select the cancellation reason',
                    },
                  ]}
                >
                  <Select
                    options={CANCELLATION_REASON_OPTIONS}
                    placeholder="Select reason"
                  />
                </Form.Item>
              ) : (
                <div style={styles.infoPanel}>
                  <div
                    style={{
                      marginBottom: 6,
                      color: '#8589A1',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Current Progress
                  </div>
                  <Space size={6} wrap>
                    <Tag color="geekblue">{status?.label || 'Draft'}</Tag>
                    <Tag color="blue">{values.readiness || 0}% ready</Tag>
                  </Space>
                </div>
              )}
            </div>
          </Section>

          <Section
            number="4"
            title="Planning Notes"
            hint="Keep the delivery handoff clear"
          >
            <Form.Item name="objectives" label="Event Objectives">
              <Input.TextArea
                rows={3}
                placeholder="Describe the intended outcomes"
              />
            </Form.Item>

            <Form.Item name="agendaNotes" label="Agenda Notes">
              <Input.TextArea
                rows={3}
                placeholder="Outline the sessions and timing"
              />
            </Form.Item>

            <Form.Item name="risks" label="Risks and Constraints">
              <Input.TextArea
                rows={3}
                placeholder="Record dependencies, limits and open questions"
              />
            </Form.Item>

            <Form.Item name="nextAction" label="Next Action">
              <Input.TextArea
                rows={3}
                placeholder="Describe the next action, owner and due date"
              />
            </Form.Item>
          </Section>

          <div style={styles.actionBar}>
            <span
              style={{
                marginRight: 'auto',
                color: '#8C90A7',
                fontSize: 12,
              }}
            >
              Review AI-filled values before submission.
            </span>
            <Button onClick={() => form.resetFields()}>Reset</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                minWidth: 150,
                background: BRAND,
                borderColor: BRAND,
              }}
            >
              Validate Form
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

ctx.render(<EventPlanningForm />);
```

</details>

运行代码后，页面上会显示 Event Planning Request 表单。

## 关键代码说明

### 让 AI 员工填写 Ant Design Form

最关键的是下面这段代码：

```jsx
useEffect(() => {
  const previousForm = ctx.model.form;
  ctx.model.form = form;

  return () => {
    if (ctx.model.form === form) {
      ctx.model.form = previousForm;
    }
  };
}, [form]);
```

它让 AI 员工可以通过当前 JS 区块填写这份 Ant Design Form。

清理函数用于在组件卸载或重新渲染时恢复原来的值，避免后续填写到已经关闭的表单。

### 设置“选择区块”中的名称

JS 区块在“选择区块”中默认显示为 `JS block`。可以使用 `ctx.model.setTitle()` 设置一个更容易识别的名称：

```jsx
ctx.model.setTitle('Event Planning Request');
```

设置后，用户选择上下文时会看到 `Event Planning Request`，更容易在同一页面的多个区块中找到目标表单。

建议为不同的 JS 区块设置简短且明确的名称，并将这行代码保留在完整示例中。

### 向“填写表单”工具提供表单信息

`ctx.model.form` 提供了实际接收字段值的 Form 实例，工具还需要知道当前表单包含哪些字段，以及填写这些字段时应遵循哪些规则。

示例通过 `ctx.model.setProps()` 将这些信息写入当前 JS 区块的 model：

```jsx
ctx.model.setProps({
  aiForm: {
    prompt: `This is a fillable Event Planning Request form. Use the Fill form tool when the user asks to populate it. Use the current block UID as the form target: ${ctx.model.uid}. Always use enum values instead of labels, use YYYY-MM-DD for date fields, and use an array for services.`,
    fields: FORM_FIELDS,
  },
});
```

`aiForm` 中包含两项内容：

- `prompt`：说明表单的用途、目标区块 UID，以及枚举、日期和多选字段的填写规则；
- `fields`：提供完整的字段名称、类型、必填状态和可选值，具体结构由 `FORM_FIELDS` 定义。

当用户把这个 JS 区块添加为 AI 员工的上下文时，“填写表单”工具会读取这些信息，判断应该向哪个区块填写哪些字段。

因此，两段接入代码承担不同职责，缺一不可：

```jsx
// 告诉工具如何理解这份表单
ctx.model.setProps({
  aiForm: {
    prompt: '...',
    fields: FORM_FIELDS,
  },
});

// 提供实际读写字段值的 Ant Design Form 实例
ctx.model.form = form;
```

如果字段选项来自接口，应先完成请求并生成 options，再定义 `FORM_FIELDS` 和调用 `ctx.model.setProps()`，确保工具读取到的 `enum` 与页面显示的选项一致。

### 描述复杂表单字段

`FORM_FIELDS` 是提供给 AI 的字段说明。字段名必须与 `Form.Item` 的 `name` 完全一致：

```jsx
{
  name: 'eventTitle',
  title: 'Event Title',
  type: 'string',
  required: true,
}
```

对应的表单字段是：

```jsx
<Form.Item name="eventTitle" label="Event Title">
  <Input />
</Form.Item>
```

Select、Radio 等字段应提供 enum，并且 AI 应填写 `value`，而不是显示文本：

```jsx
{
  name: 'status',
  title: 'Request Status',
  type: 'string',
  enum: [
    { value: 'draft', label: 'Draft' },
    { value: 'in-review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
  ],
}
```

例如 In Review 应填写：

```json
{
  "status": "in-review"
}
```

多选字段应使用数组：

```json
{
  "services": ["recording", "interpretation", "catering"]
}
```

### 处理日期字段

DatePicker 需要 dayjs 对象，但 AI 更适合填写 `YYYY-MM-DD` 字符串。

示例通过 `getValueProps` 和 `getValueFromEvent` 在两者之间转换：

```jsx
<Form.Item
  name="startDate"
  getValueProps={(value) => ({
    value: value ? dayjs(String(value).slice(0, 10)) : null,
  })}
  getValueFromEvent={(value) => (value ? value.format('YYYY-MM-DD') : null)}
>
  <DatePicker format="YYYY/MM/DD" />
</Form.Item>
```

这样 AI 可以填写：

```json
{
  "startDate": "2026-10-12"
}
```

页面上仍然使用标准的 Ant Design DatePicker。

### 让 AI 填写也能触发字段联动

Ant Design Form 的 `setFieldsValue()` 不会触发 `onValuesChange`。如果字段存在联动，建议通过 `Form.useWatch()` 观察字段。

示例会根据 Request Status 自动设置 Readiness：

```jsx
const status = STATUS_OPTIONS.find((item) => item.value === values.status);

useEffect(() => {
  if (!status) {
    return;
  }

  form.setFieldsValue({ readiness: status.readiness });
}, [form, status]);
```

无论 Status 来自用户选择还是 AI 填写，这段联动都会执行。

### 条件显示字段

使用 `Form.useWatch()` 得到当前值后，可以直接控制 JSX 条件渲染。

例如 On-site 或 Hybrid 活动显示 Venue Name：

```jsx
{
  values.format === 'onsite' || values.format === 'hybrid' ? (
    <Form.Item name="venueName" label="Venue Name">
      <Input />
    </Form.Item>
  ) : null;
}
```

Required Services 包含 Catering 时显示 Dietary Requirements：

```jsx
{
  values.services?.includes('catering') ? (
    <Form.Item name="dietaryNotes" label="Dietary Requirements">
      <Input />
    </Form.Item>
  ) : null;
}
```

Status 为 Cancelled 时显示 Cancellation Reason：

```jsx
{
  values.status === 'cancelled' ? (
    <Form.Item name="cancellationReason" label="Cancellation Reason">
      <Select options={CANCELLATION_REASON_OPTIONS} />
    </Form.Item>
  ) : null;
}
```

## 扩展到自己的表单

将这个例子改成自己的表单时，主要关注以下几个地方。

### 修改静态选项

```jsx
const TEAM_OPTIONS = [
  { value: 'team-a', label: 'Team A' },
  { value: 'team-b', label: 'Team B' },
];
```

确保 `FORM_FIELDS` 和页面组件复用同一份 options，避免 AI 字段描述与实际选项不一致。

### 从接口加载选项

字段选项也可以来自 NocoBase API 或其他接口。可以在定义 `FORM_FIELDS` 和渲染表单之前完成请求，再将返回记录转换成 Ant Design Select 使用的 `{ value, label }` 格式：

```jsx
const { data } = await ctx.request({
  url: 'eventCategories:list',
  method: 'get',
  params: {
    fields: ['id', 'name'],
    sort: ['name'],
    pageSize: 100,
  },
});

const categoryRecords = Array.isArray(data?.data) ? data.data : [];
const CATEGORY_OPTIONS = categoryRecords.map((record) => ({
  value: record.id,
  label: record.name,
}));

const FORM_FIELDS = [
  {
    name: 'categoryId',
    title: 'Event Category',
    type: 'number',
    enum: CATEGORY_OPTIONS,
  },
];
```

页面中的 Select 复用同一份选项：

```jsx
<Form.Item name="categoryId" label="Event Category">
  <Select options={CATEGORY_OPTIONS} />
</Form.Item>
```

`ctx.model.setProps()` 应在接口请求和 options 转换完成之后调用，确保提供给 AI 的 `enum` 与页面当前显示的选项一致。`value` 的类型也应与字段描述保持一致；例如记录 ID 为数字时使用 `type: 'number'`，不要在页面选项中将其转换为字符串。

接口请求会使用当前用户的身份和权限。跨域接口还需要目标服务允许 CORS，并根据接口要求配置认证信息。更多用法可以参考 [ctx.request](/runjs/context/request)。

### 修改字段描述

```jsx
const FORM_FIELDS = [
  {
    name: 'yourFieldName',
    title: 'Your Field Title',
    type: 'string',
  },
];
```

### 修改 Form.Item 和布局

```jsx
<Form.Item name="yourFieldName" label="Your Field Title">
  <Input />
</Form.Item>
```

可以继续使用 `Section`、`SummaryItem` 和 `styles.grid`，并根据实际页面调整卡片间距和操作栏布局。

## 适用范围与注意事项

### 一个 JS 区块对应一份表单

建议一个 JS 区块中只放一份主要表单，让 AI 员工能够明确判断需要填写的目标。

如果页面需要多份独立表单，可以分别放在不同的 JS 区块中。

### 大量选项不建议全部写入上下文

这个例子使用少量静态选项，便于直接复制和体验。实际表单也可以通过接口动态加载选项。

如果真实业务中有大量团队、场地或服务选项，不建议把接口返回的全部记录都放入字段描述。可以限制查询范围、让用户先选择关联记录，或者根据实际业务设计更合适的记录匹配方式。

## 小结

让 AI 员工填写一个包含分组和条件字段的 JS 区块表单，核心需要完成两件事：

1. 使用 Ant Design Form 管理字段，并添加表单接入代码；
2. 为 AI 员工提供字段名称、类型、枚举和格式说明。

示例同时演示了 JSX、CSS Grid、卡片分组、自动摘要和条件字段的组合方式。AI 员工可以从自然语言中提取信息并填写对应字段，用户检查后再执行后续操作。
