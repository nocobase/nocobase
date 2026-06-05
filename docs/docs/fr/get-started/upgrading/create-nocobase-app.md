:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mise à jour d'une installation `create-nocobase-app`

:::warning Préparation avant la mise à jour

- Assurez-vous de sauvegarder la base de données au préalable.
- Arrêtez l'instance NocoBase en cours d'exécution.

:::

## 1. Arrêter l'instance NocoBase en cours d'exécution

Si le processus n'est pas exécuté en arrière-plan, arrêtez-le avec `Ctrl + C`. En environnement de production, utilisez la commande `pm2-stop` pour l'arrêter.

```bash
yarn nocobase pm2-stop
```

## 2. Exécuter la commande de mise à jour

Il vous suffit d'exécuter la commande de mise à jour `yarn nocobase upgrade`.

```bash
# Accédez au répertoire correspondant
cd my-nocobase-app
# Exécutez la commande de mise à jour
yarn nocobase upgrade
# Démarrez
yarn dev
```

### Mettre à jour vers une version spécifique

Modifiez le fichier `package.json` situé à la racine de votre projet. Il vous suffit de changer les numéros de version pour `@nocobase/cli` et `@nocobase/devtools` (notez que vous ne pouvez que mettre à jour, pas rétrograder). Par exemple :

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Ensuite, exécutez la commande de mise à jour :

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```