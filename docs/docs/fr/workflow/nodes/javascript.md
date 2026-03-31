---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/workflow/nodes/javascript).
:::

# Script JavaScript

## Introduction

Le nœud Script JavaScript permet aux utilisateurs d'exécuter un script JavaScript personnalisé côté serveur dans un flux de travail. Le script peut utiliser des variables en amont du flux de travail comme paramètres, et sa valeur de retour peut être fournie aux nœuds en aval.

Le script s'exécute dans un thread de travail sur le serveur de l'application NocoBase. Par défaut, il utilise un bac à sable sécurisé (isolated-vm) qui ne prend pas en charge `require` ni les API natives de Node.js. Pour plus de détails, consultez [Moteur d'exécution](#moteur-dexécution) et [Liste des fonctionnalités](#liste-des-fonctionnalités).

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « JavaScript » :

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Configuration du nœud

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Paramètres

Utilisés pour transmettre des variables du contexte du flux de travail ou des valeurs statiques au script afin d'être utilisées dans la logique du code. `name` est le nom du paramètre, qui devient le nom de la variable une fois transmis au script. `value` est la valeur du paramètre, vous pouvez choisir une variable ou saisir une constante.

### Contenu du script

Le contenu du script peut être considéré comme une fonction. Vous pouvez écrire n'importe quel code JavaScript pris en charge dans l'environnement Node.js et utiliser l'instruction `return` pour renvoyer une valeur comme résultat d'exécution du nœud, afin qu'elle soit utilisée comme variable par les nœuds suivants.

Après avoir écrit le code, vous pouvez cliquer sur le bouton de test sous la zone d'édition pour ouvrir une boîte de dialogue d'exécution de test, et utiliser des valeurs statiques pour les paramètres afin d'effectuer une simulation. Après l'exécution, vous pouvez voir la valeur de retour et le contenu de la sortie (logs) dans la boîte de dialogue.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Paramètres de délai d'attente

L'unité est la milliseconde. Lorsqu'elle est définie sur `0`, cela signifie qu'aucun délai d'attente n'est configuré.

### Continuer le flux de travail après une erreur

Si cette option est cochée, les nœuds suivants seront toujours exécutés même si le script rencontre une erreur ou un délai d'attente.

:::info{title="Conseil"}
Une fois que le script échoue, il n'y aura pas de valeur de retour et le résultat du nœud sera rempli avec le message d'erreur. Si les nœuds suivants utilisent la variable de résultat du nœud de script, cela doit être manipulé avec prudence.
:::

## Moteur d'exécution

Le nœud de script JavaScript prend en charge deux moteurs d'exécution, sélectionnés automatiquement selon que la variable d'environnement `WORKFLOW_SCRIPT_MODULES` est configurée ou non :

### Mode sécurisé (par défaut)

Lorsque `WORKFLOW_SCRIPT_MODULES` **n'est pas configurée**, les scripts s'exécutent à l'aide du moteur [isolated-vm](https://github.com/laverdet/isolated-vm). Ce moteur exécute le code dans un environnement V8 isolé avec les caractéristiques suivantes :

- **Ne prend pas en charge** `require` — aucun module ne peut être importé
- **Ne prend pas en charge** les API natives de Node.js (telles que `process`, `Buffer`, `global`, etc.)
- Seuls les objets intégrés standard ECMAScript sont disponibles (tels que `JSON`, `Math`, `Promise`, `Date`, etc.)
- Prend en charge le passage de données via les paramètres, `console` pour les logs, et `async`/`await`

C'est le mode par défaut recommandé, adapté aux logiques de calcul pur et de traitement de données, offrant le niveau le plus élevé d'isolation de sécurité.

### Mode non sécurisé (prise en charge des modules)

Lorsque `WORKFLOW_SCRIPT_MODULES` **est configurée**, les scripts basculent vers le moteur `vm` natif de Node.js pour activer la fonctionnalité `require`.

:::warning{title="Avertissement de sécurité"}
En mode non sécurisé, bien que les scripts s'exécutent dans un bac à sable `vm` avec une liste blanche de modules restreinte, le module `vm` de Node.js n'est pas un mécanisme de bac à sable sécurisé. L'activation de ce mode implique de faire confiance à tous les utilisateurs ayant la permission de modifier les scripts de flux de travail. Les administrateurs doivent évaluer les risques de sécurité de manière indépendante et contrôler strictement la liste blanche des modules et les permissions de modification des flux de travail.
:::

Les modules peuvent être utilisés dans le script conformément à CommonJS, en utilisant la directive `require()` pour les importer.

Prend en charge les modules natifs de Node.js et les modules installés dans `node_modules` (y compris les paquets de dépendances déjà utilisés par NocoBase). Les modules à mettre à disposition du code doivent être déclarés dans la variable d'environnement de l'application `WORKFLOW_SCRIPT_MODULES`, les noms de paquets étant séparés par des virgules, par exemple :

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Conseil"}
Les modules non déclarés dans la variable d'environnement `WORKFLOW_SCRIPT_MODULES`, même s'ils sont natifs de Node.js ou installés dans `node_modules`, **ne peuvent pas** être utilisés dans le script. Cette stratégie peut être utilisée au niveau de l'exploitation et de la maintenance pour contrôler la liste des modules utilisables par les utilisateurs, évitant ainsi des permissions de script trop élevées dans certains scénarios.
:::

Dans un environnement qui n'est pas déployé à partir des sources, si un module n'est pas installé dans `node_modules`, vous pouvez installer manuellement le paquet nécessaire dans le répertoire `storage`. Par exemple, si vous avez besoin d'utiliser le paquet `exceljs`, vous pouvez effectuer les opérations suivantes :

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Ensuite, ajoutez le chemin relatif (ou absolu) du paquet basé sur le CWD (répertoire de travail actuel) de l'application à la variable d'environnement `WORKFLOW_SCRIPT_MODULES` :

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Vous pourrez alors utiliser le paquet `exceljs` dans le script (le nom dans `require` doit correspondre exactement à celui défini dans la variable d'environnement) :

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

## Liste des fonctionnalités

### Version de Node.js

Identique à la version de Node.js exécutant l'application principale.

### Variables globales

**Ne prend pas en charge** les variables globales telles que `global`, `process`, `__dirname` et `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Paramètres d'entrée

Les paramètres configurés dans le nœud serviront de variables globales dans le script et peuvent être utilisés directement. Les paramètres transmis au script ne prennent en charge que les types de base, tels que `boolean`, `number`, `string`, `object` et les tableaux. L'objet `Date` sera converti en une chaîne au format ISO après avoir été transmis. D'autres types complexes ne peuvent pas être transmis directement, comme les instances de classes personnalisées.

### Valeur de retour

L'instruction `return` permet de renvoyer des données de type de base (mêmes règles que pour les paramètres) au nœud en tant que résultat. Si l'instruction `return` n'est pas appelée dans le code, l'exécution du nœud n'aura pas de valeur de retour.

```js
return 123;
```

### Sortie (Logs)

**Prend en charge** l'utilisation de `console` pour sortir des logs.

```js
console.log('hello world!');
```

Lors de l'exécution du flux de travail, la sortie du nœud de script est également enregistrée dans le fichier de logs du flux de travail correspondant.

### Asynchrone

**Prend en charge** l'utilisation de `async` pour définir des fonctions asynchrones, ainsi que `await` pour appeler des fonctions asynchrones. **Prend en charge** l'utilisation de l'objet global `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Minuteurs

Pour utiliser des méthodes telles que `setTimeout`, `setInterval` ou `setImmediate`, elles doivent être importées via le paquet `timers` de Node.js (disponible uniquement en mode non sécurisé).

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```
