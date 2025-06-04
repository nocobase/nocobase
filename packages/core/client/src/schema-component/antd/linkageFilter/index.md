# LinkageFilter

用于前端联动规则中，用作条件配置

```ts
type FilterActionProps<T = {}> = ActionProps & {
  options?: any[];
  form?: Form;
  onSubmit?: (values: T) => void;
  onReset?: (values: T) => void;
}
```

### Basic Usage
左侧支持变量,操作符、和右侧变量组件跟随左侧变量联动

<code src="./demos/new-demos/basic.tsx"></code>

