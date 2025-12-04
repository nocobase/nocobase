:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ICollection

`ICollection`, veri modelinin arayüzüdür ve modelin adı, alanları ve ilişkileri gibi bilgileri içerir.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## Üyeler

### repository

`ICollection`'ın ait olduğu `Repository` örneği.

## API

### updateOptions()

`Koleksiyon`un özelliklerini günceller.

#### İmza

- `updateOptions(options: any): void`

### setField()

`Koleksiyon` için bir alan ayarlar.

#### İmza

- `setField(name: string, options: any): IField`

### removeField()

`Koleksiyon`dan bir alanı kaldırır.

#### İmza

- `removeField(name: string): void`

### getFields()

`Koleksiyon`un tüm alanlarını alır.

#### İmza

- `getFields(): Array<IField>`

### getField()

`Koleksiyon`un bir alanını adına göre alır.

#### İmza

- `getField(name: string): IField`