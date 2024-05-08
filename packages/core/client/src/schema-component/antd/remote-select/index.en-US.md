# RemoteSelect

请求远程数据的 Select 组件。其基于 [Select](/components/select) 组件和 [useRequest()](/core/request)。

```ts

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  onChange?: (v: any) => void;
  /**
   * useRequest() `debounceWait` parameter
   */
  wait?: number;
  /**
   * useRequest() `manual` parameter
   * @default true
   */
  manual?: boolean;
  targetField?: any;
  /**
   * useRequest() `service` parameter
   */
  service: ResourceActionOptions<P>;
  target: string;
  mapOptions?: (data: any) => SelectProps['fieldNames'];
  dataSource?: string;
  CustomDropdownRender?: (v: any) => any;
  optionFilter?: (option: any) => boolean;
};
```

## Basic usage

<code src="./demos/new-demos/basic.tsx"></code>

## Manual false

<code src="./demos/new-demos/manual.tsx"></code>

## Multiple

<code src="./demos/new-demos/multiple.tsx"></code>

## Read Pretty

```ts
interface RemoteSelectReadPrettyProps extends SelectReadPrettyProps {
  fieldNames?: SelectProps['fieldNames'];
  service: ResourceActionOptions;
}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
