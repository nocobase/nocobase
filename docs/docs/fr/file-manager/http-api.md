:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# API HTTP

Les téléversements de fichiers pour les champs de pièce jointe et les collections de fichiers sont tous deux pris en charge via l'API HTTP. La méthode d'appel diffère selon le moteur de stockage utilisé par le champ de pièce jointe ou la collection de fichiers.

## Téléversement côté serveur

Pour les moteurs de stockage open-source intégrés au projet, tels que S3, OSS et COS, l'appel de l'API HTTP est identique à la fonction de téléversement de l'interface utilisateur, et les fichiers sont téléversés via le serveur. L'appel de l'API nécessite de transmettre un jeton JWT basé sur la connexion de l'utilisateur via l'en-tête de requête `Authorization` ; sans cela, l'accès sera refusé.

### Champ de pièce jointe

Lancez une opération `create` sur la ressource `attachments` (la collection des pièces jointes), envoyez une requête POST et téléversez le contenu binaire via le champ `file`. Après l'appel, le fichier sera téléversé vers le moteur de stockage par défaut.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Pour téléverser un fichier vers un moteur de stockage différent, vous pouvez utiliser le paramètre `attachmentField` afin de spécifier le moteur de stockage configuré pour le champ de la collection (s'il n'est pas configuré, le fichier sera téléversé vers le moteur de stockage par défaut).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Collection de fichiers

Le téléversement vers une collection de fichiers générera automatiquement un enregistrement de fichier. Lancez une opération `create` sur la ressource de la collection de fichiers, envoyez une requête POST et téléversez le contenu binaire via le champ `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Lors du téléversement vers une collection de fichiers, il n'est pas nécessaire de spécifier un moteur de stockage ; le fichier sera téléversé vers le moteur de stockage configuré pour cette collection.

## Téléversement côté client

Pour les moteurs de stockage compatibles S3 fournis via le plugin commercial S3-Pro, le téléversement via l'API HTTP doit être effectué en plusieurs étapes.

### Champ de pièce jointe

1.  Récupérer les informations du moteur de stockage

    Lancez une opération `getBasicInfo` sur la collection `storages` (les stockages), en incluant l'identifiant de l'espace de stockage (`storage name`), pour demander les informations de configuration du moteur de stockage.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exemple d'informations de configuration du moteur de stockage retournées :

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Récupérer les informations de pré-signature du fournisseur de services

    Lancez une opération `createPresignedUrl` sur la ressource `fileStorageS3`, envoyez une requête POST et incluez les informations relatives au fichier dans le corps de la requête pour obtenir les informations de téléversement pré-signées.

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
    > * name : Nom du fichier
    > * size : Taille du fichier (en octets)
    > * type : Type MIME du fichier. Vous pouvez consulter : [Types MIME courants](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId : L'ID du moteur de stockage (le champ `id` retourné à la première étape)
    > * storageType : Le type du moteur de stockage (le champ `type` retourné à la première étape)
    > 
    > Exemple de données de requête :
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La structure des données des informations pré-signées obtenues est la suivante :

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

3.  Téléversement du fichier

    Utilisez l'URL `putUrl` retournée pour lancer une requête `PUT` et téléversez le fichier en tant que corps de la requête.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Remarque :
    > * putUrl : Le champ `putUrl` retourné à l'étape précédente
    > * file_path : Le chemin local du fichier à téléverser
    > 
    > Exemple de données de requête :
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Créer un enregistrement de fichier

    Après un téléversement réussi, lancez une opération `create` sur la ressource `attachments` (la collection des pièces jointes) en envoyant une requête POST pour créer l'enregistrement du fichier.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Description des données dépendantes dans `data-raw` :
    > * title : Le champ `fileInfo.title` retourné à l'étape précédente
    > * filename : Le champ `fileInfo.key` retourné à l'étape précédente
    > * extname : Le champ `fileInfo.extname` retourné à l'étape précédente
    > * path : Vide par défaut
    > * size : Le champ `fileInfo.size` retourné à l'étape précédente
    > * url : Vide par défaut
    > * mimetype : Le champ `fileInfo.mimetype` retourné à l'étape précédente
    > * meta : Le champ `fileInfo.meta` retourné à l'étape précédente
    > * storageId : Le champ `id` retourné à la première étape
    > 
    > Exemple de données de requête :
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Collection de fichiers

Les trois premières étapes sont identiques à celles du téléversement pour les champs de pièce jointe, mais à la quatrième étape, vous devez créer un enregistrement de fichier en lançant une opération `create` sur la ressource de la collection de fichiers, en envoyant une requête POST et en téléversant les informations du fichier via le corps de la requête.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Description des données dépendantes dans `data-raw` :
> * title : Le champ `fileInfo.title` retourné à l'étape précédente
> * filename : Le champ `fileInfo.key` retourné à l'étape précédente
> * extname : Le champ `fileInfo.extname` retourné à l'étape précédente
> * path : Vide par défaut
> * size : Le champ `fileInfo.size` retourné à l'étape précédente
> * url : Vide par défaut
> * mimetype : Le champ `fileInfo.mimetype` retourné à l'étape précédente
> * meta : Le champ `fileInfo.meta` retourné à l'étape précédente
> * storageId : Le champ `id` retourné à la première étape
> 
> Exemple de données de requête :
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```