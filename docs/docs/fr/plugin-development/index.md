:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Présentation du développement de plugins

NocoBase adopte une **architecture à micro-noyau**, où le cœur est uniquement responsable de l'ordonnancement du cycle de vie des plugins, de la gestion des dépendances et de l'encapsulation des capacités de base. Toutes les fonctions métier sont fournies sous forme de plugins. Par conséquent, comprendre la structure organisationnelle, le cycle de vie et la méthode de gestion des plugins est la première étape pour personnaliser NocoBase.

## Concepts clés

- **Prêt à l'emploi (Plug and Play)** : Vous pouvez installer, activer ou désactiver des plugins selon vos besoins, ce qui permet de combiner des fonctions métier de manière flexible sans modifier le code.
- **Intégration complète (Full-stack)** : Les plugins incluent généralement des implémentations côté serveur et côté client, garantissant la cohérence entre la logique des données et les interactions de l'interface utilisateur.

## Structure de base d'un plugin

Chaque plugin est un package npm indépendant, et il contient généralement la structure de répertoires suivante :

```bash
plugin-hello/
├─ package.json          # Nom du plugin, dépendances et métadonnées du plugin NocoBase
├─ client.js             # Artefact de compilation frontend, pour le chargement à l'exécution
├─ server.js             # Artefact de compilation côté serveur, pour le chargement à l'exécution
├─ src/
│  ├─ client/            # Code source côté client, peut enregistrer des blocs, des actions, des champs, etc.
│  └─ server/            # Code source côté serveur, peut enregistrer des ressources, des événements, des commandes, etc.
```

## Conventions de répertoires et ordre de chargement

NocoBase scanne par défaut les répertoires suivants pour charger les plugins :

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins en cours de développement (priorité la plus élevée)
└── storage/
    └── plugins/          # Plugins compilés, par exemple les plugins téléchargés ou publiés
```

- `packages/plugins` : Ce répertoire est utilisé pour le développement local de plugins, et il prend en charge la compilation et le débogage en temps réel.
- `storage/plugins` : Ce répertoire stocke les plugins compilés, tels que les éditions commerciales ou les plugins tiers.

## Cycle de vie et états des plugins

Un plugin passe généralement par les étapes suivantes :

1. **Création (`create`)** : Créez un modèle de plugin via la CLI.
2. **Téléchargement (`pull`)** : Téléchargez le package du plugin localement, mais il n'est pas encore écrit dans la base de données.
3. **Activation (`enable`)** : Lors de sa première activation, le plugin exécute les étapes de "enregistrement + initialisation" ; les activations ultérieures ne font que charger la logique.
4. **Désactivation (`disable`)** : Arrêtez l'exécution du plugin.
5. **Suppression (`remove`)** : Supprimez complètement le plugin du système.

:::tip

- La commande `pull` ne fait que télécharger le package du plugin ; le processus d'installation réel est déclenché par la première commande `enable`.
- Si un plugin est seulement téléchargé (`pull`) mais non activé, il ne sera pas chargé.

:::

### Exemples de commandes CLI

```bash
# 1. Créez l'ossature du plugin
yarn pm create @my-project/plugin-hello

# 2. Téléchargez le package du plugin (téléchargement ou lien)
yarn pm pull @my-project/plugin-hello

# 3. Activez le plugin (s'installe automatiquement lors de la première activation)
yarn pm enable @my-project/plugin-hello

# 4. Désactivez le plugin
yarn pm disable @my-project/plugin-hello

# 5. Supprimez le plugin
yarn pm remove @my-project/plugin-hello
```

## Interface de gestion des plugins

Accédez au gestionnaire de plugins dans votre navigateur pour visualiser et gérer les plugins de manière intuitive :

**URL par défaut :** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gestionnaire de plugins](https://static-docs.nocobase.com/20251030195350.png)