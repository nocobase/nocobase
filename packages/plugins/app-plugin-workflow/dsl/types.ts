export interface NodeMeta<TKey extends string = string> {
  key: TKey;
  title?: string;
  description?: string;
}
