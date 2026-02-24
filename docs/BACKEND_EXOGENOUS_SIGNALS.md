# Backend : correction des signaux exogènes (exogenous-signals)

## Contexte

Le front Angular appelle **GET `{baseUrl}/api/market/exogenous-signals`** pour afficher les signaux exogènes (USD, Fed, inflation) et calculer le **biais combiné** (prédiction).  
Si les objets renvoyés n’ont pas le bon champ **`name`**, le front affiche l’erreur :

**« Signaux manquants ou mal nommés : usd_index, fed_rates, inflation. Vérifier le backend. »**

et le biais n’est pas calculé correctement (contribution 0 pour ces signaux).

---

## Contrat attendu par le front

Chaque élément du tableau JSON doit avoir **exactement** les propriétés suivantes :

| Propriété   | Type   | Obligatoire | Exemple / contraintes |
|------------|--------|-------------|------------------------|
| `name`     | string | **Oui**     | **Valeurs exactes** : `"usd_index"`, `"fed_rates"`, `"inflation"` (un objet par valeur). |
| `label`    | string | Oui         | Libellé affiché, ex. `"Indice USD"`, `"Taux Fed"`, `"Inflation (CPI)"`. |
| `value`    | number | Oui         | Valeur numérique (ex. 97.81, 3.64, 2.39). |
| `unit`     | string | Oui         | Unité d’affichage : `""`, `"%"`, `" points"`, etc. |
| `impact`   | string | **Oui**     | **Une des trois valeurs exactes** : `"bullish"`, `"bearish"`, `"neutral"`. |
| `description` | string | Oui      | Courte explication (ex. "USD faible → bullish pour l'or"). |

---

## À corriger côté backend

1. **Champ `name`**  
   Pour que le front reconnaisse les signaux et calcule le biais, il faut **trois entrées** dans le tableau avec les `name` **exactement** suivants (sensible à la casse) :

   - **`usd_index`** — indice USD / DXY  
   - **`fed_rates`** — taux Fed  
   - **`inflation`** — inflation (ex. CPI)

   Si le backend envoie d’autres identifiants (ex. `usdIndex`, `taux_fed`, `cpi`, ou des libellés en français), le front les considère comme absents et affiche « Signaux manquants ou mal nommés ».

2. **Champ `impact`**  
   Doit être exactement l’un de : **`"bullish"`** | **`"bearish"`** | **`"neutral"`** (minuscules).  
   Toute autre valeur sera ignorée ou mal interprétée.

---

## Exemple de réponse JSON valide (200)

```json
[
  {
    "name": "usd_index",
    "label": "Indice USD",
    "value": 97.81,
    "unit": " points",
    "impact": "bullish",
    "description": "USD faible (sous 100.0) → bullish pour l'or"
  },
  {
    "name": "fed_rates",
    "label": "Taux Fed",
    "value": 3.64,
    "unit": "%",
    "impact": "bullish",
    "description": "Taux en baisse ou modéré → bullish pour l'or"
  },
  {
    "name": "inflation",
    "label": "Inflation (CPI)",
    "value": 2.39,
    "unit": "%",
    "impact": "bullish",
    "description": "Inflation au-dessus de 2.0% → or refuge (bullish)"
  }
]
```

---

## Checklist backend

- [ ] L’endpoint **GET `/api/market/exogenous-signals`** retourne un **tableau** JSON.
- [ ] Il existe **exactement** un objet avec **`name` = `"usd_index"`**.
- [ ] Il existe **exactement** un objet avec **`name` = `"fed_rates"`**.
- [ ] Il existe **exactement** un objet avec **`name` = `"inflation"`**.
- [ ] Chaque objet contient **`label`**, **`value`**, **`unit`**, **`impact`**, **`description`**.
- [ ] **`impact`** est toujours l’une des valeurs : **`"bullish"`**, **`"bearish"`**, **`"neutral"`**.

Une fois ces points respectés, le message « Signaux manquants ou mal nommés » disparaît et le biais combiné est calculé correctement (40% Tendance, 30% USD, 20% Fed, 10% Inflation).
