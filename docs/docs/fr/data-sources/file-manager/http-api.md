---
title: "API HTTP du gestionnaire de fichiers"
description: "Les champs de pièces jointes et les tables de fichiers permettent de téléverser des fichiers via l’API HTTP, avec téléversement côté serveur (S3/OSS/COS), téléversement direct côté client, authentification JWT et sélection du moteur de stockage."
keywords: "téléversement de fichiers API HTTP,attachments create,téléversement côté serveur,téléversement direct côté client,NocoBase"
---

# API HTTP

Le téléversement de fichiers des champs de pièces jointes et des tables de fichiers peut être effectué via l’API HTTP. Selon le moteur de stockage utilisé par la pièce jointe ou la table de fichiers, la méthode d’appel diffère.

## Téléversement côté serveur

Pour les moteurs de stockage open source intégrés au projet, tels que S3, OSS et COS, l’API HTTP utilise le même mécanisme que la fonction de téléversement de l’interface utilisateur : les fichiers sont téléversés via le serveur. Les appels d’API doivent transmettre dans l’en-tête `Authorization` un jeton JWT basé sur la connexion de l’utilisateur ; dans le cas contraire, l’accès sera refusé.

### Champ de pièce jointe

Envoyez une requête POST en lançant l’opération `create` sur la ressource de la table des pièces jointes (`attachments`), puis téléversez le contenu binaire via le champ file. Après l’appel, le fichier est téléversé vers le moteur de stockage par défaut.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Pour téléverser le fichier vers un autre moteur de stockage, utilisez le paramètre attachmentField afin de spécifier le moteur de stockage configuré pour le champ de la table concernée (s’il n’est pas configuré, le fichier sera téléversé vers le moteur de stockage par défaut).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Table de fichiers

Le téléversement vers une table de fichiers génère automatiquement un enregistrement de fichier. Envoyez une requête POST en lançant l’opération `create` sur la ressource de la table de fichiers, puis téléversez le contenu binaire via le champ file.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Pour le téléversement vers une table de fichiers, il n’est pas nécessaire de spécifier le moteur de stockage : le fichier sera téléversé vers le moteur de stockage configuré pour cette table.

## Téléversement côté client

Pour les moteurs de stockage compatibles avec S3 fournis par le plug-in commercial S3-Pro, le téléversement via l’API HTTP doit être effectué en plusieurs étapes.

### Champ de pièce jointe

1.  Obtenir les informations du moteur de stockage

    Lancez l’opération getBasicInfo sur la table de stockage (storages) tout en transmettant l’identifiant de l’espace de stockage (storage name), afin d’obtenir les informations de configuration du moteur de stockage.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exemple d’informations de configuration renvoyées par le moteur de stockage :

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obtenir les informations pré-signées du fournisseur

    Lancez l’opération createPresignedUrl sur la ressource fileStorageS3 en envoyant une requête POST et en incluant dans le body les informations relatives au fichier, afin d’obtenir les informations de téléversement pré-signées.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Remarque :
    >
    > * name : nom du fichier
    > * size : taille du fichier (en bytes)
    > * type : type MIME du fichier. Consultez : [Types MIME courants](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId : identifiant du moteur de stockage (champ `id` renvoyé à la première étape)
    > * storageType : type de moteur de stockage (champ type renvoyé à la première étape)
    >
    > Exemple de données de requête :
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La structure des informations pré-signées obtenues est la suivante :

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Téléverser le fichier

    Utilisez putUrl renvoyé pour lancer une requête PUT et téléverser le fichier dans le body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Remarque :
    > * putUrl : champ putUrl renvoyé à l’étape précédente
    > * file_path : chemin d’accès au fichier local à téléverser
    >
    > Exemple de données de requête :
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Créer un enregistrement de fichier

    Une fois le téléversement réussi, lancez l’opération create sur la ressource de la table des pièces jointes (attachments) en envoyant une requête POST afin de créer l’enregistrement du fichier.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Description des données requises dans data-raw :
    > * title : champ `fileInfo.title` renvoyé à l’étape précédente
    > * filename : champ `fileInfo.key` renvoyé à l’étape précédente
    > * extname : champ `fileInfo.extname` renvoyé à l’étape précédente
    > * path : vide par défaut
    > * size : champ `fileInfo.size` renvoyé à l’étape précédente
    > * url : vide par défaut
    > * mimetype : champ `fileInfo.mimetype` renvoyé à l’étape précédente
    > * meta : champ `fileInfo.meta` renvoyé à l’étape précédente
    > * storageId : champ `id` renvoyé à la première étape
    >
    > Exemple de données de requête :
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Table de fichiers

Les trois premières étapes sont identiques à celles du téléversement vers un champ de pièce jointe. À la quatrième étape, il faut créer l’enregistrement du fichier en lançant l’opération create sur la ressource de la table de fichiers, en envoyant une requête POST et les informations du fichier dans le body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Description des données requises dans data-raw :
> * title : champ fileInfo.title renvoyé à l’étape précédente
> * filename : champ fileInfo.key renvoyé à l’étape précédente
> * extname : champ fileInfo.extname renvoyé à l’étape précédente
> * path : vide par défaut
> * size : champ fileInfo.size renvoyé à l’étape précédente
> * url : vide par défaut
> * mimetype : champ fileInfo.mimetype renvoyé à l’étape précédente
> * meta : champ fileInfo.meta renvoyé à l’étape précédente
> * storageId : champ id renvoyé à la première étape
>
> Exemple de données de requête :
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```