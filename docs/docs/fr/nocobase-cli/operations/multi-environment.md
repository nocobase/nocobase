#Gestion d'environnements multiples

Si vous gérez plusieurs applications NocoBase telles que `dev`, `test`, `staging`, `prod`, etc., vous pouvez les enregistrer respectivement en tant qu'environnement CLI. La plupart des futures commandes `nb` agiront par défaut sur l'environnement actuel, il est donc important de confirmer quel environnement vous utilisez avant d'exécuter des commandes telles que `nb app`, `nb api` et `nb db`.

À partir de cette version, la CLI divise le concept en `current env` et `last env`. Vous n'avez généralement besoin de vous soucier que de `current env` - qui est l'environnement utilisé par le shell ou l'exécution de l'agent actuel. La CLI reviendra à `last env` global uniquement lorsque le mode session n’est pas activé.

## Index rapide

| Je veux... | Quelle commande utiliser |
| --- | --- |
| Créez un nouvel environnement local et terminez l'initialisation en douceur | [`nb init`](../../api/cli/init.md) |
| Enregistrez une application existante en tant que CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Voir quels environnements sont enregistrés localement | [`nb env list`](../../api/cli/env/list.md) |
| Vérifier l'état de connectivité et d'authentification de tous les environnements | [`nb env status --all`](../../api/cli/env/status.md) |
| Changer l'environnement à utiliser par les commandes suivantes | [`nb env use`](../../api/cli/env/use.md) |
| Confirmez dans quel environnement la commande actuelle tombera | [`nb env current`](../../api/cli/env/current.md) et [`nb env status`](../../api/cli/env/status.md) |
| Afficher les configurations détaillées enregistrées par un environnement | [`nb env info`](../../api/cli/env/info.md) |
| Mettez à jour la configuration d'environnement enregistrée, en laissant la CLI resynchroniser l'état actuel si nécessaire | [`nb env update`](../../api/cli/env/update.md) |
| Ré-authentifiez-vous après l'expiration de l'état de connexion ou utilisez une nouvelle méthode d'authentification | [`nb env auth`](../../api/cli/env/auth.md) |
| Supprimez les configurations d'environnement inutilisées et nettoyez les ressources hébergées locales si nécessaire | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip Il est recommandé d'activer d'abord le mode session

Par défaut, il est recommandé d'exécuter [`nb session setup`](../../api/cli/session/setup.md) en premier. De cette manière, différents terminaux, différents shells ou différents environnements d'exécution d'agent peuvent chacun conserver leur propre `current env`, et ils ne s'influenceront pas facilement lors d'opérations parallèles.

Si le mode session n'est pas activé, `nb env use` reviendra à la mise à jour globale de `last env`. Dans ce cas, si un terminal coupe l’environnement, l’autre terminal peut également être affecté.

```bash
nb session setup
```

:::

## Créer plusieurs environnements

Si vous souhaitez créer ou restaurer une application locale, utilisez simplement `nb init`. Il terminera l'initialisation et enregistrera les résultats dans un nouvel environnement CLI.

```bash
nb init --env dev
nb init --env test
```

Si l'application existe déjà et que vous souhaitez simplement la connecter à la CLI, il est généralement plus simple d'utiliser `nb env add` :

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

Le premier concerne davantage "l'initialisation d'un environnement", tandis que le second concerne davantage "l'enregistrement d'un environnement existant". Si vous vous connectez simplement à une application existante, utilisez simplement `nb env add` par défaut.

## Afficher l'environnement configuré

Utilisez d’abord `nb env list` pour voir quels environnements ont été enregistrés localement :

```bash
nb env list
```

Cette commande affiche uniquement la configuration elle-même et ne vérifie pas activement l'état de l'application. Lorsque vous souhaitez voir à la fois l'état de la connectivité et de l'authentification, utilisez `nb env status --all` :

```bash
nb env status --all
```

Vous verrez généralement des valeurs de statut telles que `ok`, `auth failed`, `unreachable`.

## Changer l'environnement actuel

Utilisez `nb env use` pour changer d'environnement :

```bash
nb env use dev
```

Une fois le changement terminé, les commandes suivantes qui omettent `--env` utiliseront cet environnement par défaut.

## Vérifiez l'environnement actuel

Si vous n'êtes pas sûr de l'environnement dans lequel la commande actuelle appartiendra, exécutez d'abord ces deux commandes :

```bash
nb env current
nb env status
```

`nb env current` est utilisé pour voir le nom, `nb env status` est utilisé pour voir si l'environnement actuel est accessible et l'authentification est normale.

## Afficher les détails d'un seul environnement

Si vous souhaitez voir quelles configurations sont enregistrées dans un certain environnement, utilisez `nb env info` :

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Parmi eux, `--field` convient pour prendre une seule valeur dans le script. `--show-secrets` affichera des informations sensibles telles que des jetons et des mots de passe en texte brut. Utilisez-les uniquement lorsque vous avez clairement besoin de dépanner.

## Mettre à jour la configuration de l'environnement

`nb env update` est utilisé pour ajuster la configuration d'un environnement enregistré. Tels que l'adresse API, la méthode d'authentification, la source du code source, le port d'application et les paramètres de base de données. Une fois la mise à jour terminée, la CLI gère automatiquement les étapes de suivi en fonction des modifications.

Si vous souhaitez simplement que la CLI se resynchronise en fonction du dernier état de l'environnement actuel, écrivez simplement comme ceci :

```bash
nb env update
nb env update prod
```

Si vous souhaitez modifier les informations de connexion ou la configuration locale enregistrées par cet environnement, vous pouvez explicitement apporter les paramètres :

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Ici, vous pouvez d'abord vous souvenir d'un jugement par défaut :

- Pour modifier les informations de connexion ou la configuration locale enregistrées par env, utilisez `nb env update`
- L'interface de l'application, les capacités disponibles du plug-in ou de la CLI viennent de changer, vous pouvez également exécuter à nouveau `nb env update`
- Le statut de connexion a expiré ou vous devez recommencer le processus d'authentification, utilisez `nb env auth`
- Juste pour voir ce qui est actuellement enregistré, utilisez `nb env info`

Si vous modifiez les configurations en cours d'exécution locales telles que `app-port`, `timezone` et `db-*`, `update` modifiera uniquement la valeur enregistrée et ne redémarrera pas automatiquement l'application. D'une manière générale, `nb app restart --env <name>` sera exécuté plus tard ; si le changement concerne la base de données intégrée gérée par CLI, utilisez `nb app restart --env <name> --with-db`.

## Réauthentification

Si env a été enregistré, mais que l'état de connexion a expiré ou si vous souhaitez changer de méthode d'authentification, vous pouvez vous réauthentifier :

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Lorsque le nom de l'environnement est omis, la CLI utilise l'environnement actuel. Une fois l'authentification terminée, la CLI gère automatiquement la synchronisation ultérieure.

## Supprimer l'environnement

Ces scénarios sont les plus déroutants. Vous pouvez d'abord retenir une suggestion par défaut :

- Si vous souhaitez simplement arrêter l'application, utilisez `nb app stop`
- Je souhaite également arrêter l'exécution de la base de données intégrée sur la machine actuelle, utilisez `nb app stop --with-db`
- Si vous êtes sûr que cet environnement n'est plus nécessaire, mais que vous souhaitez d'abord conserver le stockage et les fichiers de l'application locale, utilisez `nb env remove`
- Nettoyez même les ressources d'hébergement locales et utilisez `nb env remove --purge`

Si vous souhaitez uniquement supprimer la configuration d'environnement enregistrée :

```bash
nb env remove staging
```

S'il s'agit d'un environnement local ou hébergé par Docker et que vous souhaitez également nettoyer les ressources en cours d'exécution et les données de stockage sur la machine locale, vous pouvez ajouter `--purge` :

```bash
nb env remove test --purge
```

En mode non interactif, `nb env remove` doit être transmis explicitement dans `--force` :

```bash
nb env remove test --purge --force
```

`--purge` nettoiera uniquement les ressources gérées par la CLI sur la machine actuelle. Pour l’environnement API distant, le service distant lui-même ne sera pas supprimé.

Si vous souhaitez simplement arrêter l'application et la base de données intégrée gérée par CLI, écrivez simplement :

```bash
nb app stop --env app1 --with-db
```

Si vous souhaitez supprimer cet environnement tout en conservant le stockage et les fichiers de l'application locale :

```bash
nb env remove app1 --force
```

Si vous souhaitez vraiment nettoyer le contenu hébergé nativement de cet environnement, ajoutez `--purge` :

```bash
nb env remove app1 --purge --force
```

Pour l'environnement npm/Git local géré par les téléchargements CLI, `--purge` supprime également les fichiers d'application locale hébergés par la CLI. Pour l'environnement HTTP ou SSH, il supprimera uniquement la configuration d'environnement enregistrée dans la CLI et ne supprimera pas le service externe lui-même.

## Liens connexes

- [Référence de commande `nb env`](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [Référence de commande `nb session`](../../api/cli/session/index.md)
- [intention de conception d'application nb](../cli-design/nb-app-design-intent.md)
- [Gérer l'application](./manage-app.md)
