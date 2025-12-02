:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Migration

Durante lo sviluppo e gli aggiornamenti dei **plugin** NocoBase, le strutture del database o le configurazioni dei **plugin** potrebbero subire modifiche incompatibili. Per garantire aggiornamenti fluidi, NocoBase offre un meccanismo di **Migration** per gestire queste modifiche attraverso la scrittura di file di migration. Questa guida Le fornirà una comprensione sistematica dell'utilizzo e del **flusso di lavoro** di sviluppo delle Migration.

## Concetto di Migration

La Migration è uno script che viene eseguito automaticamente durante gli aggiornamenti dei **plugin**, utilizzato per risolvere i seguenti problemi:

- Adeguamenti della struttura delle tabelle di dati (aggiunta di campi, modifica dei tipi di campo, ecc.)
- Migrazione dei dati (come aggiornamenti in blocco dei valori dei campi)
- Aggiornamenti della configurazione o della logica interna dei **plugin**

I tempi di esecuzione delle Migration si dividono in tre categorie:

| Tipo        | Momento di attivazione                                      | Scenario di esecuzione |
| ----------- | --------------------------------------------------- | ------------------ |
| `beforeLoad` | Prima del caricamento di tutte le configurazioni dei **plugin**         |                    |
| `afterSync`  | Dopo la sincronizzazione delle configurazioni delle **collezioni** con il database (la struttura della **collezione** è già stata modificata) | |
| `afterLoad`  | Dopo il caricamento di tutte le configurazioni dei **plugin**          |                    |

## Creare i file di Migration

I file di Migration devono essere posizionati nella directory del **plugin** in `src/server/migrations/*.ts`. NocoBase fornisce il comando `create-migration` per generare rapidamente i file di migration.

```bash
yarn nocobase create-migration [options] <name>
```

Parametri opzionali

| Parametro      | Descrizione |
| -------------- | ----------- |
| `--pkg <pkg>`  | Specifica il nome del pacchetto del **plugin** |
| `--on [on]`    | Specifica il momento di esecuzione, opzioni: `beforeLoad`, `afterSync`, `afterLoad` |

Esempio

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Il percorso del file di migration generato è il seguente:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Contenuto iniziale del file:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Scrivere qui la logica di aggiornamento
  }
}
```

> ⚠️ `appVersion` viene utilizzato per identificare la versione a cui è destinato l'aggiornamento. Gli ambienti con versioni inferiori a quella specificata eseguiranno questa migration.

## Scrivere le Migration

Nei file di Migration, può accedere alle seguenti proprietà e API comuni tramite `this` per operare comodamente su database, **plugin** e istanze dell'applicazione:

Proprietà comuni

- **`this.app`**  
  Istanza corrente dell'applicazione NocoBase. Può essere utilizzata per accedere a servizi globali, **plugin** o configurazioni.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Istanza del servizio di database, fornisce interfacce per operare sui modelli (**collezioni**).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Istanza del **plugin** corrente, può essere utilizzata per accedere ai metodi personalizzati del **plugin**.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Istanza di Sequelize, può eseguire direttamente SQL nativo o operazioni di transazione.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface di Sequelize, comunemente utilizzata per modificare le strutture delle tabelle, come l'aggiunta di campi, l'eliminazione di tabelle, ecc.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Esempio di scrittura di una Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Utilizzare queryInterface per aggiungere un campo
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Utilizzare db per accedere ai modelli di dati
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Eseguire il metodo personalizzato del plugin
    await this.plugin.customMethod();
  }
}
```

Oltre alle proprietà comuni elencate sopra, la Migration offre anche API ricche. Per la documentazione dettagliata, consulti [Migration API](/api/server/migration).

## Attivare le Migration

L'esecuzione delle Migration viene attivata dal comando `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Durante l'aggiornamento, il sistema determinerà l'ordine di esecuzione in base al tipo di Migration e a `appVersion`.

## Testare le Migration

Nello sviluppo dei **plugin**, si consiglia di utilizzare un **Mock Server** per verificare che la migration venga eseguita correttamente, evitando di danneggiare i dati reali.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nome del plugin
      version: '0.18.0-alpha.5', // Versione prima dell'aggiornamento
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Scrivere la logica di verifica, ad esempio controllare se il campo esiste, se la migrazione dei dati è riuscita
  });
});
```

> Suggerimento: L'utilizzo di un Mock Server consente di simulare rapidamente scenari di aggiornamento e di verificare l'ordine di esecuzione delle Migration e le modifiche ai dati.

## Consigli per la pratica di sviluppo

1.  **Suddividere le Migration**  
    Cerchi di generare un file di migration per ogni aggiornamento, per mantenere l'atomicità e semplificare la risoluzione dei problemi.
2.  **Specificare il momento di esecuzione**  
    Scelga `beforeLoad`, `afterSync` o `afterLoad` in base agli oggetti dell'operazione, per evitare di dipendere da moduli non caricati.
3.  **Gestire il controllo di versione**  
    Utilizzi `appVersion` per specificare chiaramente la versione a cui si applica la migration, per evitare esecuzioni ripetute.
4.  **Copertura dei test**  
    Verifichi la migration su un Mock Server prima di eseguire l'aggiornamento in un ambiente reale.