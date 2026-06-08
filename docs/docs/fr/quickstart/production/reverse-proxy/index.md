---
title: 'Reverse Proxy en production'
description: 'Utilise nb env proxy nginx et nb env proxy caddy pour générer des configurations de reverse proxy pour des env NocoBase gérés par la CLI.'
keywords: 'NocoBase,nb env proxy nginx,nb env proxy caddy,reverse proxy,Nginx,Caddy,production'
---

# Reverse Proxy en production

Dans NocoBase CLI, il y a deux points d’entrée recommandés pour placer un reverse proxy devant une application de production :

- `nb env proxy nginx`
- `nb env proxy caddy`

`nb env proxy` est maintenant seulement un thème qui affiche l’aide de ces deux sous-commandes. Tant que ton application est déjà enregistrée comme env CLI et que le type d’env est `local` ou `docker`, il suffit généralement de laisser la CLI générer la configuration. La CLI garde ainsi synchronisés des détails délicats comme la gestion de WebSocket, les sous-chemins, les pages de repli SPA et les mises à jour ultérieures. Tu dois simplement décider si la couche d’entrée doit continuer à utiliser Nginx ou passer à Caddy.

Si ton application n’est pas gérée par la CLI, ou si tu veux explicitement écrire toi-même la configuration proxy complète, va directement à la section de configuration manuelle dans les pages provider.

## Vérifie d’abord que ce chemin convient à ton installation

- Ton application est déjà accessible via une adresse interne comme `http://127.0.0.1:13000`
- L’application est déjà enregistrée comme env CLI et le type d’env est `local` ou `docker`
- `appPort` est déjà enregistré pour cet env

Si la commande indique que `appPort` manque, exécute d’abord [`nb env update`](../../../api/cli/env/update.md) et enregistre cette valeur.

Si tu modifies ensuite des paramètres comme `app-port` ou `app-public-path` qui influencent la sortie proxy, pense à relancer la sous-commande proxy correspondante.

## Chemin par défaut : laisse d’abord la CLI générer la configuration

Si tu sais déjà quel provider d’entrée tu veux conserver, va directement à la sous-commande correspondante :

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

Si tu as déjà basculé sur l’env courant, tu peux aussi omettre `--env` :

```bash
nb env proxy nginx --host demo.example.com
```

Autrement dit :

- Si tu utilises déjà Nginx pour gérer les sites, le cache, le contrôle d’accès ou les certificats, commence par [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- Si tu veux mettre HTTPS en place rapidement et ne pas gérer toi-même beaucoup de détails TLS, commence par [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- `--port` correspond au port d’entrée du proxy, pas au `appPort` de l’application

Si tu veux que la CLI relie aussi la configuration partagée à la configuration principale du provider et la recharge après validation, ajoute :

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

Pour la référence complète, consulte [`nb env proxy`](../../../api/cli/env/proxy/index.md).

## Ce que la CLI garde synchronisé pour toi

La CLI ne génère pas qu’un simple extrait proxy. Elle maintient aussi des fichiers auxiliaires propres à chaque provider. La forme de la sortie varie selon le provider :

- Nginx maintient `app.conf`, `public/index-v1.html`, `public/index-v2.html`, le fichier partagé `nocobase.conf` et le répertoire partagé `snippets/`
- Caddy maintient `generated.caddy`, `app.caddy` et le fichier partagé `nocobase.caddy`

:::warning Note

Si tu dois ajouter une configuration spécifique au site, modifie `app.conf` ou `app.caddy`. N’édite pas manuellement les fichiers auxiliaires gérés par la CLI, car ils seront écrasés à la prochaine exécution de la commande.

:::

## Quelle page ouvrir en premier

| Je veux... | Aller ici |
| --- | --- |
| Continuer à utiliser Nginx pour les sites, les certificats, le cache ou le contrôle d’accès | [Nginx](./nginx.md) |
| Mettre HTTPS en place rapidement et gérer moins de détails de certificats et de TLS | [Caddy](./caddy.md) |
| Consulter l’arborescence des commandes avant de choisir un provider | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| Voir d’abord les options, les fichiers de sortie et les exemples de la sous-commande Nginx | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| Voir d’abord les options, les fichiers de sortie et les exemples de la sous-commande Caddy | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| Ajuster des paramètres d’env qui peuvent influencer la sortie proxy, comme `app-port` ou `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Installer d’abord l’application comme env géré par la CLI | [Installer avec la CLI (recommandé)](../../installation/cli.md) |

## Quand le chemin généré par la CLI n’est pas le meilleur choix

Ces cas sont généralement mieux couverts par la section de configuration manuelle dans les pages provider :

- Ton application n’est pas gérée par la CLI
- L’env n’a qu’une connexion API distante, ou bien c’est un env SSH
- Tu veux explicitement maintenir toi-même la configuration Nginx complète ou le `Caddyfile` complet

Tant que l’application est déjà enregistrée comme env CLI et que la machine actuelle peut joindre son runtime, la recommandation par défaut reste de commencer par ces commandes. Cela rend beaucoup plus simples les changements de domaine, les ajustements spécifiques au site et les régénérations ultérieures.

## Liens associés

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Variables d’environnement de l’application](../../installation/env.md)
- [Installer avec la CLI (recommandé)](../../installation/cli.md)
