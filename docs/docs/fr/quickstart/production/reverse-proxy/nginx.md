# Nginx

Si votre application NocoBase est déjà accessible via `http://127.0.0.1:13000`, l'étape suivante consiste généralement à placer Nginx devant elle. Cela apporte surtout deux avantages directs : vous n'exposez vers l'extérieur que les ports standard `80/443`, et il devient plus simple d'ajouter ensuite HTTPS, les certificats et les règles de cache.

## Configuration minimale

Commencez par créer un fichier de configuration sur le serveur, par exemple `/etc/nginx/conf.d/nocobase.conf` :

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Ici :

- remplacez `server_name` par votre nom de domaine
- remplacez `127.0.0.1:13000` par l'adresse réelle sur laquelle NocoBase écoute
- vous pouvez augmenter `client_max_body_size` selon vos besoins d'upload

## Vérifier et recharger la configuration

```bash
nginx -t
systemctl reload nginx
```

Si vous ne gérez pas Nginx avec `systemd`, utilisez votre propre méthode de rechargement.

## Comment y accéder ensuite

Si le DNS pointe déjà vers ce serveur, ouvrez :

```text
http://your-domain.com
```

Nginx transférera alors la requête vers NocoBase.

## Que faire pour HTTPS

Si vous avez aussi besoin de HTTPS, il y a généralement deux options courantes :

- continuer à configurer les certificats directement dans Nginx
- passer directement à [Caddy](./caddy.md) pour laisser Caddy demander et renouveler automatiquement les certificats

## Où aller ensuite

- Si votre application ne tourne pas encore, consultez d'abord [Installer avec Docker Compose](../../installation/docker-compose.md)
- Si vous devez encore vérifier les ports ou les clés, continuez avec [Variables d'environnement de l'application](../../installation/env.md)
