:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ACL-toegangscontrole

ACL (Access Control List) wordt gebruikt om de toegangsrechten voor resource-operaties te beheren. U kunt rechten toekennen aan rollen, of rolbeperkingen overslaan en rechten direct afdwingen. Het ACL-systeem biedt een flexibel mechanisme voor rechtenbeheer, met ondersteuning voor rechtenfragmenten (snippets), middleware, voorwaardelijke controles en andere methoden.

:::tip Let op

ACL-objecten behoren tot gegevensbronnen (`dataSource.acl`). De ACL van de hoofdgegevensbron is snel toegankelijk via `app.acl`. Voor het gebruik van ACL's van andere gegevensbronnen, zie het hoofdstuk [Gegevensbronbeheer](./data-source-manager.md).

:::

## Rechtenfragmenten (Snippets) registreren

Rechtenfragmenten (Snippets) maken het mogelijk om veelgebruikte rechtencombinaties te registreren als herbruikbare eenheden. Zodra een rol aan een fragment is gekoppeld, krijgt deze de bijbehorende set rechten, wat dubbele configuratie vermindert en de efficiëntie van het rechtenbeheer verbetert.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Het voorvoegsel ui.* geeft aan dat deze rechten configureerbaar zijn via de interface
  actions: ['customRequests:*'], // Overeenkomstige resource-operaties, ondersteunt wildcards
});
```

## Rechten die rolbeperkingen omzeilen (allow)

`acl.allow()` wordt gebruikt om bepaalde operaties rolbeperkingen te laten omzeilen. Dit is handig voor openbare API's, scenario's die dynamische rechtenevaluatie vereisen, of gevallen waarin rechtenbeoordeling gebaseerd moet zijn op de context van het verzoek.

```ts
// Openbare toegang, geen login vereist
acl.allow('app', 'getLang', 'public');

// Toegankelijk voor ingelogde gebruikers
acl.allow('app', 'getInfo', 'loggedIn');

// Gebaseerd op een aangepaste voorwaarde
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Beschrijving van de `condition`-parameter:**

- `'public'` (openbaar): Elke gebruiker (inclusief niet-ingelogde gebruikers) heeft toegang, zonder enige authenticatie.
- `'loggedIn'` (ingelogd): Alleen ingelogde gebruikers hebben toegang; vereist een geldige gebruikersidentiteit.
- `(ctx) => Promise<boolean>` of `(ctx) => boolean`: Een aangepaste functie die dynamisch bepaalt of toegang is toegestaan op basis van de context van het verzoek. Hiermee kunt u complexe rechtenlogica implementeren.

## Rechtenmiddleware registreren (use)

`acl.use()` wordt gebruikt om aangepaste rechtenmiddleware te registreren, waarmee u aangepaste logica kunt invoegen in het rechtencontroleproces. Dit wordt meestal gebruikt in combinatie met `ctx.permission` voor het definiëren van aangepaste rechtenregels. Het is geschikt voor scenario's die onconventionele rechtencontrole vereisen, zoals openbare formulieren die aangepaste wachtwoordverificatie nodig hebben, of dynamische rechtencontroles op basis van verzoekparameters.

**Typische toepassingsscenario's:**

- Scenario's met openbare formulieren: Geen gebruiker, geen rol, maar rechten moeten worden beperkt via een aangepast wachtwoord.
- Rechtenbeheer op basis van verzoekparameters, IP-adressen en andere voorwaarden.
- Aangepaste rechtenregels, waarbij het standaard rechtencontroleproces wordt overgeslagen of aangepast.

**Rechten beheren via `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Voorbeeld: Openbaar formulier vereist wachtwoordverificatie om de rechtencontrole over te slaan
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verificatie geslaagd, sla de rechtencontrole over
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Ongeldig wachtwoord');
    }
  }
  
  // Voer de rechtencontrole uit (vervolg de ACL-flow)
  await next();
});
```

**Beschrijving van de `ctx.permission`-eigenschap:**

