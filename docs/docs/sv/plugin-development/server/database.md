:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Databas

`Database` är en viktig komponent i datakällor av databastyp (`DataSource`). Varje datakälla av databastyp har en motsvarande `Database`-instans, som ni kan komma åt via `dataSource.db`. Huvuddatakällans databasinstans erbjuder även det praktiska aliaset `app.db`. Att känna till `db`:s vanliga metoder är grundläggande för att skriva server-sidiga `plugin`.

## Databasens komponenter

En typisk `Database` består av följande delar:

- **Collection** (samling): Definierar datatabellstrukturen.
- **Model**: Motsvarar ORM-modeller (hanteras vanligtvis av Sequelize).
- **Repository**: Ett lager som kapslar in logik för dataåtkomst och tillhandahåller mer avancerade operationsmetoder.
- **FieldType**: Fälttyper.
- **FilterOperator**: Operatorer som används för filtrering.
- **Event**: Livscykelhändelser och databashändelser.

## Användningstidpunkter för plugin

### Vad som är lämpligt att göra i beforeLoad-fasen

I detta skede är databasoperationer inte tillåtna. Det är lämpligt för registrering av statiska klasser eller händelselyssning.

- `db.registerFieldTypes()` — Anpassade fälttyper
- `db.registerModels()` — Registrera anpassade modellklasser
- `db.registerRepositories()` — Registrera anpassade repository-klasser
- `db.registerOperators()` — Registrera anpassade filteroperatorer
- `db.on()` — Lyssna på databasrelaterade händelser

### Vad som är lämpligt att göra i load-fasen

I detta skede har alla föregående klassdefinitioner och händelser laddats, så när ni laddar datatabeller kommer det inte att finnas några saknade eller utelämnade beroenden.

- `db.defineCollection()` — Definiera nya datatabeller
- `db.extendCollection()` — Utöka befintliga datatabellkonfigurationer

Om det gäller att definiera `plugin`:s inbyggda tabeller, rekommenderas det att placera dem i katalogen `./src/server/collections`. Se [Samlingar](./collections.md).

## Dataoperationer

`Database` erbjuder två huvudsakliga sätt att komma åt och hantera data:

### Operationer via Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Repository-lagret används vanligtvis för att kapsla in affärslogik, såsom paginering, filtrering, behörighetskontroller med mera.

### Operationer via Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Model-lagret motsvarar direkt ORM-entiteter och är lämpligt för att utföra databasoperationer på en lägre nivå.

## Vilka faser tillåter databasoperationer?

### Plugin-livscykel

| Fas                 | Databasoperationer tillåtna |
| ------------------- | --------------------------- |
| `staticImport`      | Nej                         |
| `afterAdd`          | Nej                         |
| `beforeLoad`        | Nej                         |
| `load`              | Nej                         |
| `install`           | Ja                          |
| `beforeEnable`      | Ja                          |
| `afterEnable`       | Ja                          |
| `beforeDisable`     | Ja                          |
| `afterDisable`      | Ja                          |
| `remove`            | Ja                          |
| `handleSyncMessage` | Ja                          |

### App-händelser

| Fas                 | Databasoperationer tillåtna |
| ------------------- | --------------------------- |
| `beforeLoad`        | Nej                         |
| `afterLoad`         | Nej                         |
| `beforeStart`       | Ja                          |
| `afterStart`        | Ja                          |
| `beforeInstall`     | Nej                         |
| `afterInstall`      | Ja                          |
| `beforeStop`        | Ja                          |
| `afterStop`         | Nej                         |
| `beforeDestroy`     | Ja                          |
| `afterDestroy`      | Nej                         |
| `beforeLoadPlugin`  | Nej                         |
| `afterLoadPlugin`   | Nej                         |
| `beforeEnablePlugin`| Ja                          |
| `afterEnablePlugin` | Ja                          |
| `beforeDisablePlugin`| Ja                          |
| `afterDisablePlugin`| Ja                          |
| `afterUpgrade`      | Ja                          |

### Databashändelser/Hooks

| Fas                           | Databasoperationer tillåtna |
| ----------------------------- | --------------------------- |
| `beforeSync`                  | Nej                         |
| `afterSync`                   | Ja                          |
| `beforeValidate`              | Ja                          |
| `afterValidate`               | Ja                          |
| `beforeCreate`                | Ja                          |
| `afterCreate`                 | Ja                          |
| `beforeUpdate`                | Ja                          |
| `afterUpdate`                 | Ja                          |
| `beforeSave`                  | Ja                          |
| `afterSave`                   | Ja                          |
| `beforeDestroy`               | Ja                          |
| `afterDestroy`                | Ja                          |
| `afterCreateWithAssociations` | Ja                          |
| `afterUpdateWithAssociations` | Ja                          |
| `afterSaveWithAssociations`   | Ja                          |
| `beforeDefineCollection`      | Nej                         |
| `afterDefineCollection`       | Nej                         |
| `beforeRemoveCollection`      | Nej                         |
| `afterRemoveCollection`       | Nej                         |