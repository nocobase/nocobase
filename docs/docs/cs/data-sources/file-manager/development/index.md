:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vývoj rozšíření

## Rozšíření typů souborů na frontendu

U nahraných souborů může uživatelské rozhraní na frontendu zobrazovat různé náhledy v závislosti na jejich typu. Pole pro přílohy ve správci souborů má vestavěnou funkci náhledu souborů založenou na prohlížeči (vloženou do iframe), která podporuje většinu formátů souborů (jako jsou obrázky, videa, zvukové soubory a PDF) pro přímé zobrazení v prohlížeči. Pokud typ souboru není podporován pro náhled v prohlížeči, nebo pokud potřebujete speciální interaktivní náhled, můžete rozšířit komponenty náhledu na základě typu souboru.

### Příklad

Pokud například chcete rozšířit typ souboru obrázku o komponentu pro přepínání karuselu, můžete použít následující kód:

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

Objekt `attachmentFileTypes` je vstupní bod poskytovaný balíčkem `@nocobase/client` pro rozšíření typů souborů. Pomocí jeho metody `add` můžete rozšířit objekt popisující typ souboru.

Každý typ souboru musí implementovat metodu `match()`, která kontroluje, zda typ souboru splňuje požadavky. V příkladu se pro kontrolu atributu `mimetype` souboru používá metoda z balíčku `mime-match`. Pokud se shoduje s typem `image/*`, je považován za typ souboru, který je třeba zpracovat. Pokud se neshoduje, systém se vrátí k vestavěnému zpracování typu.

Vlastnost `Previewer` na objektu popisujícím typ je komponenta používaná pro náhled. Když se typ souboru shoduje, tato komponenta se vykreslí pro zobrazení náhledu. Obvykle se doporučuje použít komponentu typu modálního okna (např. `<Modal />`) jako základní kontejner a do ní umístit náhled a interaktivní obsah, čímž se implementuje funkce náhledu.

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

`attachmentFileTypes` je globální instance importovaná z balíčku `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registruje nový objekt popisující typ souboru v registru typů souborů. Typ popisného objektu je `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metoda pro shodu formátů souborů.

Vstupní parametr `file` je datový objekt pro nahraný soubor, obsahující relevantní vlastnosti, které lze použít pro určení typu:

*   `mimetype`: Popis mimetype.
*   `extname`: Přípona souboru, včetně tečky „.“.
*   `path`: Relativní cesta k úložišti souboru.
*   `url`: URL souboru.

Vrací hodnotu typu `boolean`, která udává, zda došlo ke shodě.

##### `Previewer`

React komponenta pro náhled souboru.

Parametry Props:

*   `index`: Index souboru v seznamu příloh.
*   `list`: Seznam příloh.
*   `onSwitchIndex`: Metoda pro přepínání indexu.

Funkce `onSwitchIndex` může přijmout libovolnou hodnotu indexu ze seznamu `list` pro přepnutí na jiný soubor. Pokud jako parametr pro přepnutí použijete `null`, komponenta náhledu se přímo zavře.

```ts
onSwitchIndex(null);
```