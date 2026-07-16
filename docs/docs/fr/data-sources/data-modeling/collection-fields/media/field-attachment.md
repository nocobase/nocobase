---
title: "Champ de pièces jointes"
description: "Champ de pièces jointes, associé à la table des fichiers pour stocker des images, des documents et d’autres fichiers."
keywords: "Champ de pièces jointes,field-attachment,association de fichiers,images,documents,NocoBase"
---

# Champ de pièces jointes

## Présentation

Le système intègre un type de champ « Pièces jointes », qui permet aux utilisateurs de téléverser des fichiers dans les tables de données personnalisées.

Le champ de pièces jointes est un champ de relation plusieurs-à-plusieurs qui pointe vers une table de fichiers intégrée au système, « Pièces jointes » (`attachments`). Lorsqu’un champ de pièces jointes est créé dans une table de données, une table intermédiaire de relation plusieurs-à-plusieurs avec la table des pièces jointes est automatiquement générée. Les métadonnées des fichiers téléversés sont stockées dans la table « Pièces jointes », tandis que les informations sur les fichiers référencés dans la table de données sont associées via cette table intermédiaire.

## Configuration du champ

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Limitation des types MIME

Permet de limiter les types de fichiers autorisés au téléversement, en utilisant la syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) pour décrire le format. Par exemple : `image/*` représente les fichiers image. Plusieurs types peuvent être séparés par des virgules anglaises, par exemple : `image/*,application/pdf` autorise les fichiers image et les fichiers PDF.

### Moteur de stockage

Sélectionnez le moteur de stockage utilisé pour stocker les fichiers téléversés. Si ce champ n’est pas renseigné, le moteur de stockage par défaut du système sera utilisé.