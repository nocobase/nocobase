:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kontrola uprawnień ACL

ACL (Access Control List) służy do kontrolowania uprawnień do operacji na zasobach. Mogą Państwo przypisywać uprawnienia do ról, a także pomijać ograniczenia ról i bezpośrednio je definiować. System ACL oferuje elastyczny mechanizm zarządzania uprawnieniami, wspierający fragmenty uprawnień (snippets), middleware, warunkowe sprawdzanie i wiele innych metod.

:::tip Wskazówka

Obiekty ACL należą do źródła danych (`dataSource.acl`). Do ACL głównego źródła danych można szybko uzyskać dostęp poprzez `app.acl`. Sposób użycia ACL dla innych źródeł danych został szczegółowo opisany w rozdziale [Zarządzanie źródłami danych](./data-source-manager.md).

:::

## Rejestrowanie fragmentów uprawnień (Snippet)

Fragmenty uprawnień (Snippets) pozwalają na rejestrowanie często używanych kombinacji uprawnień jako jednostek wielokrotnego użytku. Po przypisaniu fragmentu do roli, rola otrzymuje odpowiedni zestaw uprawnień, co redukuje powtarzalność konfiguracji i zwiększa efektywność zarządzania uprawnieniami.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Prefiks ui.* oznacza uprawnienia, które można konfigurować w interfejsie użytkownika
  actions: ['customRequests:*'], // Odpowiednie operacje na zasobach, obsługuje symbole wieloznaczne
});
```

## Uprawnienia pomijające ograniczenia ról (allow)

`acl.allow()` służy do zezwalania na wykonywanie pewnych operacji z pominięciem ograniczeń ról. Jest to przydatne w przypadku publicznych API, scenariuszy wymagających dynamicznego sprawdzania uprawnień lub sytuacji, gdy ocena uprawnień musi być oparta na kontekście żądania.

```ts
// Dostęp publiczny, logowanie nie jest wymagane
acl.allow('app', 'getLang', 'public');

// Dostępne dla zalogowanych użytkowników
acl.allow('app', 'getInfo', 'loggedIn');

// Na podstawie niestandardowego warunku
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Opis parametru `condition`:**

- `'public'`: Każdy użytkownik (w tym niezalogowany) może uzyskać dostęp bez żadnego uwierzytelniania.
- `'loggedIn'`: Dostęp mają tylko zalogowani użytkownicy, wymagana jest ważna tożsamość użytkownika.
- `(ctx) => Promise<boolean>` lub `(ctx) => boolean`: Niestandardowa funkcja, która dynamicznie określa, czy dostęp jest dozwolony na podstawie kontekstu żądania. Pozwala to na implementację złożonej logiki uprawnień.

## Rejestrowanie middleware uprawnień (use)

`acl.use()` służy do rejestrowania niestandardowego middleware uprawnień, co pozwala na wstawianie własnej logiki do procesu sprawdzania uprawnień. Zazwyczaj używa się go w połączeniu z `ctx.permission` do definiowania niestandardowych reguł uprawnień. Jest to przydatne w scenariuszach wymagających niestandardowej kontroli uprawnień, takich jak publiczne formularze wymagające weryfikacji hasłem lub dynamiczne sprawdzanie uprawnień na podstawie parametrów żądania.

**Typowe scenariusze zastosowania:**

- Scenariusze z publicznymi formularzami: brak użytkownika, brak roli, ale uprawnienia muszą być ograniczone niestandardowym hasłem.
- Kontrola uprawnień oparta na parametrach żądania, adresach IP i innych warunkach.
- Niestandardowe reguły uprawnień, pomijające lub modyfikujące domyślny proces sprawdzania uprawnień.

**Kontrola uprawnień za pomocą `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Przykład: Publiczny formularz wymaga weryfikacji hasłem, aby pominąć sprawdzanie uprawnień
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Weryfikacja zakończona pomyślnie, pomiń sprawdzanie uprawnień
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Wykonaj sprawdzanie uprawnień (kontynuuj proces ACL)
  await next();
});
```

**Opis właściwości `ctx.permission`:**

