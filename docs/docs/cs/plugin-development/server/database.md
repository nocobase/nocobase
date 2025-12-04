:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Databáze

`Database` je důležitou součástí zdrojů dat (`DataSource`) typu databáze. Každý zdroj dat typu databáze má odpovídající instanci `Database`, ke které lze přistupovat prostřednictvím `dataSource.db`. Instance databáze hlavního zdroje dat navíc poskytuje pohodlný alias `app.db`. Seznámení se s běžnými metodami `db` je základem pro psaní serverových pluginů.

## Součásti databáze

Typická `Database` se skládá z následujících částí:

-   **kolekce**: Definuje strukturu datové tabulky.
-   **Model**: Odpovídá ORM modelům (obvykle spravovaným Sequelize).
-   **Repository**: Vrstva repozitáře, která zapouzdřuje logiku přístupu k datům a poskytuje metody pro operace na vyšší úrovni.
-   **FieldType**: Typy polí.
-   **FilterOperator**: Operátory používané pro filtrování.
-   **Event**: Události životního cyklu a databázové události.

## Kdy používat v pluginech

### Co je vhodné dělat ve fázi beforeLoad

V této fázi nejsou povoleny databázové operace. Je vhodná pro registraci statických tříd nebo naslouchání událostem.

-   `db.registerFieldTypes()` — Vlastní typy polí
-   `db.registerModels()` — Registrace vlastních tříd modelů
-   `db.registerRepositories()` — Registrace vlastních tříd repozitářů
-   `db.registerOperators()` — Registrace vlastních operátorů pro filtrování
-   `db.on()` — Naslouchání událostem souvisejícím s databází

### Co je vhodné dělat ve fázi load

V této fázi jsou již načteny všechny předchozí definice tříd a události, takže načítání datových tabulek nebude mít chybějící nebo opomenuté závislosti.

-   `db.defineCollection()` — Definování nových datových tabulek
-   `db.extendCollection()` — Rozšíření stávajících konfigurací datových tabulek

Pokud jde o definování vestavěných tabulek pluginu, doporučuje se je umístit do adresáře `./src/server/collections`. Více informací naleznete v [Kolekcích](./collections.md).

## Datové operace

`Database` poskytuje dva hlavní způsoby přístupu a manipulace s daty:

### Operace prostřednictvím Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Vrstva Repository se obvykle používá k zapouzdření obchodní logiky, jako je stránkování, filtrování, kontroly oprávnění atd.

### Operace prostřednictvím Modelu

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Vrstva Model přímo odpovídá ORM entitám a je vhodná pro provádění databázových operací na nižší úrovni.

## Ve kterých fázích jsou povoleny databázové operace?

### Životní cyklus pluginu

| Fáze                | Povoleny databázové operace |
| -------------------- | --------------------------- |
| `staticImport`       | Ne                          |
| `afterAdd`           | Ne                          |
| `beforeLoad`         | Ne                          |
| `load`                | Ne                          |
| `install`             | Ano                         |
| `beforeEnable`        | Ano                         |
| `afterEnable`         | Ano                         |
| `beforeDisable`       | Ano                         |
| `afterDisable`        | Ano                         |
| `remove`              | Ano                         |
| `handleSyncMessage`   | Ano                         |

### Události aplikace

| Fáze                | Povoleny databázové operace |
| -------------------- | --------------------------- |
| `beforeLoad`         | Ne                          |
| `afterLoad`           | Ne                          |
| `beforeStart`         | Ano                         |
| `afterStart`          | Ano                         |
| `beforeInstall`       | Ne                          |
| `afterInstall`        | Ano                         |
| `beforeStop`          | Ano                         |
| `afterStop`           | Ne                          |
| `beforeDestroy`       | Ano                         |
| `afterDestroy`        | Ne                          |
| `beforeLoadPlugin`    | Ne                          |
| `afterLoadPlugin`     | Ne                          |
| `beforeEnablePlugin`  | Ano                         |
| `afterEnablePlugin`   | Ano                         |
| `beforeDisablePlugin` | Ano                         |
| `afterDisablePlugin`  | Ano                         |
| `afterUpgrade`        | Ano                         |

### Události/háčky databáze

| Fáze                         | Povoleny databázové operace |
| ------------------------------ | --------------------------- |
| `beforeSync`                   | Ne                          |
| `afterSync`                    | Ano                         |
| `beforeValidate`               | Ano                         |
| `afterValidate`                | Ano                         |
| `beforeCreate`                 | Ano                         |
| `afterCreate`                  | Ano                         |
| `beforeUpdate`                 | Ano                         |
| `afterUpdate`                  | Ano                         |
| `beforeSave`                   | Ano                         |
| `afterSave`                    | Ano                         |
| `beforeDestroy`               | Ano                         |
| `afterDestroy`                 | Ano                         |
| `afterCreateWithAssociations`  | Ano                         |
| `afterUpdateWithAssociations` | Ano                         |
| `afterSaveWithAssociations`    | Ano                         |
| `beforeDefineCollection`      | Ne                          |
| `afterDefineCollection`        | Ne                          |
| `beforeRemoveCollection`       | Ne                          |
| `afterRemoveCollection`        | Ne                          |