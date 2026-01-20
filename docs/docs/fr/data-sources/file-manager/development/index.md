:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Développement d'extensions

## Extension des types de fichiers front-end

Pour les fichiers que vous avez téléversés, l'interface utilisateur côté client peut afficher différents aperçus en fonction de leur type. Le champ de pièce jointe du gestionnaire de fichiers intègre une fonction d'aperçu basée sur le navigateur (via un iframe), ce qui permet de visualiser directement la plupart des formats (images, vidéos, audio, PDF, etc.). Si un format de fichier n'est pas pris en charge par l'aperçu intégré du navigateur, ou si vous avez besoin d'une interaction d'aperçu spécifique, vous pouvez étendre les composants d'aperçu en fonction du type de fichier.

### Exemple

Par exemple, si vous souhaitez étendre un composant de carrousel pour les fichiers image, vous pouvez utiliser le code suivant :

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

`attachmentFileTypes` est un objet d'entrée fourni par le package `@nocobase/client` pour étendre les types de fichiers. Vous utilisez sa méthode `add` pour ajouter un descripteur de type de fichier.

Chaque type de fichier doit implémenter une méthode `match()` pour vérifier s'il répond aux exigences. Dans l'exemple, la méthode fournie par le package `mime-match` est utilisée pour vérifier l'attribut `mimetype` du fichier. Si le type correspond à `image/*`, il est considéré comme un type de fichier à traiter. Si la correspondance échoue, le système reviendra au traitement de type intégré.

La propriété `Previewer` de l'objet descripteur de type est le composant utilisé pour l'aperçu. Lorsque le type de fichier correspond, ce composant sera rendu pour afficher l'aperçu. Il est généralement recommandé d'utiliser un composant de type modale (comme `<Modal />`) comme conteneur de base, puis d'y placer le contenu de l'aperçu et les éléments interactifs pour implémenter la fonctionnalité d'aperçu.

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

`attachmentFileTypes` est une instance globale que vous importez depuis le package `@nocobase/client` :

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Enregistre un nouveau descripteur de type de fichier auprès du registre des types de fichiers. Le type du descripteur est `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Une méthode pour faire correspondre les formats de fichiers.

Le paramètre `file` est un objet de données pour le fichier téléversé, contenant des propriétés qui peuvent être utilisées pour la vérification du type :

*   `mimetype` : La description du mimetype du fichier.
*   `extname` : L'extension du fichier, incluant le ".".
*   `path` : Le chemin de stockage relatif du fichier.
*   `url` : L'URL du fichier.

Retourne une valeur de type `boolean`, indiquant le résultat de la correspondance.

##### `Previewer`

Un composant React pour prévisualiser le fichier.

Les propriétés (Props) sont :

*   `index` : L'index du fichier dans la liste des pièces jointes.
*   `list` : La liste des pièces jointes.
*   `onSwitchIndex` : Une fonction pour changer l'index du fichier prévisualisé.

La fonction `onSwitchIndex` peut être appelée avec n'importe quel index de la `list` pour passer à un autre fichier. Si vous l'appelez avec `null` comme paramètre, le composant d'aperçu sera directement fermé.

```ts
onSwitchIndex(null);
```