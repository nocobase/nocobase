---
title: "Développement d’extensions du gestionnaire de fichiers"
description: "Étendre les composants de prévisualisation des types de fichiers, les champs de pièces jointes et la logique de téléversement, sur la base des API attachmentFileTypes, mime-match, etc."
keywords: "extension du gestionnaire de fichiers, extension des champs de pièces jointes, extension de prévisualisation de fichiers, attachmentFileTypes,NocoBase"
---

# Développement d’extensions

## Types de fichiers côté frontend

Pour les fichiers déjà téléversés, il est possible d’afficher différents contenus de prévisualisation dans l’interface frontend selon le type de fichier. Le champ de pièces jointes du gestionnaire de fichiers intègre une prévisualisation basée sur le navigateur (intégrée dans une iframe), qui prend en charge la prévisualisation directe dans le navigateur de la plupart des formats de fichiers (images, vidéos, fichiers audio et PDF, etc.). Lorsque le format du fichier n’est pas pris en charge par la prévisualisation du navigateur ou que des interactions de prévisualisation particulières sont nécessaires, il est possible de les implémenter en étendant les composants de prévisualisation selon le type de fichier.

### Exemple

Par exemple, pour ajouter un composant de carrousel aux fichiers de type image, vous pouvez utiliser le code suivant :

```ts
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

Ici, `attachmentFileTypes` est l’objet d’entrée fourni par le package `@nocobase/client` pour étendre les types de fichiers. Utilisez sa méthode `add` pour étendre un objet de description de type de fichier.

Chaque type de fichier doit implémenter une méthode `match()`, qui vérifie si le type de fichier répond aux exigences. Dans cet exemple, la méthode fournie par le package `mime-match` vérifie la propriété `mimetype` du fichier. Si elle correspond au type `image/*`, le fichier est considéré comme un type à traiter. En cas d’échec de la correspondance, le traitement est rétrogradé vers le gestionnaire de type intégré.

La propriété `Previewer` de l’objet de description du type est le composant utilisé pour la prévisualisation. Lorsque le type de fichier correspond, ce composant est rendu pour effectuer la prévisualisation. Il est généralement recommandé d’utiliser un composant de type boîte de dialogue comme conteneur de base (par exemple `<Modal />`), puis d’y placer le contenu de prévisualisation et les éléments interactifs nécessaires afin d’implémenter la fonctionnalité de prévisualisation.

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

`attachmentFileTypes` est une instance globale, importée via `@nocobase/client` :

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Enregistre un nouvel objet de description de type de fichier auprès du registre des types de fichiers. Le type de l’objet de description est `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Méthode de correspondance des formats de fichiers.

Le paramètre `file` contient l’objet de données du fichier téléversé et inclut les propriétés pertinentes pouvant être utilisées pour déterminer son type :

* `mimetype` : description du mimetype
* `extname` : extension du fichier, incluant « . »
* `path` : chemin relatif de stockage du fichier
* `url` : URL du fichier

La valeur de retour est de type `boolean` et indique si le fichier correspond.

##### `Previewer`

Composant React utilisé pour prévisualiser le fichier.

Les paramètres Props transmis sont :

* `index` : index du fichier dans la liste des pièces jointes
* `list` : liste des pièces jointes
* `onSwitchIndex` : méthode utilisée pour changer d’index

`onSwitchIndex` peut recevoir n’importe quelle valeur d’index de la liste afin de basculer vers un autre fichier. Si `null` est utilisé comme paramètre de changement, le composant de prévisualisation est directement fermé.

```ts
onSwitchIndex(null);
```
