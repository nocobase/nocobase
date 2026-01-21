:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Développement d'extensions

## Étendre les moteurs de stockage

### Côté serveur

1.  **Hériter de `StorageType`**

    Créez une nouvelle classe et implémentez les méthodes `make()` et `delete()`. Si nécessaire, surchargez les hooks tels que `getFileURL()`, `getFileStream()` ou `getFileData()`.

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

4.  **Enregistrer le nouveau type**
    Injectez la nouvelle implémentation de stockage dans le cycle de vie `beforeLoad` ou `load` de votre plugin :

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

Une fois l'enregistrement terminé, la configuration du stockage apparaîtra dans la ressource `storages`, tout comme les types intégrés. La configuration fournie par `StorageType.defaults()` peut être utilisée pour pré-remplir les formulaires ou initialiser des enregistrements par défaut.

### Configuration côté client et interface de gestion
Côté client, vous devez informer le gestionnaire de fichiers de la manière de rendre le formulaire de configuration et de l'existence d'une logique de téléversement personnalisée. Chaque objet de type de stockage contient les propriétés suivantes :

## Étendre les types de fichiers front-end

Pour les fichiers déjà téléversés, vous pouvez afficher différents contenus de prévisualisation dans l'interface front-end en fonction de leur type. Le champ de pièce jointe du gestionnaire de fichiers intègre une prévisualisation de fichiers basée sur le navigateur (intégrée dans un iframe), ce qui permet de visualiser directement la plupart des formats (images, vidéos, audio, PDF, etc.) dans le navigateur. Si un format de fichier n'est pas pris en charge par la prévisualisation du navigateur, ou si des interactions de prévisualisation spécifiques sont nécessaires, vous pouvez étendre le composant de prévisualisation basé sur le type de fichier.

### Exemple

Par exemple, si vous souhaitez étendre un type de fichier image avec un composant de carrousel, vous pouvez utiliser le code suivant :

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

Ici, `attachmentFileTypes` est l'objet d'entrée fourni dans le package `@nocobase/client` pour étendre les types de fichiers. Utilisez sa méthode `add` pour étendre un objet de description de type de fichier.

Chaque type de fichier doit implémenter une méthode `match()` pour vérifier si le type de fichier répond aux exigences. Dans l'exemple, la méthode fournie par le package `mime-match` est utilisée pour vérifier l'attribut `mimetype` du fichier. Si elle correspond au type `image/*`, il est considéré comme le type de fichier à traiter. Si aucune correspondance n'est trouvée, le traitement par défaut du type intégré sera utilisé.

La propriété `Previewer` de l'objet de description de type est le composant utilisé pour la prévisualisation. Lorsque le type de fichier correspond, ce composant sera rendu pour la prévisualisation. Il est généralement recommandé d'utiliser un composant de type modale (tel que `<Modal />`) comme conteneur de base, puis d'y placer le contenu de prévisualisation et les éléments interactifs pour implémenter la fonctionnalité de prévisualisation.

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` est une instance globale, importée depuis `@nocobase/client` :

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Enregistre un nouvel objet de description de type de fichier auprès du registre des types de fichiers. Le type de l'objet de description est `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Méthode de correspondance du format de fichier.

Le paramètre d'entrée `file` est l'objet de données d'un fichier téléversé, contenant des propriétés pertinentes qui peuvent être utilisées pour la vérification de type :

*   `mimetype` : description du mimetype
*   `extname` : extension du fichier, incluant le "."
*   `path` : chemin de stockage relatif du fichier
*   `url` : URL du fichier

Retourne une valeur de type `boolean` indiquant si la correspondance a réussi.

##### `Previewer`

Un composant React pour la prévisualisation des fichiers.

Les Props d'entrée sont :

*   `index` : L'index du fichier dans la liste des pièces jointes
*   `list` : La liste des pièces jointes
*   `onSwitchIndex` : Une méthode pour changer l'index

La méthode `onSwitchIndex` peut recevoir n'importe quel index de la liste pour basculer vers un autre fichier. Si `null` est passé en argument, le composant de prévisualisation sera directement fermé.

```ts
onSwitchIndex(null);
```