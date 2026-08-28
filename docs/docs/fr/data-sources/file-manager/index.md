---
title: "Gestionnaire de fichiers"
description: "Tables de fichiers, champs de pièces jointes et moteurs de stockage de fichiers, avec prise en charge du stockage local, d’Alibaba Cloud OSS, d’Amazon S3 et de Tencent Cloud COS, ainsi que de la gestion des métadonnées et de l’envoi des fichiers."
keywords: "gestionnaire de fichiers,table de fichiers,champ de pièces jointes,moteur de stockage,OSS,S3,COS,NocoBase"
---

# Gestionnaire de fichiers

<PluginInfo name="file-manager"></PluginInfo>

## Présentation

Le plugin Gestionnaire de fichiers fournit des tables de fichiers, des champs de pièces jointes ainsi que des moteurs de stockage de fichiers afin de gérer efficacement les fichiers. Un fichier est un enregistrement de table de données doté d’une structure spécifique. La table de données dotée de cette structure particulière est appelée table de fichiers. Elle sert à stocker les métadonnées des fichiers et peut être gérée via le Gestionnaire de fichiers. Un champ de pièces jointes est un champ de relation spécifique associé à une table de fichiers. Les fichiers prennent en charge plusieurs modes de stockage. Les moteurs de stockage de fichiers actuellement pris en charge comprennent le stockage local, Alibaba Cloud OSS, Amazon S3 et Tencent Cloud COS.

## Manuel d’utilisation

### Table de fichiers

La table attachments est intégrée et sert à stocker les fichiers associés à tous les champs de pièces jointes. Il est également possible de créer de nouvelles tables de fichiers pour stocker des fichiers spécifiques.

[Pour plus d’informations, consultez la documentation de présentation des tables de fichiers](/data-sources/file-manager/file-collection)

### Champ de pièces jointes

Un champ de pièces jointes est un champ de relation spécifique associé à une table de fichiers. Il peut être créé via un « champ de type pièce jointe » ou configuré via un « champ de relation ».

[Pour plus d’informations, consultez la documentation de présentation des champs de pièces jointes](/data-sources/file-manager/field-attachment)

### Moteur de stockage de fichiers

Les moteurs de stockage de fichiers servent à enregistrer les fichiers dans un service spécifique, notamment le stockage local (enregistrement sur le disque dur du serveur) et le stockage cloud.

[Pour plus d’informations, consultez la présentation des moteurs de stockage de fichiers](./storage/index.md)

### API HTTP

L’envoi de fichiers peut être effectué via l’API HTTP. Consultez [API HTTP](./http-api.md).

## D développement d’extensions

*