# Preview

Used for previewing uploaded files.

```ts
type UploadProps = Omit<AntdUploadProps, 'onChange'> & {
  onChange?: (fileList: UploadFile[]) => void;
  serviceErrorMessage?: string;
  value?: any;
  size?: string;
}
```

<code src="./demos/demo1.tsx"></code>
