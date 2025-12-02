---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Script JavaScript

## Introduction

Le nœud Script JavaScript permet aux utilisateurs d'exécuter un script JavaScript personnalisé côté serveur dans un flux de travail. Le script peut utiliser des variables provenant des étapes précédentes du flux de travail comme paramètres, et sa valeur de retour peut être fournie aux nœuds suivants.

Le script s'exécute dans un thread de travail sur le serveur de l'application NocoBase et prend en charge la plupart des fonctionnalités de Node.js. Cependant, il existe quelques différences par rapport à un environnement d'exécution natif. Pour plus de détails, consultez la [Liste des fonctionnalités](#liste-des-fonctionnalités).

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « JavaScript » :

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configuration du nœud

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Paramètres

Permet de transmettre au script des variables ou des valeurs statiques issues du contexte du flux de travail, afin qu'elles puissent être utilisées dans la logique du code. `name` représente le nom du paramètre, qui devient le nom de la variable une fois transmis au script. `value` est la valeur du paramètre ; vous pouvez choisir une variable ou saisir une constante.

### Contenu du script

Le contenu du script peut être considéré comme une fonction. Vous pouvez y écrire n'importe quel code JavaScript pris en charge dans l'environnement Node.js, et utiliser l'instruction `return` pour renvoyer une valeur comme résultat de l'exécution du nœud, qui pourra être utilisée comme variable par les nœuds suivants.

Après avoir écrit le code, vous pouvez cliquer sur le bouton de test situé sous l'éditeur pour ouvrir une boîte de dialogue d'exécution de test. Vous pourrez y renseigner des valeurs statiques pour les paramètres afin d'effectuer une exécution simulée. Après l'exécution, vous verrez la valeur de retour et le contenu de la sortie (logs) dans la boîte de dialogue.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Paramètre de délai d'attente

L'unité est la milliseconde. Une valeur de `0` signifie qu'aucun délai d'attente n'est défini.

### Continuer en cas d'erreur

Si cette option est cochée, les nœuds suivants seront toujours exécutés même si le script rencontre une erreur ou un délai d'attente.

:::info{title="Note"}
Si le script échoue, il n'aura pas de valeur de retour, et le résultat du nœud sera rempli avec le message d'erreur. Si les nœuds suivants utilisent la variable de résultat du nœud de script, vous devrez la gérer avec prudence.
:::

## Liste des fonctionnalités

### Version de Node.js

Identique à la version de Node.js exécutant l'application principale.

### Prise en charge des modules

Les modules peuvent être utilisés dans le script avec des limitations, conformément à CommonJS, en utilisant la directive `require()` pour les importer.

Prend en charge les modules natifs de Node.js et les modules installés dans `node_modules` (y compris les dépendances déjà utilisées par NocoBase). Les modules à rendre disponibles pour le code doivent être déclarés dans la variable d'environnement de l'application `WORKFLOW_SCRIPT_MODULES`, avec plusieurs noms de paquets séparés par des virgules, par exemple :

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Note"}
Les modules non déclarés dans la variable d'environnement `WORKFLOW_SCRIPT_MODULES`, même s'ils sont natifs de Node.js ou déjà installés dans `node_modules`, **ne peuvent pas** être utilisés dans le script. Cette politique peut être utilisée au niveau opérationnel pour contrôler la liste des modules accessibles aux utilisateurs, évitant ainsi que les scripts n'aient des permissions excessives dans certains scénarios.
:::

Dans un environnement non déployé à partir des sources, si un module n'est pas installé dans `node_modules`, vous pouvez installer manuellement le paquet requis dans le répertoire `storage`. Par exemple, pour utiliser le paquet `exceljs`, vous pouvez effectuer les étapes suivantes :

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Ensuite, ajoutez le chemin relatif (ou absolu) du paquet, basé sur le CWD (répertoire de travail actuel) de l'application, à la variable d'environnement `WORKFLOW_SCRIPT_MODULES` :

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Vous pourrez alors utiliser le paquet `exceljs` dans votre script :

```js
const ExcelJS = require('exceljs');
// ...
```

### Variables globales

**Ne prend pas en charge** les variables globales telles que `global`, `process`, `__dirname` et `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Paramètres d'entrée

Les paramètres configurés dans le nœud deviennent des variables globales au sein du script et peuvent être utilisés directement. Les paramètres transmis au script ne prennent en charge que les types de base, tels que `boolean`, `number`, `string`, `object` et les tableaux. Un objet `Date` sera converti en chaîne de caractères au format ISO lors de son passage. D'autres types complexes, comme les instances de classes personnalisées, ne peuvent pas être transmis directement.

### Valeur de retour

L'instruction `return` peut être utilisée pour renvoyer des types de données de base (selon les mêmes règles que les paramètres) au nœud comme résultat. Si l'instruction `return` n'est pas appelée dans le code, l'exécution du nœud n'aura pas de valeur de retour.

```js
return 123;
```

### Sortie (Logs)

**Prend en charge** l'utilisation de `console` pour afficher les logs.

```js
console.log('hello world!');
```

Lors de l'exécution du flux de travail, la sortie du nœud de script est également enregistrée dans le fichier de logs du flux de travail correspondant.

### Asynchrone

**Prend en charge** l'utilisation de `async` pour définir des fonctions asynchrones et de `await` pour les appeler. **Prend en charge** l'utilisation de l'objet global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Minuteurs

Pour utiliser des méthodes comme `setTimeout`, `setInterval` ou `setImmediate`, vous devez les importer depuis le paquet `timers` de Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```