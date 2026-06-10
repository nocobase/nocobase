# Installer via Docker Compose

Si vous souhaitez exécuter NocoBase directement sur le serveur, `docker compose` reste le moyen le plus direct. Une portion de `docker-compose.yml` suffit dans la plupart des scénarios.

Cependant, dans un environnement de production, il est recommandé de corriger le numéro de version spécifique et de ne pas utiliser directement `latest` pendant une longue période. Cela rendra la mise à niveau plus contrôlable.

## Prérequis

- Docker et Docker Compose installés
- Assurez-vous que le service Docker est démarré
- Un port à ouvrir sur le monde extérieur a été préparé, tel que `13000`

## Étape 1 : Créer le répertoire du projet

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Étape 2 : Créer `docker-compose.yml`

L'exemple suivant utilise PostgreSQL, qui est également la combinaison par défaut la plus simple :

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

dans:

- `APP_KEY` N'oubliez pas de le remplacer par votre propre chaîne aléatoire
- `13000:80` représente le mappage du port `13000` de l'hôte au port `80` du conteneur
- Si vous disposez déjà d'un service de base de données, vous pouvez supprimer la section `postgres` et remplacer `DB_HOST` par l'adresse de la base de données existante.

Si vous utilisez MySQL ou MariaDB, pensez à remplacer `DB_DIALECT` par le type correspondant et à ajouter :

```bash
DB_UNDERSCORED=true
```

## Étape 3 : Démarrez l'application

```bash
docker compose up -d
```

Vérifiez le journal :

```bash
docker compose logs -f app
```

## Étape 4 : Accédez à l'application

Une fois l'application démarrée, ouvrez :

```text
http://<服务器IP>:13000
```

Si c'est la première fois que vous démarrez, suivez simplement les invites de la page pour initialiser le compte administrateur.

## Commandes courantes

Démarrez ou mettez à jour les conteneurs :

```bash
docker compose up -d
```

Arrêter l'application :

```bash
docker compose down
```

Vérifiez le journal :

```bash
docker compose logs -f app
```

## Où chercher ensuite

- Si vous souhaitez ajuster la configuration des clés, des ports, des bases de données, etc., continuez à voir [Variables d'environnement d'application](./env.md)
- Si vous êtes prêt à vous connecter officiellement, continuez à lire [Nginx](../production/reverse-proxy/nginx.md) ou [Caddy](../production/reverse-proxy/caddy.md)
- Si vous souhaitez sauvegarder les données plus tard, continuez à voir [Sauvegarde et restauration](../operations/backup-restore.md)
