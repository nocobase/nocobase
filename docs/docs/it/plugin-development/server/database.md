:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Database

`Database` è un componente fondamentale delle `fonte dati` di tipo database. Ogni `fonte dati` di tipo database possiede un'istanza `Database` corrispondente, accessibile tramite `dataSource.db`. L'istanza `Database` della `fonte dati` principale offre anche l'alias `app.db` per comodità. Familiarizzare con i metodi comuni di `db` è fondamentale per scrivere i `plugin` lato server.

## Componenti del Database

Un `Database` tipico è composto dalle seguenti parti:

- **Collection** (collezione): Definisce la struttura delle tabelle di dati.
- **Model**: Corrisponde ai modelli ORM (solitamente gestiti da Sequelize).
- **Repository**: Lo strato del repository che incapsula la logica di accesso ai dati, fornendo metodi operativi di livello superiore.
- **FieldType**: Tipi di campo.
- **FilterOperator**: Operatori utilizzati per il filtraggio.
- **Event**: Eventi del ciclo di vita ed eventi del database.

## Momenti di utilizzo nei plugin

### Cosa fare nella fase `beforeLoad`

In questa fase, le operazioni sul database non sono consentite. È adatta per la registrazione di classi statiche o l'ascolto di eventi.

- `db.registerFieldTypes()` — Tipi di campo personalizzati
- `db.registerModels()` — Registrare classi di modelli personalizzate
- `db.registerRepositories()` — Registrare classi di repository personalizzate
- `db.registerOperators()` — Registrare operatori di filtro personalizzati
- `db.on()` — Ascoltare eventi relativi al database

### Cosa fare nella fase `load`

In questa fase, tutte le definizioni di classi ed eventi precedenti sono già stati caricati, quindi il caricamento delle tabelle di dati non presenterà mancanze o omissioni.

- `db.defineCollection()` — Definire nuove tabelle di dati
- `db.extendCollection()` — Estendere configurazioni di tabelle di dati esistenti

Se si tratta di definire tabelle integrate per i `plugin`, è più consigliabile posizionarle nella directory `./src/server/collections`. Per maggiori dettagli, consulti [Collezioni](./collections.md).

## Operazioni sui dati

Il `Database` offre due modi principali per accedere e operare sui dati:

### Operazioni tramite Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Lo strato del Repository è solitamente utilizzato per incapsulare la logica di business, come la paginazione, il filtraggio, i controlli di autorizzazione, ecc.

### Operazioni tramite Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Lo strato del Model corrisponde direttamente alle entità ORM ed è adatto per eseguire operazioni sul database di livello inferiore.

## In quali fasi sono consentite le operazioni sul database?

### Ciclo di vita del plugin

| Fase | Operazioni sul database consentite |
|------|------------------------------------|
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Sì |
| `beforeEnable` | Sì |
| `afterEnable` | Sì |
| `beforeDisable` | Sì |
| `afterDisable` | Sì |
| `remove` | Sì |
| `handleSyncMessage` | Sì |

### Eventi dell'App

| Fase | Operazioni sul database consentite |
|------|------------------------------------|
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Sì |
| `afterStart` | Sì |
| `beforeInstall` | No |
| `afterInstall` | Sì |
| `beforeStop` | Sì |
| `afterStop` | No |
| `beforeDestroy` | Sì |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Sì |
| `afterEnablePlugin` | Sì |
| `beforeDisablePlugin` | Sì |
| `afterDisablePlugin` | Sì |
| `afterUpgrade` | Sì |

### Eventi/Hook del Database

| Fase | Operazioni sul database consentite |
|------|------------------------------------|
| `beforeSync` | No |
| `afterSync` | Sì |
| `beforeValidate` | Sì |
| `afterValidate` | Sì |
| `beforeCreate` | Sì |
| `afterCreate` | Sì |
| `beforeUpdate` | Sì |
| `afterUpdate` | Sì |
| `beforeSave` | Sì |
| `afterSave` | Sì |
| `beforeDestroy` | Sì |
| `afterDestroy` | Sì |
| `afterCreateWithAssociations` | Sì |
| `afterUpdateWithAssociations` | Sì |
| `afterSaveWithAssociations` | Sì |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |