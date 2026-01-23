:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# IRepository

`Repository` arayüzü, veri kaynağının CRUD işlemlerini uyarlamak için bir dizi model işlem metodu tanımlar.

## API

### find()

Sorgu parametrelerine uyan modellerin bir listesini döndürür.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Sorgu parametrelerine uyan bir model döndürür. Birden fazla eşleşen model varsa, yalnızca ilkini döndürür.

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

Sorgu parametrelerine uyan modellerin sayısını döndürür.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Sorgu parametrelerine uyan modellerin listesini ve sayısını döndürür.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Bir model veri nesnesi oluşturur.

#### Signature

- `create(options: any): void`

### update()

Sorgu koşullarına göre bir model veri nesnesini günceller.

#### Signature

- `update(options: any): void`

### destroy()

Sorgu koşullarına göre bir model veri nesnesini siler.

#### Signature

- `destroy(options: any): void`