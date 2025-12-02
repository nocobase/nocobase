---
pkg: "@nocobase/plugin-file-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Gestionnaire de fichiers

## Introduction

Le plugin Gestionnaire de fichiers offre une collection de fichiers, un champ de type pièce jointe et des moteurs de stockage de fichiers pour gérer efficacement vos fichiers. Les fichiers sont des enregistrements au sein d'un type de collection spécial, appelé collection de fichiers, qui stocke les métadonnées des fichiers et peut être gérée via le Gestionnaire de fichiers. Les champs de type pièce jointe sont des champs d'association spécifiques liés à la collection de fichiers. Le plugin prend en charge plusieurs méthodes de stockage, notamment le stockage local, Alibaba Cloud OSS, Amazon S3 et Tencent Cloud COS.

## Manuel d'utilisation

### Collection de fichiers

Une collection `attachments` est intégrée par défaut pour stocker tous les fichiers associés aux champs de type pièce jointe. De plus, vous pouvez créer de nouvelles collections de fichiers pour stocker des fichiers spécifiques.

[En savoir plus dans la documentation sur les collections de fichiers](/data-sources/file-manager/file-collection)

### Champ de type pièce jointe

Les champs de type pièce jointe sont des champs d'association spécifiques liés à la collection de fichiers, que vous pouvez créer via le type de champ « Pièce jointe » ou configurer via un champ « Relation ».

[En savoir plus dans la documentation sur les champs de type pièce jointe](/data-sources/file-manager/field-attachment)

### Moteur de stockage de fichiers

Le moteur de stockage de fichiers est utilisé pour enregistrer les fichiers sur des services spécifiques, y compris le stockage local (enregistrement sur le disque dur du serveur), le stockage cloud, etc.

[En savoir plus dans la documentation sur les moteurs de stockage de fichiers](./storage/index.md)

### API HTTP

Les téléchargements de fichiers peuvent être gérés via l'API HTTP, consultez l'[API HTTP](./http-api.md).

## Développement

*