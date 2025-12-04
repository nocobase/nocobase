:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Události

Server NocoBase spouští odpovídající události během životního cyklu aplikace, životního cyklu pluginů a databázových operací. Vývojáři pluginů mohou tyto události poslouchat a implementovat tak rozšiřující logiku, automatizované operace nebo vlastní chování.

Systém událostí NocoBase je rozdělen především do dvou úrovní:

- **`app.on()` – Události na úrovni aplikace**: Poslouchejte události životního cyklu aplikace, jako je spuštění, instalace, povolení pluginů atd.
- **`db.on()` – Události na úrovni databáze**: Poslouchejte události operací na úrovni datového modelu, jako je vytváření, aktualizace, mazání záznamů atd.

Obě úrovně dědí z `EventEmitter` Node.js a podporují standardní rozhraní `.on()`, `.off()` a `.emit()`. NocoBase navíc rozšiřuje podporu o `emitAsync`, který slouží k asynchronnímu spouštění událostí a čekání na dokončení všech posluchačů.

## Kde registrovat posluchače událostí

Posluchače událostí byste měli obecně registrovat v metodě `beforeLoad()` vašeho pluginu. Tím zajistíte, že události budou připraveny již během fáze načítání pluginu a následná logika na ně bude moci správně reagovat.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Poslouchání událostí aplikace
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase byl spuštěn');
    });

    // Poslouchání databázových událostí
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nový příspěvek: ${model.get('title')}`);
      }
    });
  }
}
```

## Poslouchání událostí aplikace `app.on()`

Události aplikace slouží k zachycení změn životního cyklu aplikace NocoBase a jejích pluginů. Jsou vhodné pro inicializační logiku, registraci zdrojů nebo detekci závislostí pluginů.

### Běžné typy událostí

| Název události                  | Kdy se spustí                      | Typické použití                                     |
|-------------------------------|------------------------------------|-----------------------------------------------------|
| `beforeLoad` / `afterLoad`    | Před / po načtení aplikace         | Registrace zdrojů, inicializace konfigurace         |
| `beforeStart` / `afterStart`  | Před / po spuštění služby          | Spuštění úloh, tisk spouštěcích logů                |
| `beforeInstall` / `afterInstall` | Před / po instalaci aplikace       | Inicializace dat, import šablon                     |
| `beforeStop` / `afterStop`    | Před / po zastavení služby         | Vyčištění zdrojů, uložení stavu                     |
| `beforeDestroy` / `afterDestroy` | Před / po zničení aplikace         | Smazání cache, odpojení připojení                   |
| `beforeLoadPlugin` / `afterLoadPlugin` | Před / po načtení pluginu          | Úprava konfigurace pluginu nebo rozšíření funkcionality |
| `beforeEnablePlugin` / `afterEnablePlugin` | Před / po povolení pluginu         | Kontrola závislostí, inicializace logiky pluginu    |
| `beforeDisablePlugin` / `afterDisablePlugin` | Před / po zakázání pluginu         | Vyčištění zdrojů pluginu                            |
| `afterUpgrade`                | Po dokončení aktualizace aplikace  | Provedení migrace dat nebo oprav kompatibility      |

Příklad: Poslouchání události spuštění aplikace

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Služba NocoBase byla spuštěna!');
});
```

Příklad: Poslouchání události načtení pluginu

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} byl načten`);
});
```

## Poslouchání databázových událostí `db.on()`

Databázové události mohou zachytit různé změny dat na úrovni modelu. Jsou vhodné pro auditování, synchronizaci, automatické vyplňování a další operace.

### Běžné typy událostí

| Název události                                          | Kdy se spustí                                   |
|-------------------------------------------------------|-------------------------------------------------|
| `beforeSync` / `afterSync`                            | Před / po synchronizaci databázové struktury    |
| `beforeValidate` / `afterValidate`                    | Před / po validaci dat                          |
| `beforeCreate` / `afterCreate`                        | Před / po vytvoření záznamů                     |
| `beforeUpdate` / `afterUpdate`                        | Před / po aktualizaci záznamů                   |
| `beforeSave` / `afterSave`                            | Před / po uložení (zahrnuje vytvoření a aktualizaci) |
| `beforeDestroy` / `afterDestroy`                      | Před / po smazání záznamů                       |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Po operacích zahrnujících asociovaná data       |
| `beforeDefineCollection` / `afterDefineCollection`    | Před / po definování kolekcí                    |
| `beforeRemoveCollection` / `afterRemoveCollection`    | Před / po odstranění kolekcí                    |

Příklad: Poslouchání události po vytvoření dat

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data byla vytvořena!');
});
```

Příklad: Poslouchání události před aktualizací dat

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data budou aktualizována!');
});
```