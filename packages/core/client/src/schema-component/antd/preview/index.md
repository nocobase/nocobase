# Preview

用于预览上传的文件。

```ts
type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  value?: any;
  size?: string;
}
```

<code src="./demos/demo1.tsx"></code>
