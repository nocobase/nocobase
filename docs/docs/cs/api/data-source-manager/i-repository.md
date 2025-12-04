:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# IRepository

Rozhraní `Repository` definuje sadu metod pro práci s modely, které slouží k adaptaci CRUD operací zdroje dat.

## API

### find()

Vrátí seznam modelů, které odpovídají zadaným dotazovacím parametrům.

#### Podpis

- `find(options?: any): Promise<IModel[]>`

### findOne()

Vrátí model, který odpovídá zadaným dotazovacím parametrům. Pokud existuje více odpovídajících modelů, vrátí pouze první.

#### Podpis

- `findOne(options?: any): Promise<IModel>`

### count()

Vrátí počet modelů, které odpovídají zadaným dotazovacím parametrům.

#### Podpis

- `count(options?: any): Promise<Number>`

### findAndCount()

Vrátí seznam a počet modelů, které odpovídají zadaným dotazovacím parametrům.

#### Podpis

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Vytvoří datový objekt modelu.

#### Podpis

- `create(options: any): void`

### update()

Aktualizuje datový objekt modelu na základě dotazovacích podmínek.

#### Podpis

- `update(options: any): void`

### destroy()

Smaže datový objekt modelu na základě dotazovacích podmínek.

#### Podpis

- `destroy(options: any): void`