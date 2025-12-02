:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# IRepository

L'interfaccia `Repository` definisce una serie di metodi per le operazioni sui modelli, pensati per adattarsi alle operazioni CRUD (Creazione, Lettura, Aggiornamento, Eliminazione) della **fonte dati**.

## API

### find()

Restituisce un elenco di modelli che corrispondono ai parametri di query.

#### Firma

- `find(options?: any): Promise<IModel[]>`

### findOne()

Restituisce un modello che corrisponde ai parametri di query. Se ci sono più modelli corrispondenti, viene restituito solo il primo.

#### Firma

- `findOne(options?: any): Promise<IModel>`

### count()

Restituisce il numero di modelli che corrispondono ai parametri di query.

#### Firma

- `count(options?: any): Promise<Number>`

### findAndCount()

Restituisce l'elenco e il conteggio dei modelli che corrispondono ai parametri di query.

#### Firma

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Crea un oggetto dati del modello.

#### Firma

- `create(options: any): void`

### update()

Aggiorna un oggetto dati del modello in base alle condizioni di query.

#### Firma

- `update(options: any): void`

### destroy()

Elimina un oggetto dati del modello in base alle condizioni di query.

#### Firma

- `destroy(options: any): void`