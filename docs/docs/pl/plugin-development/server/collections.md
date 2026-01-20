:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kolekcje

W kontekście tworzenia wtyczek NocoBase, **kolekcja (tabela danych)** jest jedną z kluczowych koncepcji. Mogą Państwo dodawać lub modyfikować struktury tabel danych we wtyczkach, definiując lub rozszerzając kolekcje. W przeciwieństwie do tabel danych tworzonych za pośrednictwem interfejsu zarządzania źródłami danych, **kolekcje definiowane w kodzie są zazwyczaj tabelami metadanych na poziomie systemu** i nie pojawiają się na liście zarządzania źródłami danych.

## Definiowanie kolekcji

Zgodnie z konwencjonalną strukturą katalogów, pliki kolekcji powinny znajdować się w katalogu `./src/server/collections`. Do tworzenia nowych tabel używa się funkcji `defineCollection()`, a do rozszerzania istniejących tabel – `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Przykładowe artykuły',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Tytuł', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Treść' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

W powyższym przykładzie:

- `name`: Nazwa tabeli (w bazie danych automatycznie zostanie wygenerowana tabela o tej samej nazwie).
- `title`: Nazwa wyświetlana tej tabeli w interfejsie.
- `fields`: Kolekcja pól, gdzie każde pole zawiera atrybuty takie jak `type`, `name` itd.

Gdy zachodzi potrzeba dodania pól lub modyfikacji konfiguracji dla kolekcji innych wtyczek, można użyć funkcji `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Po aktywacji wtyczki system automatycznie doda pole `isPublished` do istniejącej tabeli `articles`.

:::tip
Konwencjonalna struktura katalogów zostanie załadowana przed wykonaniem wszystkich metod `load()` wtyczek, co pozwala uniknąć problemów z zależnościami wynikających z niezładowania niektórych tabel danych.
:::

## Synchronizacja struktury bazy danych

Przy pierwszej aktywacji wtyczki system automatycznie synchronizuje konfiguracje kolekcji ze strukturą bazy danych. Jeśli wtyczka jest już zainstalowana i działa, po dodaniu lub zmodyfikowaniu kolekcji należy ręcznie wykonać polecenie aktualizacji:

```bash
yarn nocobase upgrade
```

W przypadku wystąpienia błędów lub nieprawidłowych danych podczas synchronizacji, można odbudować strukturę tabeli poprzez ponowną instalację aplikacji:

```bash
yarn nocobase install -f
```

## Automatyczne generowanie zasobów (Resource)

Po zdefiniowaniu kolekcji system automatycznie generuje dla niej odpowiadający zasób (Resource), na którym można bezpośrednio wykonywać operacje CRUD za pośrednictwem API. Szczegóły znajdą Państwo w [Zarządzaniu zasobami](./resource-manager.md).