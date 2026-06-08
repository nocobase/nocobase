---
title: 'nb env proxy'
description: 'Référence du thème nb env proxy : consultez les sous-commandes Nginx et Caddy.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuration proxy'
---

# nb env proxy

Dans NocoBase CLI, `nb env proxy` est maintenant un thème. Il ne génère plus de configuration à lui seul. Il sert surtout à découvrir les sous-commandes provider pour Nginx et Caddy.

Si ton application est déjà enregistrée comme env géré par la CLI et que cet env est de type `local` ou `docker`, il suffit généralement de choisir directement l’une des sous-commandes provider.

## Utilisation

```bash
nb env proxy
```

## Quelle sous-commande ouvrir en premier

| Je veux... | Aller ici |
| --- | --- |
| Continuer à utiliser Nginx pour les sites, les certificats, le cache ou le contrôle d’accès | [`nb env proxy nginx`](./nginx.md) |
| Mettre HTTPS en place rapidement et gérer moins de détails TLS soi-même | [`nb env proxy caddy`](./caddy.md) |
| Ajuster des paramètres d’env qui peuvent influencer la sortie proxy, comme `app-port` ou `app-public-path` | [`nb env update`](../update.md) |

## Remarques

- `nb env proxy` n’a pas de flags propres
- `nb env proxy nginx` et `nb env proxy caddy` sont les commandes qui génèrent réellement les configurations
- Les deux sous-commandes fonctionnent uniquement pour des env gérés dont le runtime est accessible depuis la machine actuelle, c’est-à-dire `local` ou `docker`
- Si tu modifies des paramètres comme `app-port` ou `app-public-path` avec `nb env update`, tu devras généralement relancer ensuite la sous-commande proxy correspondante
- Ce groupe de commandes ne fonctionne pas pour le moment avec des env qui n’ont qu’une connexion API distante ni avec des env SSH

## Exemples

```bash
# Afficher l’aide du thème
nb env proxy

# Générer une configuration Nginx pour un env
nb env proxy nginx --env demo --host demo.local.nocobase.com

# Générer une configuration Caddy pour un env
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## Commandes associées

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