- `skip: true`: Slaat de daaropvolgende ACL-rechtencontroles over en staat directe toegang toe.
- Kan dynamisch worden ingesteld in middleware op basis van aangepaste logica om flexibele rechtencontrole te realiseren.

## Vaste gegevensbeperkingen toevoegen voor specifieke operaties (addFixedParams)

`addFixedParams` kan vaste gegevensbereik (filter) beperkingen toevoegen aan bepaalde resource-operaties. Deze beperkingen omzeilen rolbeperkingen en worden direct toegepast, meestal om kritieke systeemgegevens te beschermen.

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

// Zelfs als een gebruiker de rechten heeft om rollen te verwijderen, kan hij/zij systeemrollen zoals root, admin, member niet verwijderen.
```

> **Tip:** `addFixedParams` kan worden gebruikt om te voorkomen dat gevoelige gegevens per ongeluk worden verwijderd of gewijzigd, zoals ingebouwde systeemrollen of beheerdersaccounts. Deze beperkingen werken samen met rolrechten en zorgen ervoor dat zelfs met rechten, beschermde gegevens niet kunnen worden gemanipuleerd.

## Rechten controleren (can)

`acl.can()` wordt gebruikt om te controleren of een rol de rechten heeft om een gespecificeerde operatie uit te voeren, en retourneert een rechtenresultaatobject of `null`. Dit wordt vaak gebruikt om dynamisch rechten te controleren in bedrijfslogica, bijvoorbeeld in middleware of operatiehandlers om op basis van rollen te bepalen of bepaalde operaties zijn toegestaan.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // U kunt één rol of een array van rollen doorgeven
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Rol ${result.role} kan de operatie ${result.action} uitvoeren`);
  // result.params bevat vaste parameters die zijn ingesteld via addFixedParams
  console.log('Vaste parameters:', result.params);
} else {
  console.log('Geen rechten om deze operatie uit te voeren');
}
```

> **Tip:** Als u meerdere rollen doorgeeft, wordt elke rol sequentieel gecontroleerd en wordt het resultaat van de eerste rol die rechten heeft, geretourneerd.

**Type definities:**

```ts
interface CanArgs {
  role?: string;      // Enkele rol
  roles?: string[];   // Meerdere rollen (sequentieel gecontroleerd, retourneert de eerste rol met rechten)
  resource: string;   // Resourcenaam
  action: string;    // Operatienaam
}

interface CanResult {
  role: string;       // Rol met rechten
  resource: string;   // Resourcenaam
  action: string;    // Operatienaam
  params?: any;       // Informatie over vaste parameters (indien ingesteld via addFixedParams)
}
```

## Configureerbare operaties registreren (setAvailableAction)

Als u wilt dat aangepaste operaties configureerbaar zijn via de interface (bijvoorbeeld op de rolbeheerpagina), moet u deze registreren met `setAvailableAction`. Geregistreerde operaties verschijnen in de rechtenconfiguratie-interface, waar beheerders de operatierechten voor verschillende rollen kunnen instellen.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Importeren")}}', // Weergavenaam in de interface, ondersteunt internationalisatie
  type: 'new-data',               // Type operatie
  onNewRecord: true,              // Of van kracht bij het aanmaken van nieuwe records
});
```

**Parameterbeschrijving:**

- **displayName**: De naam die wordt weergegeven in de rechtenconfiguratie-interface, ondersteunt internationalisatie (gebruik het formaat `{{t("sleutel")}}`).
- **type**: Het type operatie, dat de classificatie van deze operatie in de rechtenconfiguratie bepaalt:
  - `'new-data'` (nieuwe gegevens): Operaties die nieuwe gegevens aanmaken (zoals importeren, toevoegen, etc.).
  - `'existing-data'` (bestaande gegevens): Operaties die bestaande gegevens wijzigen (zoals bijwerken, verwijderen, etc.).
- **onNewRecord**: Of de operatie van kracht wordt bij het aanmaken van nieuwe records; alleen geldig voor het type `'new-data'`.

Na registratie verschijnt deze operatie in de rechtenconfiguratie-interface, waar beheerders de rechten voor de operatie kunnen configureren op de rolbeheerpagina.