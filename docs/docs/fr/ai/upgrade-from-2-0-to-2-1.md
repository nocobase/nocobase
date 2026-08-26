---
title: Guide de mise à niveau de NocoBase 2.0 vers 2.1
description: Mettre à niveau une application NocoBase 2.0 vers 2.1, avec anciennes méthodes d’installation, nb CLI et chemin de migration recommandé.
---

# Comment passer NocoBase de 2.0 à 2.1

La mise à niveau de NocoBase 2.0 vers NocoBase 2.1 est fluide pour l’application elle-même. Le changement le plus important concerne NocoBase CLI.

Ainsi :

- En 2.0 et dans les versions antérieures, les commandes CLI commencent généralement par `yarn nocobase`
- En 2.1 et dans les versions ultérieures, la CLI utilise le `nb` installé globalement

Les anciennes applications n’ont pas besoin de migrer vers `nb` immédiatement. Si tu veux seulement mettre à niveau vers 2.1 une application NocoBase 2.0 déjà stable, continue par défaut à utiliser la méthode d’installation et de mise à niveau d’origine. Pour les nouvelles applications, nous recommandons la nouvelle CLI `nb`.

## Continuer avec la méthode d’installation et de mise à niveau d’origine

Si tu es déjà habitué à l’ancienne méthode d’installation, tu peux continuer à l’utiliser. L’installation et la mise à niveau suivent toujours les documentations d’origine.

### Installer NocoBase

- [Installation avec Docker](/get-started/installation/docker)
- [Installation avec create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installation depuis les sources Git](/get-started/installation/git)

### Mettre à niveau NocoBase

- [Mettre à niveau une installation Docker](/get-started/upgrading/docker)
- [Mettre à niveau une installation create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Mettre à niveau une installation depuis les sources Git](/get-started/upgrading/git)

## Utiliser `nb` CLI pour les nouvelles applications

Pour les nouvelles applications, nous recommandons le flux d’installation et de mise à niveau plus pratique avec `nb`.

### Installer NocoBase

- [Installer l’application NocoBase](./install-nocobase-app.md)

### Mettre à niveau NocoBase

- [Mettre à niveau l’application NocoBase](./upgrade-nocobase-app.md)

## Migrer vers `nb` CLI

Si tu veux gérer les applications avec `nb` de manière unifiée à l’avenir, l’approche la plus fiable pour le moment consiste à créer une nouvelle application, puis à y migrer les données de l’ancienne application.

Étapes de migration :

1. Crée d’abord une nouvelle application CLI avec `nb init`
2. Migre la base de données, `storage` et les variables d’environnement nécessaires de l’ancienne application
3. Après avoir vérifié que la nouvelle application fonctionne correctement, bascule l’environnement de production

Tu peux aussi attendre encore un peu. La capacité de `nb` à prendre en charge les applications locales existantes est encore en développement.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
