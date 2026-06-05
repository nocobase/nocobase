:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champ Pièce jointe

## Introduction

Le système intègre un type de champ "Pièce jointe" pour permettre aux utilisateurs de téléverser des fichiers dans vos collections personnalisées.

En coulisses, le champ Pièce jointe est un champ de relation plusieurs-à-plusieurs qui pointe vers la collection "Attachments" (`attachments`) intégrée au système. Lorsque vous créez un champ Pièce jointe dans une collection, une table de jonction plusieurs-à-plusieurs est automatiquement générée. Les métadonnées des fichiers téléversés sont stockées dans la collection "Attachments", et les informations sur les fichiers référencés dans votre collection sont liées via cette table de jonction.

## Configuration du champ

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restriction des types MIME

Cette option permet de restreindre les types de fichiers autorisés au téléversement, en utilisant la syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Par exemple, `image/*` représente les fichiers image. Vous pouvez spécifier plusieurs types en les séparant par des virgules, comme `image/*,application/pdf`, ce qui autorise à la fois les fichiers image et les fichiers PDF.

### Moteur de stockage

Sélectionnez le moteur de stockage à utiliser pour les fichiers téléversés. Si ce champ est laissé vide, le moteur de stockage par défaut du système sera utilisé.