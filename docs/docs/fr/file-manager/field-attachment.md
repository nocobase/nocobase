:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champ Pièce jointe

## Introduction

Le système intègre un type de champ "Pièce jointe" pour permettre aux utilisateurs de téléverser des fichiers dans les collections personnalisées.

Le champ Pièce jointe est fondamentalement un champ d'association de type "plusieurs à plusieurs" qui pointe vers la collection intégrée "Attachments" (`attachments`). Lorsque vous créez un champ Pièce jointe dans une collection, une table de jonction pour la relation plusieurs à plusieurs est automatiquement générée. Les métadonnées des fichiers téléversés sont stockées dans la collection "Attachments", et les informations de fichier référencées dans la collection sont associées via cette table de jonction.

## Configuration du champ

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrictions de type MIME

Permet de restreindre les types de fichiers autorisés au téléversement, en utilisant le format de syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Par exemple : `image/*` représente les fichiers image. Plusieurs types peuvent être séparés par une virgule. Par exemple : `image/*,application/pdf` autorise les fichiers image et les fichiers PDF.

### Moteur de stockage

Sélectionnez le moteur de stockage à utiliser pour les fichiers téléversés. Si ce champ est laissé vide, le moteur de stockage par défaut du système sera utilisé.