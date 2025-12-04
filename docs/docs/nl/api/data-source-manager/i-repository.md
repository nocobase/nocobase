:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# IRepository

De `Repository`-interface definieert een reeks methoden voor modelbewerkingen, bedoeld om de CRUD-bewerkingen (aanmaken, lezen, bijwerken, verwijderen) van de gegevensbron aan te passen.

## API

### find()

Geeft een lijst van modellen terug die overeenkomen met de zoekparameters.

#### Signatuur

- `find(options?: any): Promise<IModel[]>`

### findOne()

Geeft een model terug dat overeenkomt met de zoekparameters. Als er meerdere overeenkomende modellen zijn, wordt alleen het eerste geretourneerd.

#### Signatuur

- `findOne(options?: any): Promise<IModel>`

### count()

Geeft het aantal modellen terug dat overeenkomt met de zoekparameters.

#### Signatuur

- `count(options?: any): Promise<Number>`

### findAndCount()

Geeft de lijst en het aantal modellen terug dat overeenkomt met de zoekparameters.

#### Signatuur

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Maakt een modeldata-object aan.

#### Signatuur

- `create(options: any): void`

### update()

Werkt een modeldata-object bij op basis van de zoekvoorwaarden.

#### Signatuur

- `update(options: any): void`

### destroy()

Verwijdert een modeldata-object op basis van de zoekvoorwaarden.

#### Signatuur

- `destroy(options: any): void`