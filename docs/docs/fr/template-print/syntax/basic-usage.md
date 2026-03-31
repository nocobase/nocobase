:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Utilisation de base

Le plugin d'impression de modèles offre diverses syntaxes pour insérer de manière flexible des données dynamiques et des structures logiques dans vos modèles. Vous trouverez ci-dessous des explications détaillées sur la syntaxe et des exemples d'utilisation.

### Remplacement de base

Utilisez des placeholders au format `{d.xxx}` pour le remplacement de données. Par exemple :

- `{d.title}` : Lit le champ `title` du jeu de données.
- `{d.date}` : Lit le champ `date` du jeu de données.

**Exemple** :

Contenu du modèle :
```
Cher client,

Nous vous remercions d'avoir acheté notre produit : {d.productName}.
Numéro de commande : {d.orderId}
Date de commande : {d.orderDate}

Nous vous souhaitons une agréable expérience !
```

Jeu de données :
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Résultat rendu :
```
Cher client,

Nous vous remercions d'avoir acheté notre produit : montre intelligente.
Numéro de commande : A123456789
Date de commande : 2025-01-01

Nous vous souhaitons une agréable expérience !
```

### Accès aux sous-objets

Si le jeu de données contient des sous-objets, vous pouvez accéder à leurs propriétés en utilisant la notation par points.

**Syntaxe** : `{d.parent.child}`

**Exemple** :

Jeu de données :
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Contenu du modèle :
```
Nom du client : {d.customer.name}
Adresse e-mail : {d.customer.contact.email}
Numéro de téléphone : {d.customer.contact.phone}
```

Résultat rendu :
```
Nom du client : 李雷
Adresse e-mail : lilei@example.com
Numéro de téléphone : 13800138000
```

### Accès aux tableaux

Si le jeu de données contient des tableaux, vous pouvez utiliser le mot-clé réservé `i` pour accéder à leurs éléments.

**Syntaxe** : `{d.arrayName[i].field}`

**Exemple** :

Jeu de données :
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Contenu du modèle :
```
Le nom de famille du premier employé est {d.staffs[i=0].lastname} et son prénom est {d.staffs[i=0].firstname}
```

Résultat rendu :
```
Le nom de famille du premier employé est Anderson et son prénom est James
```