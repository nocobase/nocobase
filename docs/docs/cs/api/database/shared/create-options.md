:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


**Typy**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Podrobnosti**

- `values`: Datový objekt pro záznam, který se má vytvořit.
- `whitelist`: Určuje, která pole v datovém objektu vytvářeného záznamu **lze zapisovat**. Pokud tento parametr nepředáte, je ve výchozím nastavení povoleno zapisovat do všech polí.
- `blacklist`: Určuje, která pole v datovém objektu vytvářeného záznamu **nelze zapisovat**. Pokud tento parametr nepředáte, je ve výchozím nastavení povoleno zapisovat do všech polí.
- `transaction`: Objekt transakce. Pokud nepředáte žádný parametr transakce, tato metoda automaticky vytvoří interní transakci.