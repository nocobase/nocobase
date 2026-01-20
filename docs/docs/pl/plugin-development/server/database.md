:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Baza danych

`Database` jest kluczowym elementem źródeł danych typu baza danych (`DataSource`). Każde źródło danych typu baza danych posiada odpowiadającą mu instancję `Database`, dostępną poprzez `dataSource.db`. Instancja bazy danych głównego źródła danych oferuje również wygodny alias `app.db`. Zapoznanie się z typowymi metodami `db` jest podstawą do pisania wtyczek po stronie serwera.

## Komponenty bazy danych

Typowa `Database` składa się z następujących części:

- **Collection**: Definiuje strukturę tabeli danych.
- **Model**: Odpowiada modelom ORM (zazwyczaj zarządzanym przez Sequelize).
- **Repository**: Warstwa repozytorium, która hermetyzuje logikę dostępu do danych, oferując metody operacji na wyższym poziomie.
- **FieldType**: Typy pól.
- **FilterOperator**: Operatory używane do filtrowania.
- **Event**: Zdarzenia cyklu życia i zdarzenia bazy danych.

## Kiedy używać wtyczek

### Co warto robić na etapie `beforeLoad`

Na tym etapie operacje na bazie danych nie są dozwolone. Jest on odpowiedni do rejestracji klas statycznych lub nasłuchiwania zdarzeń.

- `db.registerFieldTypes()` — Rejestracja niestandardowych typów pól
- `db.registerModels()` — Rejestracja niestandardowych klas modeli
- `db.registerRepositories()` — Rejestracja niestandardowych klas repozytoriów
- `db.registerOperators()` — Rejestracja niestandardowych operatorów filtrowania
- `db.on()` — Nasłuchiwanie zdarzeń związanych z bazą danych

### Co warto robić na etapie `load`

Na tym etapie wszystkie wcześniejsze definicje klas i zdarzenia zostały już załadowane, więc ładowanie tabel danych nie spowoduje braków ani pominięć.

- `db.defineCollection()` — Definiowanie nowych kolekcji
- `db.extendCollection()` — Rozszerzanie istniejących konfiguracji kolekcji

Jeśli definiują Państwo wbudowane tabele dla wtyczki, zaleca się umieszczenie ich w katalogu `./src/server/collections`. Więcej szczegółów znajdą Państwo w [Kolekcje](./collections.md).

## Operacje na danych

`Database` oferuje dwa główne sposoby dostępu i operacji na danych:

### Operacje poprzez `Repository`

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Warstwa repozytorium jest zazwyczaj używana do hermetyzacji logiki biznesowej, takiej jak stronicowanie, filtrowanie, sprawdzanie uprawnień itp.

### Operacje poprzez `Model`

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Warstwa Modelu bezpośrednio odpowiada encjom ORM i jest odpowiednia do wykonywania operacji na bazie danych na niższym poziomie.

## Na których etapach dozwolone są operacje na bazie danych?

### Cykl życia wtyczki

| Etap | Dozwolone operacje na bazie danych |
|------|------------------------------------|
| `staticImport` | Nie |
| `afterAdd` | Nie |
| `beforeLoad` | Nie |
| `load` | Nie |
| `install` | Tak |
| `beforeEnable` | Tak |
| `afterEnable` | Tak |
| `beforeDisable` | Tak |
| `afterDisable` | Tak |
| `remove` | Tak |
| `handleSyncMessage` | Tak |

### Zdarzenia aplikacji

| Etap | Dozwolone operacje na bazie danych |
|------|------------------------------------|
| `beforeLoad` | Nie |
| `afterLoad` | Nie |
| `beforeStart` | Tak |
| `afterStart` | Tak |
| `beforeInstall` | Nie |
| `afterInstall` | Tak |
| `beforeStop` | Tak |
| `afterStop` | Nie |
| `beforeDestroy` | Tak |
| `afterDestroy` | Nie |
| `beforeLoadPlugin` | Nie |
| `afterLoadPlugin` | Nie |
| `beforeEnablePlugin` | Tak |
| `afterEnablePlugin` | Tak |
| `beforeDisablePlugin` | Tak |
| `afterDisablePlugin` | Tak |
| `afterUpgrade` | Tak |

### Zdarzenia/haki bazy danych

| Etap | Dozwolone operacje na bazie danych |
|------|------------------------------------|
| `beforeSync` | Nie |
| `afterSync` | Tak |
| `beforeValidate` | Tak |
| `afterValidate` | Tak |
| `beforeCreate` | Tak |
| `afterCreate` | Tak |
| `beforeUpdate` | Tak |
| `afterUpdate` | Tak |
| `beforeSave` | Tak |
| `afterSave` | Tak |
| `beforeDestroy` | Tak |
| `afterDestroy` | Tak |
| `afterCreateWithAssociations` | Tak |
| `afterUpdateWithAssociations` | Tak |
| `afterSaveWithAssociations` | Tak |
| `beforeDefineCollection` | Nie |
| `afterDefineCollection` | Nie |
| `beforeRemoveCollection` | Nie |
| `afterRemoveCollection` | Nie |