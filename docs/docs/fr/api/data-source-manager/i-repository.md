:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# IRepository

L'interface `Repository` définit une série de méthodes d'opération de modèle, conçues pour s'adapter aux opérations CRUD des sources de données.

## API

### find()

Renvoie une liste de modèles qui correspondent aux paramètres de requête.

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Renvoie un modèle qui correspond aux paramètres de requête. S'il existe plusieurs modèles correspondants, seul le premier est renvoyé.

#### Signature

- `findOne(options?: any): Promise<IModel>`

### count()

Renvoie le nombre de modèles qui correspondent aux paramètres de requête.

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Renvoie la liste et le nombre de modèles qui correspondent aux paramètres de requête.

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Crée un objet de données de modèle.

#### Signature

- `create(options: any): void`

### update()

Met à jour un objet de données de modèle en fonction des conditions de requête.

#### Signature

- `update(options: any): void`

### destroy()

Supprime un objet de données de modèle en fonction des conditions de requête.

#### Signature

- `destroy(options: any): void`