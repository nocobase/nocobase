# Upload

上传组件。其基于 ant-design [Upload](https://ant.design/components/upload) 组件封装。

## Basic Usage

```ts
type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  value?: any;
  size?: string;
};
```

<code src="./demos/new-demos/basic.tsx"></code>

## Multiple

<code src="./demos/new-demos/multiple.tsx"></code>

## Rules

<code src="./demos/new-demos/rules.tsx"></code>

## Read Pretty

```ts
type UploadReadPrettyProps = AntdUploadProps;
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
