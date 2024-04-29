# RemoteSelect

请求远程数据的 Select 组件。其基于 [Select](/components/select) 组件和 [useRequest()](/core/request)。

```ts
type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  onChange?: (v: any) => void;
  /**
   * useRequest() 的 debounceWait 参数
   */
  wait?: number;
  /**
   * useRequest() 的 manual 参数
   */
  manual?: boolean;
  targetField?: any;
  /**
   * useRequest() 的 service 参数
   */
  service: ResourceActionOptions<P>;
  target: string;
  mapOptions?: (data: any) => RemoteSelectProps['fieldNames'];
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
