---
nav:
  path: /client
group:
  path: /schema-components
---

# RecordPicker

```tsx | pure
<CollectionProvider>
  <AsyncRecordProvider action={'get'}>
    <Form>
      <CollectionFieldProvider>
        <div>选择</div>
        <Drawer>
          <Table/>
          <Button>XX</Button>
        </Drawer>
      <CollectionFieldProvider>
    </Form>
  </AsyncRecordProvider>
</CollectionProvider>

<RecordPicker>
  <RecordPicker.Options>
  </RecordPicker.Options>
  <RecordPicker.OptionTag>
  </RecordPicker.OptionTag>
</RecordPicker>
```
