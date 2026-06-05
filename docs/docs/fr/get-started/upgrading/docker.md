:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mise à niveau d'une installation Docker

:::warning Avant la mise à niveau

- Assurez-vous de sauvegarder votre base de données.

:::

## 1. Accédez au répertoire de votre fichier `docker-compose.yml`

Par exemple

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Mettez à jour le numéro de version de l'image

:::tip À propos des numéros de version

- Les versions d'alias, telles que `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, ne nécessitent généralement pas de modification.
- Les numéros de version numériques, tels que `1.7.14`, `1.7.14-full`, doivent être modifiés pour correspondre à la version cible.
- Seules les mises à niveau sont prises en charge ; les rétrogradations ne le sont pas !!!
- En environnement de production, nous vous recommandons de fixer une version numérique spécifique pour éviter les mises à niveau automatiques involontaires. [Voir toutes les versions](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Nous vous recommandons d'utiliser l'image d'Aliyun (pour une meilleure stabilité réseau en Chine)
    image: nocobase/nocobase:1.7.14-full
    # Vous pouvez également utiliser une version d'alias (peut se mettre à jour automatiquement, à utiliser avec prudence en production)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (peut être lent ou échouer en Chine)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Redémarrez le conteneur

```bash
# Téléchargez la dernière image
docker compose pull app

# Recréez le conteneur
docker compose up -d app

# Vérifiez l'état du processus de l'application
docker compose logs -f app
```

## 4. Mise à niveau des plugins tiers

Référez-vous à [Installer et mettre à niveau des plugins](../install-upgrade-plugins.mdx).

## 5. Instructions de restauration (rollback)

NocoBase ne prend pas en charge les rétrogradations. Si vous devez restaurer une version précédente, veuillez restaurer la sauvegarde de la base de données effectuée avant la mise à niveau et modifier la version de l'image pour revenir à la version d'origine.

## 6. Questions Fréquemment Posées (FAQ)

**Q : Le téléchargement de l'image est lent ou échoue**

Utilisez un accélérateur de miroir Docker, ou utilisez l'image Aliyun `nocobase/nocobase:<tag>`.

**Q : La version n'a pas changé**

Confirmez que vous avez modifié l'`image` pour le nouveau numéro de version et que vous avez exécuté avec succès `docker compose pull app` et `up -d app`.

**Q : Le téléchargement ou la mise à jour d'un plugin commercial a échoué**

Pour les plugins commerciaux, veuillez vérifier la clé de licence dans le système, puis redémarrer le conteneur Docker. Pour plus de détails, consultez le [Guide d'activation de la licence commerciale NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).