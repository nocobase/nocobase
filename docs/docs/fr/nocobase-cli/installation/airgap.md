#Installation intranet

Si votre serveur ne peut pas accéder au réseau public, la méthode d'installation vous oblige à préparer à l'avance les images, les dépendances et les packages de plug-ins requis pour une utilisation hors ligne. Par défaut, il est recommandé d'utiliser en premier Docker, qui a le chemin le plus court et le plus simple à reproduire.

## Recommandation par défaut : préparer l'image Docker hors ligne

Sur une machine pouvant accéder au réseau public, déroulez d’abord l’image de l’application et l’image de la base de données :

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Exportez ensuite sous forme de fichier hors ligne :

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Si vous avez encore besoin de plug-ins commerciaux, il est également recommandé de préparer le package de plug-ins dans l'environnement réseau externe, puis de l'intégrer ensemble dans l'intranet.

## Copiez le fichier sur le serveur intranet

Préparez au moins ces documents :

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` ou vos propres instructions de déploiement

## Importer l'image sur le serveur intranet

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Démarrer l'application

Après avoir préparé `docker-compose.yml`, commencez directement :

```bash
docker compose up -d
docker compose logs -f app
```

Si vous n'avez pas encore écrit de fichier de composition, lisez d'abord [Installation via Docker Compose](./docker-compose.md) et enregistrez-y les exemples localement.

## Que faire si vous ne pouvez pas utiliser Docker

Si Docker ne peut pas être utilisé dans votre environnement intranet, vous pouvez également utiliser `create-nocobase-app` pour créer un projet complet dans l'environnement réseau externe, installer les dépendances et le packager, puis copier l'intégralité du projet sur le serveur intranet.

Ce chemin sera plus long, mais plus pratique dans les environnements sans capacités de conteneur. Le processus global est généralement :

1. Créez un projet dans un environnement réseau externe et installez les dépendances.
2. Packagez le répertoire du projet.
3. Copiez sur le serveur intranet.
4. Décompressez le fichier sur l'intranet, complétez `.env` et démarrez l'application.

## Où chercher ensuite

- Si vous n'avez pas confirmé la configuration de l'application, continuez à voir [Variables d'environnement d'application](./env.md)
- Si vous êtes prêt à ouvrir officiellement l'application aux utilisateurs professionnels, continuez à lire [Nginx](../production/reverse-proxy/nginx.md) ou [Caddy](../production/reverse-proxy/caddy.md)
