:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Traitement en boucle

Le traitement en boucle permet de rendre des données de manière répétée à partir de tableaux ou d'objets. Pour cela, vous définissez des marqueurs de début et de fin de boucle afin d'identifier le contenu à répéter. Nous allons explorer ci-dessous plusieurs scénarios courants.

### Itérer sur les tableaux

#### 1. Description de la syntaxe

- Utilisez la balise `{d.array[i].propriété}` pour définir l'élément de boucle actuel, et `{d.array[i+1].propriété}` pour spécifier l'élément suivant, marquant ainsi la zone de la boucle.
- Pendant l'exécution de la boucle, la première ligne (la partie `[i]`) est automatiquement utilisée comme modèle pour la répétition. Il vous suffit donc d'écrire l'exemple de boucle une seule fois dans le modèle.

Format de la syntaxe d'exemple :
```
{d.nomDuTableau[i].propriété}
{d.nomDuTableau[i+1].propriété}
```

#### 2. Exemple : Boucle simple sur un tableau

##### Données
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Modèle
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Résultat
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Exemple : Boucle sur un tableau imbriqué

Ceci est utile lorsque vous avez des tableaux imbriqués les uns dans les autres, et ce, à un nombre illimité de niveaux.

##### Données
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Modèle
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Résultat
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Exemple : Boucle bidirectionnelle (Fonctionnalité avancée, v4.8.0+)

Les boucles bidirectionnelles permettent d'itérer simultanément sur les lignes et les colonnes. Elles sont idéales pour générer des tableaux comparatifs et d'autres mises en page complexes (note : actuellement, certains formats sont officiellement pris en charge uniquement dans les modèles DOCX, HTML et MD).

##### Données
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Modèle
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Résultat
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Exemple : Accéder aux valeurs de l'itérateur de boucle (v4.0.0+)

Dans une boucle, vous pouvez accéder directement à l'index de l'itération actuelle, ce qui est utile pour répondre à des besoins de formatage spécifiques.

##### Exemple de modèle
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Note : Le nombre de points indique le niveau d'index (par exemple, `.i` représente le niveau actuel, tandis que `..i` représente le niveau précédent). Il existe actuellement un problème d'ordre inverse ; veuillez consulter la documentation officielle pour plus de détails.

### Itérer sur les objets

#### 1. Description de la syntaxe

- Pour les propriétés d'un objet, vous pouvez utiliser `.att` pour obtenir le nom de la propriété et `.val` pour obtenir sa valeur.
- Lors de l'itération, chaque élément de propriété est parcouru un par un.

Format de la syntaxe d'exemple :
```
{d.nomDeLObjet[i].att}  // nom de la propriété
{d.nomDeLObjet[i].val}  // valeur de la propriété
```

#### 2. Exemple : Itération sur les propriétés d'un objet

##### Données
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Modèle
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Résultat
```
People namePeople age
paul10
jack20
bob30
```

### Traitement du tri

En utilisant la fonction de tri, vous pouvez directement trier les données d'un tableau au sein du modèle.

#### 1. Description de la syntaxe : Tri par ordre croissant

- Utilisez un attribut comme critère de tri dans la balise de boucle. Le format de la syntaxe est le suivant :
  ```
  {d.array[attributDeTri, i].propriété}
  {d.array[attributDeTri+1, i+1].propriété}
  ```
- Si vous avez besoin de plusieurs critères de tri, séparez les attributs par des virgules à l'intérieur des crochets.

#### 2. Exemple : Tri par attribut numérique

##### Données
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Modèle
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Résultat
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Exemple : Tri multi-attributs

##### Données
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Modèle
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Résultat
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Traitement du filtrage

Le filtrage est utilisé pour exclure des lignes dans une boucle en fonction de conditions spécifiques.

#### 1. Description de la syntaxe : Filtrage numérique

- Ajoutez des conditions dans la balise de boucle (par exemple, `age > 19`). Le format de la syntaxe est le suivant :
  ```
  {d.array[i, condition].propriété}
  ```

#### 2. Exemple : Filtrage numérique

##### Données
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Modèle
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Résultat
```
People
John
Bob
```

#### 3. Description de la syntaxe : Filtrage de chaînes de caractères

- Spécifiez les conditions de chaîne de caractères en utilisant des guillemets simples. Par exemple :
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Exemple : Filtrage de chaînes de caractères

##### Données
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Modèle
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Résultat
```
People
Falcon 9
Falcon Heavy
```

#### 5. Description de la syntaxe : Filtrer les N premiers éléments

- Vous pouvez utiliser l'index de boucle `i` pour filtrer les N premiers éléments. Par exemple :
  ```
  {d.array[i, i < N].propriété}
  ```

#### 6. Exemple : Filtrer les deux premiers éléments

##### Données
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modèle
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Résultat
```
People
Falcon 9
Model S
```

#### 7. Description de la syntaxe : Exclure les N derniers éléments

- Utilisez l'indexation négative `i` pour représenter les éléments à partir de la fin. Par exemple :
  - `{d.array[i=-1].propriété}` récupère le dernier élément.
  - `{d.array[i, i!=-1].propriété}` exclut le dernier élément.

#### 8. Exemple : Exclure le dernier et les deux derniers éléments

##### Données
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modèle
```
Dernier élément : {d[i=-1].name}

Exclure le dernier élément :
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Exclure les deux derniers éléments :
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Résultat
```
Dernier élément : Falcon Heavy

Exclure le dernier élément :
Falcon 9
Model S
Model 3

Exclure les deux derniers éléments :
Falcon 9
Model S
```

#### 9. Description de la syntaxe : Filtrage intelligent

- Grâce aux blocs de conditions intelligents, vous pouvez masquer une ligne entière en fonction de conditions complexes. Voici un exemple de format :
  ```
  {d.array[i].propriété:ifIN('mot-clé'):drop(row)}
  ```

#### 10. Exemple : Filtrage intelligent

##### Données
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Modèle
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Résultat
```
People
Model S
Model 3
```
(Note : Les lignes contenant « Falcon » dans le modèle sont supprimées par la condition de filtrage intelligent.)

### Traitement de la déduplication

#### 1. Description de la syntaxe

- En utilisant un itérateur personnalisé, vous pouvez obtenir des éléments uniques (non dupliqués) basés sur la valeur d'une propriété. La syntaxe est similaire à celle d'une boucle normale, mais elle ignore automatiquement les éléments en double.

Format de l'exemple :
```
{d.array[propriété].propriété}
{d.array[propriété+1].propriété}
```

#### 2. Exemple : Sélection de données uniques

##### Données
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Modèle
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Résultat
```
Vehicles
Hyundai
Airbus
```