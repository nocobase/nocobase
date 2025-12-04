:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Database

`Database` is een belangrijk onderdeel van gegevensbronnen (`DataSource`) van het type database. Elke gegevensbron van het type database heeft een corresponderende `Database`-instantie, die u kunt benaderen via `dataSource.db`. De database-instantie van de hoofdgegevensbron biedt ook het handige alias `app.db`. Het is essentieel om bekend te zijn met de veelgebruikte methoden van `db` voor het schrijven van server-side plugins.

## Database-onderdelen

Een typische `Database` bestaat uit de volgende onderdelen:

- **Collectie**: Definieert de structuur van datatabellen.
- **Model**: Komt overeen met ORM-modellen (meestal beheerd door Sequelize).
- **Repository**: De repositorylaag die de logica voor gegevenstoegang inkapselt en methoden voor geavanceerdere bewerkingen biedt.
- **FieldType**: Veldtypen.
- **FilterOperator**: Operatoren die worden gebruikt voor filtering.
- **Event**: Levenscyclusgebeurtenissen en databasegebeurtenissen.

## Wanneer te gebruiken in plugins

### Wat te doen in de `beforeLoad`-fase

In deze fase zijn databasebewerkingen niet toegestaan. Deze fase is geschikt voor het registreren van statische klassen of het luisteren naar gebeurtenissen.

- `db.registerFieldTypes()` — Aangepaste veldtypen
- `db.registerModels()` — Aangepaste modelklassen registreren
- `db.registerRepositories()` — Aangepaste repositoryklassen registreren
- `db.registerOperators()` — Aangepaste filteroperatoren registreren
- `db.on()` — Luisteren naar databasegerelateerde gebeurtenissen

### Wat te doen in de `load`-fase

In deze fase zijn alle voorgaande klassedefinities en gebeurtenissen geladen, zodat het laden van datatabellen geen ontbrekende of overgeslagen afhankelijkheden zal hebben.

- `db.defineCollection()` — Nieuwe datatabellen definiëren
- `db.extendCollection()` — Bestaande datatabelconfiguraties uitbreiden

Als u ingebouwde tabellen voor een plugin definieert, is het aan te raden deze in de map `./src/server/collections` te plaatsen. Zie [Collecties](./collections.md).

## Gegevensbewerkingen

`Database` biedt twee belangrijke manieren om gegevens te benaderen en te bewerken:

### Bewerkingen via Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

De Repository-laag wordt meestal gebruikt om bedrijfslogica te encapsuleren, zoals paginering, filtering, toegangscontroles, enz.

### Bewerkingen via Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

De Model-laag komt direct overeen met ORM-entiteiten en is geschikt voor het uitvoeren van databasebewerkingen op een lager niveau.

## In welke fasen zijn databasebewerkingen toegestaan?

### Plugin-levenscyclus

| Fase                | Databasebewerkingen toegestaan |
| -------------------- | --------------------------- |
| `staticImport`       | Nee                         |
| `afterAdd`           | Nee                         |
| `beforeLoad`         | Nee                         |
| `load`                | Nee                         |
| `install`             | Ja                          |
| `beforeEnable`        | Ja                          |
| `afterEnable`         | Ja                          |
| `beforeDisable`       | Ja                          |
| `afterDisable`        | Ja                          |
| `remove`              | Ja                          |
| `handleSyncMessage`   | Ja                          |

### App-gebeurtenissen

| Fase                | Databasebewerkingen toegestaan |
| -------------------- | --------------------------- |
| `beforeLoad`         | Nee                         |
| `afterLoad`           | Nee                         |
| `beforeStart`         | Ja                          |
| `afterStart`          | Ja                          |
| `beforeInstall`       | Nee                         |
| `afterInstall`        | Ja                          |
| `beforeStop`          | Ja                          |
| `afterStop`           | Nee                         |
| `beforeDestroy`       | Ja                          |
| `afterDestroy`        | Nee                         |
| `beforeLoadPlugin`    | Nee                         |
| `afterLoadPlugin`     | Nee                         |
| `beforeEnablePlugin`  | Ja                          |
| `afterEnablePlugin`   | Ja                          |
| `beforeDisablePlugin` | Ja                          |
| `afterDisablePlugin`  | Ja                          |
| `afterUpgrade`        | Ja                          |

### Database-gebeurtenissen/hooks

| Fase                         | Databasebewerkingen toegestaan |
| ------------------------------ | --------------------------- |
| `beforeSync`                   | Nee                         |
| `afterSync`                    | Ja                          |
| `beforeValidate`               | Ja                          |
| `afterValidate`                | Ja                          |
| `beforeCreate`                 | Ja                          |
| `afterCreate`                  | Ja                          |
| `beforeUpdate`                 | Ja                          |
| `afterUpdate`                  | Ja                          |
| `beforeSave`                   | Ja                          |
| `afterSave`                    | Ja                          |
| `beforeDestroy`               | Ja                          |
| `afterDestroy`                 | Ja                          |
| `afterCreateWithAssociations`  | Ja                          |
| `afterUpdateWithAssociations` | Ja                          |
| `afterSaveWithAssociations`    | Ja                          |
| `beforeDefineCollection`      | Nee                         |
| `afterDefineCollection`        | Nee                         |
| `beforeRemoveCollection`       | Nee                         |
| `afterRemoveCollection`        | Nee                         |