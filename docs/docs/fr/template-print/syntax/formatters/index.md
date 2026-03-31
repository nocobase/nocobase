:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Les formateurs

Les formateurs servent à transformer des données brutes en texte facile à lire. Ils s'appliquent aux données à l'aide d'un deux-points (`:`) et peuvent être chaînés, de sorte que la sortie de chaque formateur devienne l'entrée du suivant. Certains formateurs prennent en charge des paramètres constants ou dynamiques.

### Aperçu

#### 1. Explication de la syntaxe
Voici la forme d'appel de base d'un formateur :
```
{d.propriété:formateur1:formateur2(...)}
```  
Par exemple, pour convertir la chaîne de caractères `"JOHN"` en `"John"`, vous utilisez d'abord le formateur `lowerCase` pour mettre toutes les lettres en minuscules, puis `ucFirst` pour mettre la première lettre en majuscule.

#### 2. Exemple
Données :
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Modèle :
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Résultat
Après rendu, la sortie est :
```
My name is John. I was born on January 31, 2000.
```

### Paramètres constants

#### 1. Explication de la syntaxe
De nombreux formateurs prennent en charge un ou plusieurs paramètres constants, séparés par des virgules et placés entre parenthèses pour modifier la sortie. Par exemple, `:prepend(myPrefix)` ajoutera « myPrefix » devant le texte.  
**Remarque :** Si le paramètre contient des virgules ou des espaces, il doit être placé entre guillemets simples, par exemple : `prepend('my prefix')`.

#### 2. Exemple
Exemple de modèle (consultez l'utilisation spécifique du formateur pour plus de détails).

#### 3. Résultat
La sortie aura le préfixe spécifié ajouté devant le texte.

### Paramètres dynamiques

#### 1. Explication de la syntaxe
Les formateurs prennent également en charge les paramètres dynamiques. Ces paramètres commencent par un point (`.`) et ne sont pas placés entre guillemets.  
Il existe deux méthodes pour spécifier des paramètres dynamiques :
- **Chemin JSON absolu :** Commence par `d.` ou `c.` (faisant référence aux données racine ou aux données supplémentaires).
- **Chemin JSON relatif :** Commence par un seul point (`.`), indiquant que la propriété est recherchée à partir de l'objet parent actuel.

Par exemple :
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Il peut également être écrit comme un chemin relatif :
```
{d.subObject.qtyB:add(.qtyC)}
```
Si vous avez besoin d'accéder à des données d'un niveau supérieur (parent ou au-dessus), vous pouvez utiliser plusieurs points :
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Exemple
Données :
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Utilisation dans le modèle :
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Résultat : 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Résultat : 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Résultat : 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Résultat : 6 (3 + 3)
```

#### 3. Résultat
Les exemples donnent respectivement 8, 8, 28 et 6.

> **Remarque :** L'utilisation d'itérateurs personnalisés ou de filtres de tableau comme paramètres dynamiques n'est pas autorisée, par exemple :
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```