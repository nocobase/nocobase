---
pkg: '@nocobase/plugin-file-manager'
title: "URL stable (URL proxy)"
description: "Explique le format, les autorisations, les redirections et le comportement des URL de fichiers stables dans NocoBase."
keywords: "URL stable,URL proxy,URL permanente,accès aux fichiers,aperçu Office,NocoBase"
---

# URL stable

Les fichiers gérés par un moteur de stockage sont accessibles via une **URL stable**. NocoBase vérifie l'enregistrement et les autorisations, puis redirige vers l'URL réelle générée par le stockage.

## Format

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Avec `APP_PUBLIC_PATH=/nocobase`, le chemin commence par `/nocobase/files/`. L'ID et l'extension ne peuvent pas être modifiés après la création, ce qui garde l'URL stable tant que l'enregistrement existe.

| Usage | URL | Comportement |
|---|---|---|
| Ouvrir | `/files/.../42.pdf` | Vérifie les droits et redirige vers le fichier |
| Aperçu | `/files/.../42.png?preview=1` | Redirige vers l'aperçu ou la miniature |
| Télécharger | `/files/.../42.pdf?download=1` | Redirige avec une sémantique de téléchargement |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Accès temporaire pour Office Online Viewer |

## Comportement dans NocoBase

- Les champs pièce jointe, les tables de fichiers et l'[HTTP API](./http-api.md) renvoient des URL stables dans `url` et `preview`
- Markdown enregistre l'URL stable et prend en charge les stockages privés S3, OSS, COS et S3 Pro
- Le champ URL de pièce jointe conserve les URL externes saisies manuellement et utilise l'URL stable pour les fichiers gérés
- Les aperçus classiques utilisent la session et les autorisations NocoBase actuelles
- Un formulaire public limite l'accès aux fichiers envoyés pendant la session actuelle du formulaire

## Aperçu Office

Microsoft Office Online Viewer ne peut pas utiliser le cookie NocoBase de l'utilisateur. À l'ouverture, NocoBase vérifie d'abord l'autorisation, puis émet une URL temporaire liée au fichier. Elle est valable 10 minutes par défaut et peut être réglée de 5 à 10 minutes avec `TEMPORARY_FILE_ACCESS_EXPIRES_IN`.

N'enregistrez pas cette URL dans un champ, du Markdown ou des données métier, et ne l'utilisez pas comme lien de partage.

## Précautions

- Stable ne signifie pas public ; le destinataire a toujours besoin d'une autorisation
- La suppression ou le déplacement de l'enregistrement invalide l'ancienne URL
- La réponse est une redirection `302` que le client doit suivre
- Ne conservez pas `302 Location` ni `temporaryAccessToken`
- Le proxy inverse doit transmettre à NocoBase la route `/files/` située sous `APP_PUBLIC_PATH`. Pour un déploiement dans un sous-chemin, conservez également la route compatible `/files/` à la racine. Les configurations générées par la CLI NocoBase incluent automatiquement ces deux règles
- Utilisez un `hostname` différent pour chaque service NocoBase indépendant au lieu de les distinguer uniquement par leur port. Les cookies du navigateur ne sont pas isolés par port ; consultez [Déploiement en production](../get-started/deployment/production.md)
- Les sous-applications d'un même déploiement NocoBase sont distinguées par leur nom d'application et ne nécessitent pas de hostnames séparés. Un service indépendant exécuté sur un autre port doit toutefois être isolé par hostname s'il contient une application principale ou une sous-application portant le même nom

## Liens associés

- [HTTP API](./http-api.md) — Envoyer et interroger des fichiers
- [Aperçu de fichiers](./file-preview/index.md) — Formats d'aperçu pris en charge
- [Aperçu Office](./file-preview/ms-office.md) — Configurer Office Viewer
- [Moteurs de stockage](./storage/index.md) — Configurer le stockage
