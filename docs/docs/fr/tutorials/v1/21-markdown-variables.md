# Utilisation des variables de modèle Markdown

Bienvenue dans ce tutoriel ! Dans cette section, nous allons découvrir pas à pas comment utiliser Markdown et le moteur de templates Handlebars pour afficher du contenu dynamique. Dans le précédent « Astuces sur le bloc Markdown », vous avez déjà découvert la syntaxe de base, les méthodes de création et l'utilisation de variables ; nous allons maintenant approfondir l'usage avancé des variables de modèle.

## 1 Présentation du moteur de templates [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars)

Une fois votre bloc Markdown créé, vous remarquez en haut à droite, dans la configuration, une option « Moteur de template », réglée par défaut sur Handlebars. Handlebars permet d'afficher dynamiquement le contenu de la page selon des conditions, ce qui rend le Markdown réactif aux changements.

![Schéma du moteur de template](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Rôle de Handlebars

Markdown ne permet nativement que d'afficher du contenu statique ; mais avec Handlebars, vous pouvez basculer dynamiquement le texte et les styles affichés selon des conditions (statut, valeur numérique, option, etc.). Ainsi, même face à des scénarios métier variés, votre page affichera toujours les bonnes informations.

## 2 Cas d'usage concrets

Passons en revue plusieurs scénarios pratiques et mettons-les en œuvre étape par étape.

### 2.1 Gérer le statut d'une commande

Dans une démo en ligne, on a souvent besoin d'afficher des messages différents selon le statut de la commande. Supposons que votre table de commandes possède un champ statut avec les valeurs suivantes :

![Champ statut de la commande](https://static-docs.nocobase.com/20250304091420.png)

Voici le contenu à afficher pour chacun des 4 statuts :


| Libellé          | Valeur | Contenu à afficher                                                                       |
| ---------------- | ------ | ---------------------------------------------------------------------------------------- |
| Pending Approval | 1      | Commande soumise, en attente de validation interne.                                      |
| Pending Payment  | 2      | En attente du paiement client. Suivez de près l'évolution de la commande.                |
| Paid             | 3      | Paiement confirmé, à traiter. Un conseiller dédié contactera le client dans l'heure.     |
| Rejected         | 4      | La commande n'a pas été validée. Si nécessaire, vérifiez et soumettez à nouveau.         |

Sur la page, on peut récupérer la valeur du statut, puis afficher dynamiquement les informations correspondantes. Voyons en détail comment utiliser if, else et else if.

#### 2.1.1 Syntaxe if

Avec une condition if, vous affichez le contenu lorsque la condition est satisfaite. Par exemple :

```
{{#if condition}}
  <p>Affichage</p>
{{/if}}
```

La « condition » utilise la syntaxe Handlebars (eq, gt, lt, etc.). Essayons un exemple simple :

```
{{#if (eq 1 1)}}
  <p>Affichage : 1 = 1</p>
{{/if}}
```

Voir le résultat :

![Exemple if 1](https://static-docs.nocobase.com/20250305115416.png)
![Exemple if 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 Syntaxe else

Quand la condition n'est pas satisfaite, on peut spécifier un contenu de repli avec else. Par exemple :

```
{{#if (eq 1 2)}}
  <p>Affichage : 1 = 2</p>
{{else}}
  <p>Affichage : 1 ≠ 2</p>
{{/if}}
```

Résultat :

![Exemple else](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Conditions multiples

Pour plusieurs conditions, on utilise else if. Exemple :

```
{{#if (eq 1 7)}}
  <p>Affichage : 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Affichage : 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Affichage : 1 = 4</p>
{{else}}
  <p>Affichage : 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Résultat :

![Exemple multi-conditions](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Démonstration

Une fois les statuts de commande configurés, la page change dynamiquement d'affichage selon la valeur. Voir ci-dessous :

![Effet dynamique selon statut](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

Code de la page :

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>Commande soumise, en attente de validation interne.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>En attente du paiement client. Suivez de près l'évolution de la commande.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>Paiement confirmé, à traiter. Un conseiller dédié contactera le client dans l'heure.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>La commande n'a pas été validée. Si nécessaire, vérifiez et soumettez à nouveau.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">Aucune commande en attente.</p>
{{/if}}
```

Essayez de changer le statut de la commande et vérifiez que le contenu de la page se met à jour, pour valider votre code.

### 2.3 Afficher les lignes de commande

Outre l'affichage du statut, l'affichage des lignes de commande (liste détaillée des produits) est aussi un besoin courant. Nous allons utiliser la syntaxe each pour cela.

#### 2.3.1 Présentation de la syntaxe each

each permet de boucler sur une liste. Par exemple, pour le tableau [1,2,3] :

```
{{#each list}}
  <p>Affichage : {{this}}</p>
  <p>Index : {{@index}}</p>
{{/each}}
```

Dans la boucle, {{this}} représente l'élément courant et {{@index}} l'index courant.

#### 2.3.2 Exemple de lignes de produit

Si vous voulez afficher tous les produits d'une commande, vous pouvez écrire :

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Si la page n'affiche aucune donnée, vérifiez que les champs des lignes de commande sont bien affichés ; sinon le système considère ces données comme inutiles et ne les charge pas.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Vous remarquerez peut-être que le nom du produit (product.name) ne s'affiche pas, pour la même raison : il faut aussi afficher l'objet produit.
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Une fois les champs affichés, on les masque ensuite via les règles de liaison.
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Le résultat final : la liste des produits de la commande

Une fois les étapes ci-dessus terminées, vous obtenez un modèle complet d'affichage des lignes de commande. Référez-vous au code suivant :

```
### Liste des produits de la commande

{{#if $nRecord.order_items}}
  <div class="cart-summary">Total : {{$nRecord.order_items.length}} articles, prix total : ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>N°</th>
        <th>Nom du produit</th>
        <th>Prix unitaire</th>
        <th>Quantité</th>
        <th>Sous-total</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Rupture</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Stock faible</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>Commande vide</p>
{{/if}}
```

Une fois exécuté, vous verrez le résultat suivant :

![Liste des produits](https://static-docs.nocobase.com/20250305124125.png)

Pour mieux montrer la souplesse de Handlebars, nous avons ajouté dans les détails de la commande les champs « out_of_stock » (rupture) et « low_stock » (stock faible) :

- Lorsque out_of_stock vaut true, on affiche « Rupture » et la ligne devient rouge.
- Lorsque low_stock vaut true, on affiche « Stock faible » à droite, en orange.

![Effets supplémentaires : rupture et stock faible](https://static-docs.nocobase.com/20250305130258.png)

## 3 Bilan et conseils

Au fil de ces explications, vous avez appris à utiliser Handlebars pour rendre dynamique un modèle Markdown, avec des conditions if/else et des boucles each. En production, pour des logiques plus complexes, nous vous recommandons de combiner les règles de liaison, les champs calculés, les workflows ou les nœuds script pour gagner en souplesse et en extensibilité.

Continuez à pratiquer pour maîtriser ces techniques et à les appliquer dans vos projets. Continuez d'avancer et explorez de nouvelles possibilités !

---

Si vous rencontrez le moindre souci au cours de ces opérations, n'hésitez pas à venir échanger sur la [communauté NocoBase](https://forum.nocobase.com) ou à consulter la [documentation officielle](https://docs-cn.nocobase.com). Nous espérons que ce guide vous aidera à mettre en place vos besoins et à les étendre avec souplesse. Bonne réussite avec vos projets !
