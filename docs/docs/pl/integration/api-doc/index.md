---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



# Dokumentacja API

## Wprowadzenie

Wtyczka generuje dokumentację API HTTP NocoBase w oparciu o Swagger.

## Instalacja

Jest to wbudowana wtyczka, więc nie wymaga instalacji. Wystarczy ją aktywować, aby zacząć używać.

## Sposób użycia

### Dostęp do strony dokumentacji API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Przegląd dokumentacji

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Całkowita dokumentacja API: `/api/swagger:get`
- Dokumentacja API rdzenia: `/api/swagger:get?ns=core`
- Dokumentacja API wszystkich wtyczek: `/api/swagger:get?ns=plugins`
- Dokumentacja każdej wtyczki: `/api/swagger:get?ns=plugins/{name}`
- Dokumentacja API dla niestandardowych kolekcji: `/api/swagger:get?ns=collections`
- Określone zasoby `${collection}` oraz powiązane z nimi zasoby `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Przewodnik dla programistów

### Jak pisać dokumentację Swagger dla wtyczek

W folderze `src` wtyczki proszę dodać plik `swagger/index.ts` o następującej zawartości:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Szczegółowe zasady tworzenia dokumentacji znajdą Państwo w [oficjalnej dokumentacji Swaggera](https://swagger.io/docs/specification/about/).