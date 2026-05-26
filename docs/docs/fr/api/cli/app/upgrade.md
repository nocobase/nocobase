---
title: "nb app upgrade"
description: "Référence de la commande nb app upgrade : arrêter l'application, remplacer les sources ou l'image enregistrées, puis redémarrer l'application NocoBase indiquée."
keywords: "nb app upgrade,NocoBase CLI,mise à niveau,mettre à jour,image Docker"
---

# nb app upgrade

Mettre à niveau l'application NocoBase indiquée. La CLI arrête d'abord l'application actuelle, remplace par défaut les sources ou l'image enregistrées, synchronise les plugins commerciaux, relance l'application avec quickstart, puis actualise le runtime de l'env à la fin. Les envs Docker recréent le conteneur d'application à partir de la configuration enregistrée de l'env au démarrage.

## Utilisation

```bash
nb app upgrade [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI à mettre à niveau ; utilise l'env courant si omis |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--skip-download`, `-s` | boolean | Redémarrer à partir des sources locales ou de l'image Docker actuellement enregistrées sans télécharger d'abord les mises à jour ; ignore aussi `nb license plugins sync` |
| `--version` | string | Remplace la version cible de cette mise à niveau ; en cas de succès, la nouvelle version est réécrite dans `downloadVersion` de la configuration de l'env |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes de mise à jour et de redémarrage sous-jacentes |

## Exemples

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

Par défaut, `nb app upgrade` exécute ces étapes :

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start --quickstart`
5. Enregistrer la nouvelle `downloadVersion` si nécessaire
6. `nb env update`

Quand `--skip-download` est passé, la CLI ignore les étapes 2 et 3 et redémarre directement les sources ou l'image actuellement enregistrées. Si `--version` est aussi passé, la CLI ne télécharge pas cette version pendant cette exécution ; elle l'enregistre seulement comme nouvelle `downloadVersion` après un redémarrage réussi, afin que les mises à niveau suivantes puissent l'utiliser.

L'étape 4 attend que l'application passe `__health_check`. Pendant cette attente, la CLI affiche d'abord une ligne d'attente, puis une ligne de progression toutes les 10 secondes jusqu'à ce que l'application soit prête ou que le health check atteigne son délai d'expiration.

Si la dernière étape `nb env update` échoue, la mise à niveau est quand même considérée comme réussie. La CLI affiche un avertissement et vous demande d'exécuter `nb env update <envName>` manuellement ensuite.

## Commandes connexes

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
