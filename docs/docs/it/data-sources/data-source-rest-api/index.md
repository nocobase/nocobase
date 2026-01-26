---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Fonte Dati API REST

## Introduzione

Questo plugin Le permette di integrare facilmente dati provenienti da fonti API REST.

## Installazione

Trattandosi di un plugin commerciale, è necessario caricarlo e attivarlo tramite il gestore dei plugin.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Aggiungere una Fonte Dati API REST

Dopo aver attivato il plugin, può aggiungere una fonte dati API REST selezionandola dal menu a tendina `Add new` nella sezione di gestione delle fonti dati.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configuri la fonte dati API REST.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Aggiungere una Collezione

In NocoBase, una risorsa RESTful viene mappata a una `collezione`, come ad esempio una risorsa `Users`.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Questi endpoint API sono mappati in NocoBase come segue:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Per una guida completa sulle specifiche di progettazione delle API di NocoBase, consulti la documentazione API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consulti il capitolo "NocoBase API - Core" per informazioni dettagliate.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

La configurazione della `collezione` per una fonte dati API REST include quanto segue:

### List

Mappi l'interfaccia per visualizzare un elenco di risorse.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Mappi l'interfaccia per visualizzare i dettagli di una risorsa.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Mappi l'interfaccia per creare una risorsa.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Mappi l'interfaccia per aggiornare una risorsa.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Mappi l'interfaccia per eliminare una risorsa.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Le interfacce `List` e `Get` sono entrambe obbligatorie e devono essere configurate.

## Debugging delle API

### Integrazione dei parametri di richiesta

Esempio: Configuri i parametri di paginazione per l'API `List`. Se l'API di terze parti non supporta nativamente la paginazione, NocoBase la gestirà basandosi sui dati dell'elenco recuperato.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Tenga presente che solo le variabili aggiunte nell'interfaccia avranno effetto.

| Nome parametro API di terze parti | Parametri NocoBase          |
| --------------------------------- | --------------------------- |
| page                              | {{request.params.page}}     |
| limit                             | {{request.params.pageSize}} |

Può cliccare su `Try it out` per eseguire il debugging e visualizzare la risposta.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Trasformazione del formato di risposta

Il formato di risposta dell'API di terze parti potrebbe non essere conforme allo standard NocoBase e deve essere trasformato prima di poter essere visualizzato correttamente sul frontend.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Regoli le regole di conversione in base al formato di risposta dell'API di terze parti per assicurarsi che l'output sia conforme allo standard NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Descrizione del processo di debugging

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variabili

La fonte dati API REST supporta tre tipi di variabili per l'integrazione delle API:

- Variabili personalizzate della fonte dati
- Variabili di richiesta NocoBase
- Variabili di risposta di terze parti

### Variabili personalizzate della Fonte Dati

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Richiesta NocoBase

- `Params`: parametri di query URL (`Search Params`), che variano a seconda dell'interfaccia.
- `Headers`: intestazioni di richiesta personalizzate, che forniscono principalmente informazioni `X-` specifiche di NocoBase.
- `Body`: il corpo della richiesta.
- `Token`: il token API per la richiesta NocoBase corrente.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Risposte di Terze Parti

Attualmente, è disponibile solo il corpo della risposta.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Di seguito sono riportate le variabili disponibili per ciascuna interfaccia:

### List

| Parametro               | Descrizione                                                     |
| :---------------------- | :-------------------------------------------------------------- |
| `request.params.page`     | Pagina corrente                                                 |
| `request.params.pageSize` | Numero di elementi per pagina                                   |
| `request.params.filter`   | Criteri di filtro (devono essere conformi al formato `Filter` di NocoBase) |
| `request.params.sort`     | Criteri di ordinamento (devono essere conformi al formato `Sort` di NocoBase) |
| `request.params.appends`  | Campi da caricare su richiesta, tipicamente per i campi di associazione |
| `request.params.fields`   | Campi da includere (whitelist)                                  |
| `request.params.except`   | Campi da escludere (blacklist)                                  |

### Get

| Parametro                 | Descrizione                                                     |
| :------------------------ | :-------------------------------------------------------------- |
| `request.params.filterByTk` | Obbligatorio, tipicamente l'ID del record corrente              |
| `request.params.filter`     | Criteri di filtro (devono essere conformi al formato `Filter` di NocoBase) |
| `request.params.appends`    | Campi da caricare su richiesta, tipicamente per i campi di associazione |
| `request.params.fields`     | Campi da includere (whitelist)                                  |
| `request.params.except`     | Campi da escludere (blacklist)                                  |

### Create

| Parametro                | Descrizione                 |
| :----------------------- | :-------------------------- |
| `request.params.whiteList` | Whitelist                   |
| `request.params.blacklist` | Blacklist                   |
| `request.body`             | Dati iniziali per la creazione |

### Update

| Parametro                 | Descrizione                                                     |
| :------------------------ | :-------------------------------------------------------------- |
| `request.params.filterByTk` | Obbligatorio, tipicamente l'ID del record corrente              |
| `request.params.filter`     | Criteri di filtro (devono essere conformi al formato `Filter` di NocoBase) |
| `request.params.whiteList`  | Whitelist                                                       |
| `request.params.blacklist`  | Blacklist                                                       |
| `request.body`              | Dati per l'aggiornamento                                        |

### Destroy

| Parametro                 | Descrizione                                                     |
| :------------------------ | :-------------------------------------------------------------- |
| `request.params.filterByTk` | Obbligatorio, tipicamente l'ID del record corrente              |
| `request.params.filter`     | Criteri di filtro (devono essere conformi al formato `Filter` di NocoBase) |

## Configurazione dei Campi

I metadati dei campi (`Fields`) vengono estratti dai dati dell'interfaccia CRUD della risorsa adattata per fungere da campi della `collezione`.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Estrazione dei metadati dei campi.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Campi e anteprima.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Modifica dei campi (simile ad altre fonti dati).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Aggiungere Blocchi della Fonte Dati API REST

Una volta configurata la `collezione`, può aggiungere blocchi all'interfaccia.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)