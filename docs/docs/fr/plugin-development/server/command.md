:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Commande

Dans NocoBase, les commandes vous permettent d'exécuter des opérations liées aux applications ou aux plugins directement depuis la ligne de commande. Il peut s'agir de tâches système, d'opérations de migration ou de synchronisation, d'initialisation de configurations, ou encore d'interactions avec des instances d'application en cours d'exécution. Les développeurs peuvent définir des commandes personnalisées pour leurs plugins, les enregistrer via l'objet `app`, et les exécuter dans la CLI sous la forme `nocobase <commande>`.

## Types de commandes

Dans NocoBase, l'enregistrement des commandes se divise en deux catégories :

| Type              | Méthode d'enregistrement              | Le plugin doit-il être activé ? | Scénarios typiques                                |
| :---------------- | :------------------------------------ | :------------------------------ | :------------------------------------------------ |
| Commande dynamique | `app.command()`                       | ✅ Oui                          | Commandes liées à la logique métier du plugin     |
| Commande statique  | `Application.registerStaticCommand()` | ❌ Non                          | Commandes d'installation, d'initialisation, de maintenance |

## Commandes dynamiques

Utilisez `app.command()` pour définir des commandes de plugin. Celles-ci ne peuvent être exécutées qu'une fois le plugin activé. Les fichiers de commande doivent être placés dans le répertoire `src/server/commands/*.ts` du plugin.

Exemple

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Description

- `app.command('echo')` : Définit une commande nommée `echo`.
- `.option('-v, --version')` : Ajoute une option à la commande.
- `.action()` : Définit la logique d'exécution de la commande.
- `app.version.get()` : Récupère la version actuelle de l'application.

Exécuter la commande

```bash
nocobase echo
nocobase echo -v
```

## Commandes statiques

Enregistrées via `Application.registerStaticCommand()`, les commandes statiques peuvent être exécutées sans activer les plugins. Elles sont idéales pour les tâches d'installation, d'initialisation, de migration ou de débogage. Enregistrez-les dans la méthode `staticImport()` de la classe du plugin.

Exemple

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Exécuter la commande

```bash
nocobase echo
nocobase echo --version
```

Description

- `Application.registerStaticCommand()` enregistre les commandes avant l'instanciation de l'application.
- Les commandes statiques sont généralement utilisées pour exécuter des tâches globales qui ne dépendent pas de l'état de l'application ou du plugin.

## API des commandes

Les objets de commande offrent trois méthodes d'assistance optionnelles pour contrôler le contexte d'exécution de la commande :

| Méthode     | Rôle                                                       | Exemple                               |
| :---------- | :--------------------------------------------------------- | :------------------------------------ |
| `ipc()`     | Communique avec les instances d'application en cours d'exécution (via IPC) | `app.command('reload').ipc().action()` |
| `auth()`    | Vérifie que la configuration de la base de données est correcte | `app.command('seed').auth().action()` |
| `preload()` | Précharge la configuration de l'application (exécute `app.load()`) | `app.command('sync').preload().action()` |

Description de la configuration

- **`ipc()`**
  Par défaut, les commandes s'exécutent dans une nouvelle instance d'application.
  Après avoir activé `ipc()`, les commandes interagissent avec l'instance d'application en cours d'exécution via la communication inter-processus (IPC). Cette méthode est adaptée aux commandes d'opérations en temps réel (comme le rafraîchissement du cache ou l'envoi de notifications).

- **`auth()`**
  Vérifie si la configuration de la base de données est disponible avant l'exécution de la commande.
  Si la configuration de la base de données est incorrecte ou si la connexion échoue, la commande ne sera pas exécutée. Cette méthode est couramment utilisée pour les tâches impliquant des écritures ou des lectures dans la base de données.

- **`preload()`**
  Précharge la configuration de l'application avant d'exécuter la commande, ce qui équivaut à exécuter `app.load()`.
  Convient aux commandes qui dépendent de la configuration ou du contexte du plugin.

Pour plus de méthodes API, veuillez consulter [AppCommand](/api/server/app-command).

## Exemples courants

Initialiser les données par défaut

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Utilisateur administrateur par défaut initialisé.');
  });
```

Recharger le cache pour une instance en cours d'exécution (mode IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Demande de rechargement du cache à l\'application en cours d\'exécution...');
  });
```

Enregistrement statique d'une commande d'installation

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Configuration de l\'environnement NocoBase...');
    });
});
```