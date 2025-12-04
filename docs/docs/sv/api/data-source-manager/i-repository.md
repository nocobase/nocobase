:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# IRepository

Gränssnittet `Repository` definierar en serie metoder för modelloperationer som anpassar sig till datakällans CRUD-operationer.

## API

### find()

Returnerar en lista med modeller som matchar sökparametrarna.

#### Signatur

- `find(options?: any): Promise<IModel[]>`

### findOne()

Returnerar en modell som matchar sökparametrarna. Om flera modeller matchar returneras endast den första.

#### Signatur

- `findOne(options?: any): Promise<IModel>`

### count()

Returnerar antalet modeller som matchar sökparametrarna.

#### Signatur

- `count(options?: any): Promise<Number>`

### findAndCount()

Returnerar listan och antalet modeller som matchar sökparametrarna.

#### Signatur

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Skapar ett modellobjekt.

#### Signatur

- `create(options: any): void`

### update()

Uppdaterar ett modellobjekt baserat på sökparametrarna.

#### Signatur

- `update(options: any): void`

### destroy()

Tar bort ett modellobjekt baserat på sökparametrarna.

#### Signatur

- `destroy(options: any): void`