- `skip: true`: Pomija kolejne sprawdzanie uprawnień ACL i bezpośrednio zezwala na dostęp.
- Może być dynamicznie ustawiane w middleware na podstawie niestandardowej logiki, co pozwala na elastyczną kontrolę uprawnień.

## Dodawanie stałych ograniczeń danych dla określonych operacji (addFixedParams)

`addFixedParams` pozwala na dodawanie stałych ograniczeń zakresu danych (filtru) do operacji na niektórych zasobach. Ograniczenia te są stosowane bezpośrednio, z pominięciem ról, i zazwyczaj służą do ochrony krytycznych danych systemowych.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Nawet jeśli użytkownik ma uprawnienia do usuwania ról, nie będzie mógł usunąć ról systemowych, takich jak root, admin czy member.
```

> **Wskazówka:** `addFixedParams` może być używane do zapobiegania przypadkowemu usunięciu lub modyfikacji wrażliwych danych, takich jak wbudowane role systemowe czy konta administratorów. Ograniczenia te działają w połączeniu z uprawnieniami ról, zapewniając, że nawet posiadając uprawnienia, nie można manipulować chronionymi danymi.

## Sprawdzanie uprawnień (can)

`acl.can()` służy do sprawdzania, czy dana rola ma uprawnienia do wykonania określonej operacji. Zwraca obiekt z wynikiem uprawnień lub `null`. Jest często używane do dynamicznego sprawdzania uprawnień w logice biznesowej, na przykład w middleware lub handlerach operacji, aby na podstawie roli decydować, czy zezwolić na wykonanie pewnych działań.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Można przekazać pojedynczą rolę lub tablicę ról
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Rola ${result.role} może wykonać operację ${result.action}`);
  // result.params zawiera stałe parametry ustawione za pomocą addFixedParams
  console.log('Stałe parametry:', result.params);
} else {
  console.log('Brak uprawnień do wykonania tej operacji');
}
```

> **Wskazówka:** Jeśli zostanie przekazanych wiele ról, każda rola zostanie sprawdzona sekwencyjnie, a zwrócony zostanie wynik dla pierwszej roli, która posiada uprawnienia.

**Definicje typów:**

```ts
interface CanArgs {
  role?: string;      // Pojedyncza rola
  roles?: string[];   // Wiele ról (sprawdzane sekwencyjnie, zwraca pierwszą rolę z uprawnieniami)
  resource: string;   // Nazwa zasobu
  action: string;    // Nazwa operacji
}

interface CanResult {
  role: string;       // Rola z uprawnieniami
  resource: string;   // Nazwa zasobu
  action: string;    // Nazwa operacji
  params?: any;       // Informacje o stałych parametrach (jeśli zostały ustawione za pomocą addFixedParams)
}
```

## Rejestrowanie konfigurowalnych operacji (setAvailableAction)

Jeśli chcą Państwo, aby niestandardowe operacje mogły być konfigurowane w interfejsie użytkownika (np. wyświetlane na stronie zarządzania rolami), należy je zarejestrować za pomocą `setAvailableAction`. Zarejestrowane operacje pojawią się w interfejsie konfiguracji uprawnień, gdzie administratorzy mogą ustawiać uprawnienia operacji dla różnych ról.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nazwa wyświetlana w interfejsie, obsługuje internacjonalizację
  type: 'new-data',               // Typ operacji
  onNewRecord: true,              // Czy ma obowiązywać przy tworzeniu nowych rekordów
});
```

**Opis parametrów:**

- **displayName**: Nazwa wyświetlana w interfejsie konfiguracji uprawnień, obsługuje internacjonalizację (używa formatu `{{t("key")}}`).
- **type**: Typ operacji, który określa jej klasyfikację w konfiguracji uprawnień.
  - `'new-data'`: Operacje tworzące nowe dane (np. import, dodawanie itp.).
  - `'existing-data'`: Operacje modyfikujące istniejące dane (np. aktualizacja, usuwanie itp.).
- **onNewRecord**: Czy ma obowiązywać przy tworzeniu nowych rekordów, ważne tylko dla typu `'new-data'`.

Po rejestracji, ta operacja pojawi się w interfejsie konfiguracji uprawnień, a administratorzy będą mogli konfigurować uprawnienia dla tej operacji na stronie zarządzania rolami.