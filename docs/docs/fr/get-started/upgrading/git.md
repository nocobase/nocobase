:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mise à niveau d'une installation NocoBase depuis les sources Git

:::warning Préparation avant la mise à niveau

- Assurez-vous de sauvegarder votre base de données au préalable.
- Arrêtez l'instance NocoBase en cours d'exécution (`Ctrl + C`).

:::

## 1. Accédez au répertoire du projet NocoBase

```bash
cd my-nocobase-app
```

## 2. Récupérez le dernier code

```bash
git pull
```

## 3. Supprimez le cache et les anciennes dépendances (facultatif)

Si le processus de mise à niveau normal échoue, vous pouvez essayer de vider le cache et les dépendances, puis de les retélécharger.

```bash
# Videz le cache de NocoBase
yarn nocobase clean
# Supprimez les dépendances
yarn rimraf -rf node_modules # équivalent à rm -rf node_modules
```

## 4. Mettez à jour les dépendances

📢 En raison de facteurs tels que l'environnement réseau et la configuration du système, cette étape peut prendre plus de dix minutes.

```bash
yarn install
```

## 5. Exécutez la commande de mise à niveau

```bash
yarn nocobase upgrade
```

## 6. Démarrez NocoBase

```bash
yarn dev
```

:::tip Conseil pour l'environnement de production

Il n'est pas recommandé de déployer une installation NocoBase depuis les sources directement dans un environnement de production (pour les environnements de production, veuillez consulter [Déploiement en production](../deployment/production.md)).

:::

## 7. Mise à niveau des plugins tiers

Reportez-vous à [Installation et mise à niveau des plugins](../install-upgrade-plugins.mdx).