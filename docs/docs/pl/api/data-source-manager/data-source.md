:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Źródło danych (abstrakcyjne)

`Źródło danych` to abstrakcyjna klasa służąca do reprezentowania typu źródła danych, którym może być na przykład baza danych, API i tym podobne.

## Składowe

### collectionManager

Instancja CollectionManager dla źródła danych, która musi implementować interfejs [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Instancja resourceManager dla źródła danych.

### acl

Instancja ACL dla źródła danych.

## API

### constructor()

Konstruktor, tworzy instancję `Źródła danych`.

#### Sygnatura

- `constructor(options: DataSourceOptions)`

### init()

Funkcja inicjalizująca, wywoływana natychmiast po `constructor`.

#### Sygnatura

- `init(options: DataSourceOptions)`


### name

#### Sygnatura

- `get name()`

Zwraca nazwę instancji źródła danych.

### middleware()

Pobiera middleware dla źródła danych, używany do zamontowania na serwerze w celu odbierania żądań.

### testConnection()

Metoda statyczna wywoływana podczas operacji testowania połączenia. Może być używana do walidacji parametrów, a konkretna logika jest implementowana przez podklasę.

#### Sygnatura

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Sygnatura

- `async load(options: any = {})`

Operacja ładowania dla źródła danych. Logika jest implementowana przez podklasę.

### createCollectionManager()

#### Sygnatura
- `abstract createCollectionManager(options?: any): ICollectionManager`

Tworzy instancję CollectionManager dla źródła danych. Logika jest implementowana przez podklasę.

### createResourceManager()

Tworzy instancję ResourceManager dla źródła danych. Podklasy mogą nadpisać tę implementację. Domyślnie tworzy `ResourceManager` z `@nocobase/resourcer`.

### createACL()

- Tworzy instancję ACL dla źródła danych. Podklasy mogą nadpisać tę implementację. Domyślnie tworzy `ACL` z `@nocobase/acl`.