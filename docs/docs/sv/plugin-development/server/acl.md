:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# ACL-behörighetskontroll

ACL (Access Control List) används för att kontrollera behörigheter för resursoperationer. Ni kan tilldela behörigheter till roller, eller kringgå rollbegränsningar och direkt styra behörigheterna. ACL-systemet erbjuder en flexibel mekanism för behörighetshantering, som stöder behörighetssnuttar, middleware, villkorsbedömning och andra metoder.

:::tip Observera

ACL-objekt tillhör datakällor (`dataSource.acl`). Huvuddatakällans ACL kan snabbt nås via `app.acl`. För användning av ACL för andra datakällor, se kapitlet [Hantering av datakällor](./data-source-manager.md).

:::

## Registrera behörighetssnuttar (Snippet)

Behörighetssnuttar (Snippet) kan registrera vanligt förekommande behörighetskombinationer som återanvändbara behörighetsenheter. När en roll är kopplad till en snutt får den motsvarande uppsättning behörigheter, vilket minskar dubbelkonfiguration och förbättrar effektiviteten i behörighetshanteringen.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.*-prefixet indikerar behörigheter som kan konfigureras i gränssnittet
  actions: ['customRequests:*'], // Motsvarande resursoperationer, stöder jokertecken
});
```

## Behörigheter som kringgår rollbegränsningar (allow)

`acl.allow()` används för att tillåta vissa operationer att kringgå rollbegränsningar. Detta är lämpligt för offentliga API:er, scenarier som kräver dynamisk behörighetsbedömning, eller när behörighetsbedömningen behöver baseras på begärans kontext.

```ts
// Offentlig åtkomst, ingen inloggning krävs
acl.allow('app', 'getLang', 'public');

// Tillgänglig för inloggade användare
acl.allow('app', 'getInfo', 'loggedIn');

// Baserat på ett anpassat villkor
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Beskrivning av parametern condition:**

- `'public'` : Alla användare (inklusive oinloggade) kan komma åt, ingen autentisering krävs.
- `'loggedIn'` : Endast inloggade användare kan komma åt, kräver en giltig användaridentitet.
- `(ctx) => Promise<boolean>` eller `(ctx) => boolean` : Anpassad funktion som dynamiskt avgör om åtkomst är tillåten baserat på begärans kontext. Kan implementera komplex behörighetslogik.

## Registrera behörighets-middleware (use)

`acl.use()` används för att registrera anpassad behörighets-middleware, vilket gör det möjligt att infoga anpassad logik i behörighetskontrollflödet. Detta används vanligtvis tillsammans med `ctx.permission` för att definiera anpassade behörighetsregler. Det är lämpligt för scenarier som kräver ovanlig behörighetskontroll, till exempel offentliga formulär som behöver anpassad lösenordsverifiering, dynamiska behörighetskontroller baserade på begäransparametrar, med mera.

**Typiska användningsscenarier:**

- Offentliga formulärscenarier: Ingen användare, ingen roll, men behörigheter måste begränsas via anpassade lösenord.
- Behörighetskontroll baserad på begäransparametrar, IP-adresser och andra villkor.
- Anpassade behörighetsregler, som kringgår eller modifierar standardflödet för behörighetskontroll.

**Kontrollera behörigheter via `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Exempel: Offentligt formulär kräver lösenordsverifiering för att kringgå behörighetskontroll
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verifiering godkänd, kringgå behörighetskontroll
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Utför behörighetskontroll (fortsätt ACL-flödet)
  await next();
});
```

**Beskrivning av egenskapen `ctx.permission`:**

- `skip: true` : Kringgå efterföljande ACL-behörighetskontroller och tillåt direkt åtkomst.
- Kan ställas in dynamiskt i middleware baserat på anpassad logik för att uppnå flexibel behörighetskontroll.

## Lägg till fasta databegränsningar för specifika operationer (addFixedParams)

`addFixedParams` kan lägga till fasta databegränsningar (filter) för vissa resursoperationer. Dessa begränsningar kringgår rollbegränsningar och tillämpas direkt, och används vanligtvis för att skydda kritiska systemdata.

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

// Även om en användare har behörighet att radera roller, kan de inte radera systemroller som root, admin, member.
```

> **Tips:** `addFixedParams` kan användas för att förhindra att känslig data raderas eller modifieras av misstag, såsom systeminbyggda roller, administratörskonton etc. Dessa begränsningar verkar i kombination med rollbehörigheter, vilket säkerställer att även med behörigheter kan skyddad data inte manipuleras.

## Kontrollera behörigheter (can)

`acl.can()` används för att avgöra om en roll har behörighet att utföra en specificerad operation, och returnerar ett behörighetsresultatobjekt eller `null`. Detta används ofta för att dynamiskt kontrollera behörigheter i affärslogiken, till exempel i middleware eller operationens handler för att avgöra om vissa operationer är tillåtna baserat på roller.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Kan skicka en enskild roll eller en array av roller
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Rollen ${result.role} kan utföra operationen ${result.action}`);
  // result.params innehåller fasta parametrar som ställts in via addFixedParams
  console.log('Fasta parametrar:', result.params);
} else {
  console.log('Ingen behörighet att utföra denna operation');
}
```

> **Tips:** Om flera roller skickas in, kontrolleras varje roll sekventiellt, och resultatet för den första rollen som har behörighet returneras.

**Typdefinitioner:**

```ts
interface CanArgs {
  role?: string;      // Enskild roll
  roles?: string[];   // Flera roller (kontrolleras sekventiellt, returnerar den första rollen med behörighet)
  resource: string;   // Resursnamn
  action: string;    // Operationsnamn
}

interface CanResult {
  role: string;       // Roll med behörighet
  resource: string;   // Resursnamn
  action: string;    // Operationsnamn
  params?: any;       // Information om fasta parametrar (om inställt via addFixedParams)
}
```

## Registrera konfigurerbara operationer (setAvailableAction)

Om ni vill att anpassade operationer ska kunna konfigureras i gränssnittet (till exempel visas på rollhanteringssidan), måste ni använda `setAvailableAction` för att registrera dem. Registrerade operationer kommer att visas i gränssnittet för behörighetskonfiguration, där administratörer kan konfigurera operationens behörigheter för olika roller.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Visningsnamn i gränssnittet, stöder internationalisering
  type: 'new-data',               // Operationstyp
  onNewRecord: true,              // Om det ska gälla vid skapande av nya poster
});
```

**Parameterbeskrivning:**

- **displayName**: Namn som visas i gränssnittet för behörighetskonfiguration, stöder internationalisering (använd formatet `{{t("key")}}`).
- **type**: Operationstyp, avgör operationens klassificering i behörighetskonfigurationen.
  - `'new-data'`: Operationer som skapar ny data (som import, skapa, etc.).
  - `'existing-data'`: Operationer som modifierar befintlig data (som uppdatera, radera, etc.).
- **onNewRecord**: Om det ska gälla vid skapande av nya poster, endast giltigt för typen `'new-data'`.

Efter registrering kommer denna operation att visas i gränssnittet för behörighetskonfiguration, där administratörer kan konfigurera operationens behörigheter på rollhanteringssidan.