---
title: "Proxy inverse de l’environnement de production"
description: "Générez et gérez la configuration du proxy inverse pour l'environnement NocoBase hébergé par CLI basé sur nb proxy nginx et nb proxy caddy."
keywords: "NocoBase, nb proxy nginx, nb proxy caddy, proxy inverse, Nginx, Caddy, environnement de production"
---


# Proxy inverse

Cet article s'applique uniquement aux applications installées à l'aide de `nb init`.

Dans NocoBase, le proxy inverse de production ne se contente pas de transmettre les requêtes au processus de l'application. Il doit aussi gérer les WebSockets, les sous-chemins, les ressources statiques frontales, les répertoires de téléversement, la route d'accès aux fichiers `/files/` et les pages de secours de la SPA.

La fonction de `nb proxy` est de collecter ces détails facilement manqués dans un ensemble stable d'entrées de commande.

## Processus de base

Si vous ne regardez que le processus principal, il suffit de retenir ces trois commandes :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Si vous utilisez Caddy, remplacez simplement `nginx` dans la commande par `caddy`.

`use local` et `use docker` peuvent être jugés directement comme ceci :

- Si Nginx ou Caddy a été installé localement, utilisez `use local`
- Il n'y a pas d'installation locale. Si vous souhaitez laisser CLI utiliser Docker pour gérer l'agent, utilisez `use docker`

Dans la plupart des scénarios, il suffit d'exécuter d'abord `use`, puis `generate` et enfin `reload`. Pour plus de détails sur Nginx ou Caddy, continuez vers leurs pages respectives.

## Quand choisir Nginx et quand choisir Caddy

On peut généralement le juger ainsi :

| Scénario | Recommandation |
| --- | --- |
| Vous utilisez déjà Nginx pour gérer votre site, vos certificats, votre cache ou votre contrôle d'accès | [Nginx](./nginx.md) |
| Vous possédez déjà un nom de domaine et souhaitez exécuter HTTPS dès que possible et enregistrer certains détails TLS à conserver | [Caddy](./caddy.md) |

## Continuez à lire ci-dessous

| Je veux... | Où chercher |
| --- | --- |
| Suivez l'entrée du site de gestion Nginx | [Nginx](./nginx.md) |
| Connectez HTTPS dès que possible | [Caddy](./caddy.md) |
| Ajustez d'abord la configuration d'environnement qui affectera les résultats du proxy, tels que `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Confirmez d'abord l'installation et la configuration env de l'application | [Installer à l'aide de CLI (recommandé)](../../installation/cli.md) |
