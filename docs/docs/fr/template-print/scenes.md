# Utiliser la fonctionnalité « Impression de modèle » pour générer des contrats de fourniture et d'achat

Dans les scénarios de chaîne d'approvisionnement ou de commerce, il est souvent nécessaire de générer rapidement un « Contrat de fourniture et d'achat » standardisé et de remplir dynamiquement son contenu à partir d'informations provenant de sources de données, telles que les acheteurs, les vendeurs et les détails des produits. Ci-dessous, nous allons prendre l'exemple d'un cas d'utilisation simplifié de « Contrat » pour vous montrer comment configurer et utiliser la fonctionnalité « Impression de modèle » afin de mapper les informations de données aux espaces réservés dans les modèles de contrat, générant ainsi automatiquement le document contractuel final.

---

## 1. Contexte et aperçu de la structure des données

Dans notre exemple, nous avons principalement les **collections** suivantes (les autres champs non pertinents sont omis) :

- **parties** : Stocke les informations des entités ou individus (Partie A/Partie B), y compris le nom, l'adresse, la personne de contact, le téléphone, etc.
- **contracts** : Stocke les enregistrements de contrat spécifiques, y compris le numéro de contrat, les clés étrangères de l'acheteur/vendeur, les informations du signataire, les dates de début/fin, le compte bancaire, etc.
- **contract_line_items** : Utilisée pour enregistrer les multiples articles sous ce contrat (nom du produit, spécification, quantité, prix unitaire, date de livraison, etc.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Étant donné que le système actuel ne prend en charge que l'impression d'un seul enregistrement à la fois, nous cliquerons sur « Imprimer » sur la page « Détails du contrat ». Le système récupérera alors automatiquement l'enregistrement de contrat correspondant, ainsi que les informations associées des parties, et les remplira dans des documents Word ou PDF.

---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


## 2. Préparation

### 2.1 Préparation du plugin

Veuillez noter que notre **plugin** « Impression de modèle » est un **plugin** commercial. Vous devrez l'acheter et l'activer avant de pouvoir effectuer des opérations d'impression.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Confirmer l'activation du plugin :**

Sur n'importe quelle page, créez un bloc de détails (par exemple, pour les utilisateurs) et vérifiez si une option de configuration de modèle correspondante est disponible dans la configuration des actions :

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Création des collections

Créez les **collections** principales (entité, contrat et articles de produit) que nous avons conçues ci-dessus (sélectionnez uniquement les champs essentiels).

#### Collection Contrats (Contracts)

| Catégorie de champ | Nom d'affichage du champ | Nom du champ | Interface du champ |
|---------|-------------------|------------|-----------------|
| **Champs PK & FK** | | | |
| | ID | id | Entier |
| | ID Acheteur | buyer_id | Entier |
| | ID Vendeur | seller_id | Entier |
| **Champs d'association** | | | |
| | Articles du contrat | contract_items | Un à plusieurs |
| | Acheteur (Partie A) | buyer | Plusieurs à un |
| | Vendeur (Partie B) | seller | Plusieurs à un |
| **Champs généraux** | | | |
| | Numéro de contrat | contract_no | Texte sur une seule ligne |
| | Date de début de livraison | start_date | Date/heure (avec fuseau horaire) |
| | Date de fin de livraison | end_date | Date/heure (avec fuseau horaire) |
| | Ratio d'acompte (%) | deposit_ratio | Pourcentage |
| | Jours de paiement après livraison | payment_days_after | Entier |
| | Nom du compte bancaire (Bénéficiaire) | bank_account_name | Texte sur une seule ligne |
| | Nom de la banque | bank_name | Texte sur une seule ligne |
| | Numéro de compte bancaire (Bénéficiaire) | bank_account_number | Texte sur une seule ligne |
| | Montant total | total_amount | Nombre |
| | Codes de devise | currency_codes | Sélection unique |
| | Ratio du solde (%) | balance_ratio | Pourcentage |
| | Jours de solde après livraison | balance_days_after | Entier |
| | Lieu de livraison | delivery_place | Texte long |
| | Nom du signataire Partie A | party_a_signatory_name | Texte sur une seule ligne |
| | Titre du signataire Partie A | party_a_signatory_title | Texte sur une seule ligne |
| | Nom du signataire Partie B | party_b_signatory_name | Texte sur une seule ligne |
| | Titre du signataire Partie B | party_b_signatory_title | Texte sur une seule ligne |
| **Champs système** | | | |
| | Créé le | createdAt | Date de création |
| | Créé par | createdBy | Créé par |
| | Dernière mise à jour le | updatedAt | Date de dernière mise à jour |
| | Dernière mise à jour par | updatedBy | Dernière mise à jour par |

#### Collection Parties (Parties)

| Catégorie de champ | Nom d'affichage du champ | Nom du champ | Interface du champ |
|---------|-------------------|------------|-----------------|
| **Champs PK & FK** | | | |
| | ID | id | Entier |
| **Champs généraux** | | | |
| | Nom de la partie | party_name | Texte sur une seule ligne |
| | Adresse | address | Texte sur une seule ligne |
| | Personne de contact | contact_person | Texte sur une seule ligne |
| | Téléphone de contact | contact_phone | Téléphone |
| | Poste | position | Texte sur une seule ligne |
| | E-mail | email | E-mail |
| | Site web | website | URL |
| **Champs système** | | | |
| | Créé le | createdAt | Date de création |
| | Créé par | createdBy | Créé par |
| | Dernière mise à jour le | updatedAt | Date de dernière mise à jour |
| | Dernière mise à jour par | updatedBy | Dernière mise à jour par |

#### Collection Articles de contrat (Contract Line Items)

| Catégorie de champ | Nom d'affichage du champ | Nom du champ | Interface du champ |
|---------|-------------------|------------|-----------------|
| **Champs PK & FK** | | | |
| | ID | id | Entier |
| | ID Contrat | contract_id | Entier |
| **Champs d'association** | | | |
| | Contrat | contract | Plusieurs à un |
| **Champs généraux** | | | |
| | Nom du produit | product_name | Texte sur une seule ligne |
| | Spécification / Modèle | spec | Texte sur une seule ligne |
| | Quantité | quantity | Entier |
| | Prix unitaire | unit_price | Nombre |
| | Montant total | total_amount | Nombre |
| | Date de livraison | delivery_date | Date/heure (avec fuseau horaire) |
| | Remarque | remark | Texte long |
| **Champs système** | | | |
| | Créé le | createdAt | Date de création |
| | Créé par | createdBy | Créé par |
| | Dernière mise à jour le | updatedAt | Date de dernière mise à jour |
| | Dernière mise à jour par | updatedBy | Dernière mise à jour par |

### 2.3 Configuration de l'interface

**Saisir des exemples de données :**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Configurez les règles de liaison comme suit pour calculer automatiquement le prix total et le paiement du solde :**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Créez un bloc d'affichage, confirmez les données, puis activez l'action « Impression de modèle » :**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Configuration du **plugin** d'impression de modèle

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Ajoutez une configuration de modèle, par exemple pour un « Contrat de fourniture et d'achat » :

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Ensuite, accédez à l'onglet « Liste des champs » où vous pourrez voir tous les champs de l'objet actuel. Une fois que vous aurez cliqué sur « Copier », vous pourrez commencer à remplir le modèle.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Préparation du fichier de contrat

**Fichier de modèle de contrat Word**

Préparez à l'avance le modèle de contrat (fichier .docx), par exemple : `SUPPLY AND PURCHASE CONTRACT.docx`

Dans cet exemple, nous fournissons une version simplifiée du « Contrat de fourniture et d'achat », qui contient des espaces réservés d'exemple :

- `{d.contract_no}` : Numéro de contrat
- `{d.buyer.party_name}` , `{d.seller.party_name}` : Noms de l'acheteur et du vendeur
- `{d.total_amount}` : Montant total du contrat
- Et d'autres espaces réservés tels que « personne de contact », « adresse », « téléphone », etc.

Vous pouvez ensuite copier et coller les champs de votre **collection** dans le document Word.

---

## 3. Tutoriel sur les variables de modèle

### 3.1 Remplissage des variables de base et des propriétés d'objets associés

**Remplissage des champs de base :**

Par exemple, le numéro de contrat en haut, ou l'objet de l'entité signataire du contrat. Il vous suffit de cliquer sur « Copier » et de coller directement dans l'espace vide correspondant du contrat.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formatage des données

#### Formatage des dates

Dans les modèles, nous devons souvent formater les champs, en particulier les champs de date. Le format de date copié directement est généralement long (par exemple, Mer Jan 01 2025 00:00:00 GMT) et doit être formaté pour afficher le style souhaité.

Pour les champs de date, vous pouvez utiliser la fonction `formatD()` pour spécifier le format de sortie :

```
{nom_du_champ:formatD(style_de_formatage)}
```

**Exemple :**

Par exemple, si le champ original que nous avons copié est `{d.created_at}` et que nous devons formater la date au format `2025-01-01`, alors modifiez ce champ comme suit :

```
{d.created_at:formatD(YYYY-MM-DD)}  // Sortie : 2025-01-01
```

**Styles de formatage de date courants :**

- `YYYY` - Année (quatre chiffres)
- `MM` - Mois (deux chiffres)
- `DD` - Jour (deux chiffres)
- `HH` - Heure (format 24 heures)
- `mm` - Minutes
- `ss` - Secondes

**Exemple 2 :**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Sortie : 2025-01-01 14:30:00
```

#### Formatage des montants

Supposons qu'il existe un champ de montant, tel que `{d.total_amount}` dans le contrat. Nous pouvons utiliser la fonction `formatN()` pour formater les nombres, en spécifiant le nombre de décimales et le séparateur de milliers.

**Syntaxe :**

```
{nom_du_champ:formatN(nombre_de_decimales, separateur_de_milliers)}
```

- **nombre_de_decimales** : Vous pouvez spécifier le nombre de décimales à conserver. Par exemple, `2` signifie deux décimales.
- **separateur_de_milliers** : Spécifie s'il faut utiliser un séparateur de milliers, généralement `true` ou `false`.

**Exemple 1 : Formater un montant avec un séparateur de milliers et deux décimales**

```
{d.amount:formatN(2, true)}  // Sortie : 1 234,56
```

Ceci formatera `d.amount` avec deux décimales et ajoutera un séparateur de milliers.

**Exemple 2 : Formater un montant en entier sans décimales**

```
{d.amount:formatN(0, true)}  // Sortie : 1 235
```

Ceci formatera `d.amount` en entier et ajoutera un séparateur de milliers.

**Exemple 3 : Formater un montant avec deux décimales mais sans séparateur de milliers**

```
{d.amount:formatN(2, false)}  // Sortie : 1234.56
```

Ici, le séparateur de milliers est désactivé et seules deux décimales sont conservées.

**Autres besoins de formatage des montants :**

- **Symbole monétaire** : Carbone ne fournit pas directement de fonctions de formatage de symbole monétaire, mais vous pouvez ajouter des symboles monétaires directement dans les données ou les modèles. Par exemple :
  ```
  {d.amount:formatN(2, true)} EUR  // Sortie : 1 234,56 EUR
  ```

#### Formatage des chaînes de caractères

Pour les champs de chaîne de caractères, vous pouvez utiliser `:upperCase` pour spécifier le format du texte, comme la conversion de casse.

**Syntaxe :**

```
{nom_du_champ:upperCase:autres_commandes}
```

**Méthodes de conversion courantes :**

- `upperCase` - Convertir en majuscules
- `lowerCase` - Convertir en minuscules
- `upperCase:ucFirst` - Mettre la première lettre en majuscule

**Exemple :**

```
{d.party_a_signatory_name:upperCase}  // Sortie : JOHN DOE
```

### 3.3 Impression en boucle

#### Comment imprimer des listes d'objets enfants (comme les détails des produits)

Lorsque nous devons imprimer un tableau contenant plusieurs sous-éléments (par exemple, les détails des produits), nous devons généralement utiliser l'impression en boucle. De cette façon, le système générera une ligne de contenu pour chaque élément de la liste jusqu'à ce que toutes les entrées aient été parcourues.

Supposons que nous ayons une liste de produits (par exemple, `contract_items`), qui contient plusieurs objets produit. Chaque objet produit possède plusieurs attributs, tels que le nom du produit, la spécification, la quantité, le prix unitaire, le montant total et les remarques.

**Étape 1 : Remplir les champs dans la première ligne du tableau**

Tout d'abord, dans la première ligne du tableau (pas l'en-tête), nous copions et remplissons directement les variables du modèle. Ces variables seront remplacées par les données correspondantes et affichées dans la sortie.

Par exemple, la première ligne du tableau se présente comme suit :

| Nom du produit | Spécification / Modèle | Quantité | Prix unitaire | Montant total | Remarque |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Ici, `d.contract_items[i]` représente le i-ème élément de la liste de produits, et `i` est un index qui représente l'ordre du produit actuel.

**Étape 2 : Modifier l'index dans la deuxième ligne**

Ensuite, dans la deuxième ligne du tableau, nous modifions l'index du champ en `i+1` et remplissons uniquement le premier attribut. En effet, lors de l'impression en boucle, nous devons récupérer l'élément de données suivant de la liste et l'afficher sur la ligne suivante.

Par exemple, la deuxième ligne est remplie comme suit :
| Nom du produit | Spécification / Modèle | Quantité | Prix unitaire | Montant total | Remarque |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

Dans cet exemple, nous avons changé `[i]` en `[i+1]`, ce qui nous permet d'obtenir les données du produit suivant dans la liste.

**Étape 3 : Impression en boucle automatique lors du rendu du modèle**

Lorsque le système traite ce modèle, il fonctionne selon la logique suivante :

1. La première ligne sera remplie conformément aux champs que vous avez définis dans le modèle.
2. Ensuite, le système supprimera automatiquement la deuxième ligne et commencera à extraire les données de `d.contract_items`, remplissant chaque ligne en boucle selon le format du tableau jusqu'à ce que tous les détails des produits soient imprimés.

L'index `i` de chaque ligne sera incrémenté, garantissant que chaque ligne affiche des informations de produit différentes.

---

## 4. Télécharger et configurer le modèle de contrat

### 4.1 Télécharger le modèle

1. Cliquez sur le bouton « Ajouter un modèle » et saisissez le nom du modèle, par exemple « Modèle de contrat de fourniture et d'achat ».
2. Téléchargez le [fichier Word de contrat (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) préparé, qui contient déjà tous les espaces réservés.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Une fois terminé, le système listera le modèle dans la liste des modèles disponibles pour une utilisation ultérieure.
4. Cliquez sur « Utiliser » pour activer ce modèle.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

À ce stade, quittez la fenêtre contextuelle actuelle et cliquez sur « Télécharger le modèle » pour obtenir le modèle complet généré.

**Conseils :**

- Si le modèle utilise le format `.doc` ou d'autres formats, il pourrait être nécessaire de le convertir en `.docx`, selon la prise en charge du **plugin**.
- Dans les fichiers Word, veillez à ne pas diviser les espaces réservés en plusieurs paragraphes ou zones de texte, afin d'éviter les erreurs de rendu.

---

Nous vous souhaitons une utilisation réussie ! Grâce à la fonctionnalité « Impression de modèle », vous pouvez considérablement réduire le travail répétitif dans la gestion des contrats, éviter les erreurs de copier-coller manuel, et réaliser une production de contrats standardisée et automatisée.