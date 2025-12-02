:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# IRepository

Das `Repository`-Interface definiert eine Reihe von Methoden zur Modelloperation, die zur Anpassung der CRUD-Operationen (Create, Read, Update, Delete) einer Datenquelle dienen.

## API

### find()

Gibt eine Liste von Modellen zurück, die den Abfrageparametern entsprechen.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Gibt ein Modell zurück, das den Abfrageparametern entspricht. Falls mehrere Modelle übereinstimmen, wird nur das erste zurückgegeben.

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

Gibt die Anzahl der Modelle zurück, die den Abfrageparametern entsprechen.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Gibt die Liste und die Anzahl der Modelle zurück, die den Abfrageparametern entsprechen.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Erstellt ein Modell-Datenobjekt.

#### Signature

- `create(options: any): void`

### update()

Aktualisiert ein Modell-Datenobjekt basierend auf den Abfragebedingungen.

#### Signature

- `update(options: any): void`

### destroy()

Löscht ein Modell-Datenobjekt basierend auf den Abfragebedingungen.

#### Signature

- `destroy(options: any): void`