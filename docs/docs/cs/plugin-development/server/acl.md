:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Řízení oprávnění ACL

ACL (Access Control List) slouží k řízení oprávnění pro operace s prostředky. Oprávnění můžete přidělit rolím, nebo je přímo omezit bez ohledu na role. Systém ACL nabízí flexibilní mechanismus správy oprávnění, který podporuje fragmenty oprávnění (snippets), middleware, podmíněné posuzování a další metody.

:::tip Poznámka

Objekty ACL náleží ke zdrojům dat (`dataSource.acl`). K ACL hlavního zdroje dat se dostanete rychle přes `app.acl`. Podrobnosti o používání ACL pro jiné zdroje dat naleznete v kapitole [Správa zdrojů dat](./data-source-manager.md).

:::

## Registrace fragmentů oprávnění (Snippet)

Fragmenty oprávnění (Snippets) umožňují registrovat často používané kombinace oprávnění jako znovupoužitelné jednotky. Jakmile je role svázána se snippetem, získá odpovídající sadu oprávnění, což snižuje duplicitní konfiguraci a zvyšuje efektivitu správy oprávnění.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Prefix ui.* označuje oprávnění, která lze konfigurovat v uživatelském rozhraní
  actions: ['customRequests:*'], // Odpovídající operace s prostředky, podporuje zástupné znaky
});
```

## Oprávnění, která obcházejí omezení rolí (allow)

`acl.allow()` slouží k povolení určitých operací obejít omezení rolí. Hodí se pro veřejná API, scénáře vyžadující dynamické posuzování oprávnění nebo případy, kdy je potřeba posoudit oprávnění na základě kontextu požadavku.

```ts
// Veřejný přístup, není vyžadováno přihlášení
acl.allow('app', 'getLang', 'public');

// Přístupné pouze přihlášeným uživatelům
acl.allow('app', 'getInfo', 'loggedIn');

// Na základě vlastní podmínky
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Popis parametru `condition`:**

- `'public'`:`: Jakýkoli uživatel (včetně nepřihlášených) má přístup bez jakékoli autentizace.`
- `'loggedIn'`:`: Přístup mají pouze přihlášení uživatelé, vyžaduje platnou uživatelskou identitu.`
- `(ctx) => Promise<boolean>` nebo `(ctx) => boolean`:`: Vlastní funkce, která dynamicky určuje, zda je přístup povolen na základě kontextu požadavku. Může implementovat složitou logiku oprávnění.`

## Registrace middleware pro oprávnění (use)

`acl.use()` slouží k registraci vlastního middleware pro oprávnění, což umožňuje vložit vlastní logiku do procesu kontroly oprávnění. Obvykle se používá společně s `ctx.permission` pro definování vlastních pravidel oprávnění. Je vhodný pro scénáře vyžadující nekonvenční řízení oprávnění, například veřejné formuláře vyžadující vlastní ověření heslem, dynamické posuzování oprávnění na základě parametrů požadavku atd.

**Typické aplikační scénáře:**

- Scénáře veřejných formulářů: Žádný uživatel, žádná role, ale oprávnění je třeba omezit pomocí vlastních hesel.
- Řízení oprávnění na základě parametrů požadavku, IP adres a dalších podmínek.
- Vlastní pravidla oprávnění, která přeskočí nebo upraví výchozí proces kontroly oprávnění.

**Řízení oprávnění pomocí `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Příklad: Veřejný formulář vyžaduje ověření hesla pro přeskočení kontroly oprávnění
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Ověření proběhlo úspěšně, přeskočit kontrolu oprávnění
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Provést kontrolu oprávnění (pokračovat v procesu ACL)
  await next();
});
```

**Popis vlastností `ctx.permission`:**

- `skip: true`:`: Přeskočí následné kontroly oprávnění ACL a přímo povolí přístup.`
- `Lze dynamicky nastavit v middleware na základě vlastní logiky pro dosažení flexibilního řízení oprávnění.`

## Přidání pevných datových omezení pro specifické operace (addFixedParams)

`addFixedParams` umožňuje přidat pevné omezení rozsahu dat (filtr) k operacím s určitými prostředky. Tato omezení obcházejí omezení rolí a jsou aplikována přímo, obvykle se používají k ochraně kritických systémových dat.

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

// I když má uživatel oprávnění k mazání rolí, nemůže odstranit systémové role jako root, admin, member.
```

> **Tip:** `addFixedParams` lze použít k zabránění náhodnému smazání nebo úpravě citlivých dat, jako jsou systémové vestavěné role, administrátorské účty atd. Tato omezení se sčítají s oprávněními rolí a zajišťují, že i s oprávněním nelze manipulovat s chráněnými daty.

## Kontrola oprávnění (can)

`acl.can()` slouží k ověření, zda má daná role oprávnění provést specifikovanou operaci, a vrací objekt s výsledkem oprávnění nebo `null`. Běžně se používá v obchodní logice pro dynamické posuzování oprávnění, například v middleware nebo handlerech operací, kde se na základě rolí rozhoduje, zda je povoleno provést určité akce.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Lze předat jednu roli nebo pole rolí
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Role ${result.role} může provést operaci ${result.action}`);
  // result.params obsahuje pevné parametry nastavené pomocí addFixedParams
  console.log('Pevné parametry:', result.params);
} else {
  console.log('Nemáte oprávnění provést tuto operaci');
}
```

> **Tip:** Pokud předáte více rolí, každá role bude zkontrolována postupně a vrátí se výsledek pro první roli, která má oprávnění.

**Definice typů:**

```ts
interface CanArgs {
  role?: string;      // Jedna role
  roles?: string[];   // Více rolí (kontrolováno postupně, vrací první roli s oprávněním)
  resource: string;   // Název prostředku
  action: string;    // Název operace
}

interface CanResult {
  role: string;       // Role s oprávněním
  resource: string;   // Název prostředku
  action: string;    // Název operace
  params?: any;       // Informace o pevných parametrech (pokud byly nastaveny pomocí addFixedParams)
}
```

## Registrace konfigurovatelných operací (setAvailableAction)

Pokud chcete, aby vlastní operace byly konfigurovatelné v uživatelském rozhraní (například zobrazené na stránce správy rolí), musíte je zaregistrovat pomocí `setAvailableAction`. Zaregistrované operace se objeví v rozhraní pro konfiguraci oprávnění, kde administrátoři mohou nastavit oprávnění pro různé role.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Zobrazovaný název v rozhraní, podporuje internacionalizaci
  type: 'new-data',               // Typ operace
  onNewRecord: true,              // Zda se projeví při vytváření nových záznamů
});
```

**Popis parametrů:**

- **displayName**:`: Název zobrazený v rozhraní pro konfiguraci oprávnění, podporuje internacionalizaci (používá formát `{{t("key")}}`).`
- **type**:`: Typ operace, který určuje klasifikaci této operace v konfiguraci oprávnění.`
  - `'new-data'`:`: Operace, které vytvářejí nová data (např. import, přidání atd.).`
  - `'existing-data'`:`: Operace, které upravují existující data (např. aktualizace, smazání atd.).`
- **onNewRecord**:`: Zda se projeví při vytváření nových záznamů, platné pouze pro typ `'new-data'`.`

Po registraci se tato operace objeví v rozhraní pro konfiguraci oprávnění, kde administrátoři mohou nastavit oprávnění pro tuto operaci na stránce správy rolí.