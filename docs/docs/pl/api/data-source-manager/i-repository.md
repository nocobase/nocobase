:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# IRepository

Interfejs `Repository` definiuje zestaw metod operacji na modelach, które służą do adaptacji operacji CRUD (tworzenie, odczytywanie, aktualizowanie, usuwanie) dla źródła danych.

## API

### find()

Zwraca listę modeli, które spełniają określone parametry zapytania.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Zwraca model, który spełnia określone parametry zapytania. Jeśli istnieje wiele pasujących modeli, zwracany jest tylko pierwszy z nich.

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

Zwraca liczbę modeli, które spełniają określone parametry zapytania.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Zwraca listę oraz liczbę modeli, które spełniają określone parametry zapytania.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Tworzy obiekt danych modelu.

#### Signature

- `create(options: any): void`

### update()

Aktualizuje obiekt danych modelu na podstawie określonych warunków zapytania.

#### Signature

- `update(options: any): void`

### destroy()

Usuwa obiekt danych modelu na podstawie określonych warunków zapytania.

#### Signature

- `destroy(options: any): void`