:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/file-manager/development/index).
:::

# Développement d'extensions

## Étendre les moteurs de stockage

### Côté serveur

1. **Hériter de `StorageType`**
   
   Créez une nouvelle classe et implémentez les méthodes `make()` et `delete()`. Si nécessaire, surchargez des hooks tels que `getFileURL()`, `getFileStream()` ou `getFileData()`.

Exemple :

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4. **Enregistrer le nouveau type**  
   Injectez la nouvelle implémentation de stockage dans le cycle de vie `beforeLoad` ou `load` du plugin :

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

Après l'enregistrement, la configuration du stockage apparaîtra dans la ressource `storages`, tout comme les types intégrés. La configuration fournie par `StorageType.defaults()` peut être utilisée pour pré-remplir les formulaires ou initialiser des enregistrements par défaut.

<!--
### Configuration côté client et interface de gestion
Côté client, vous devez informer le gestionnaire de fichiers de la manière de rendre le formulaire de configuration et de l'existence d'une logique de téléversement personnalisée. Chaque objet de type de stockage contient les propriétés suivantes :
-->

## Étendre les types de fichiers front-end

Pour les fichiers déjà téléversés, vous pouvez afficher différents contenus de prévisualisation dans l'interface front-end en fonction du type de fichier. Le champ de pièce jointe du gestionnaire de fichiers intègre une prévisualisation de fichiers basée sur le navigateur (intégrée dans un iframe), ce qui permet de visualiser directement la plupart des formats (images, vidéos, audio, PDF, etc.) dans le navigateur. Lorsque le format n'est pas pris en charge par le navigateur ou que des interactions spécifiques sont nécessaires, vous pouvez étendre le composant de prévisualisation basé sur le type de fichier.

### Exemple

Par exemple, si vous souhaitez intégrer une prévisualisation en ligne personnalisée pour les fichiers Office, vous pouvez utiliser le code suivant :

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

Ici, `filePreviewTypes` est l'objet d'entrée fourni par `@nocobase/plugin-file-manager/client` pour étendre les prévisualisations de fichiers. Utilisez sa méthode `add` pour ajouter un objet de description de type de fichier.

Chaque type de fichier doit implémenter une méthode `match()` pour vérifier si le type répond aux exigences. Dans l'exemple, `matchMimetype` est utilisé pour vérifier l'attribut `mimetype` du fichier. S'il correspond au type `docx`, il est considéré comme le type à traiter. Si aucune correspondance n'est trouvée, le traitement intégré sera utilisé.

La propriété `Previewer` de l'objet de description de type est le composant utilisé pour la prévisualisation. Lorsque le type de fichier correspond, ce composant est rendu dans la boîte de dialogue de prévisualisation. Vous pouvez retourner n'importe quelle vue React (par exemple un iframe, un lecteur ou un graphique).

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` est une instance globale, importée depuis `@nocobase/plugin-file-manager/client` :

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Enregistre un nouvel objet de description de type de fichier auprès du registre des types de fichiers. Le type de l'objet de description est `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Méthode de correspondance du format de fichier.

Le paramètre d'entrée `file` est l'objet de données d'un fichier téléversé, contenant des propriétés pertinentes qui peuvent être utilisées pour la vérification de type :

* `mimetype` : description du mimetype
* `extname` : extension du fichier, incluant le "."
* `path` : chemin de stockage relatif du fichier
* `url` : URL du fichier

Retourne une valeur de type `boolean` indiquant si la correspondance a réussi.

##### `getThumbnailURL`

Renvoie l'URL de la miniature utilisée dans la liste de fichiers. Si la valeur renvoyée est vide, l'image de remplacement intégrée sera utilisée.

##### `Previewer`

Un composant React pour la prévisualisation des fichiers.

Les props d'entrée sont :

* `file` : l'objet du fichier courant (peut être une URL de type chaîne ou un objet contenant `url`/`preview`)
* `index` : l'index du fichier dans la liste
* `list` : la liste des fichiers