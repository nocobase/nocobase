# Caddy

Si vous avez déjà un nom de domaine et que vous voulez mettre HTTPS en place rapidement, Caddy est généralement l'option la plus simple. Dans la plupart des cas, un `Caddyfile` très court suffit.

## Configuration minimale

Modifiez `/etc/caddy/Caddyfile` :

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

Ici :

- remplacez `your-domain.com` par votre nom de domaine
- remplacez `127.0.0.1:13000` par l'adresse réelle sur laquelle NocoBase écoute

Si votre domaine pointe déjà correctement vers ce serveur, Caddy gère généralement automatiquement l'émission et le renouvellement des certificats HTTPS.

## Vérifier et recharger la configuration

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Si vous ne gérez pas Caddy avec `systemd`, utilisez votre propre méthode de démarrage et de rechargement.

## Si vous voulez commencer en HTTP seulement

Si vous n'avez pas encore de nom de domaine, vous pouvez aussi écouter d'abord sur un port pour valider le fonctionnement :

```shell
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

Pour un vrai environnement de production, il reste préférable de passer dès que possible à une configuration avec nom de domaine.

## Quand Caddy est généralement plus adapté

- vous voulez activer HTTPS plus rapidement
- vous ne voulez pas maintenir trop de détails de proxy inverse vous-même
- vous avez pour l'instant seulement besoin d'une couche d'entrée simple et stable

## Où aller ensuite

- Si votre application ne tourne pas encore, consultez d'abord [Installer avec Docker Compose](../../installation/docker-compose.md)
- Si vous devez encore vérifier les ports ou les clés, continuez avec [Variables d'environnement de l'application](../../installation/env.md)
