# 🏦 MyBank Dashboard — Angular Demo

App bancaire moderne développé avec **Angular (standalone components)**.  
Ce projet est une **démo produit** visant à illustrer une architecture Angular propre, une UX réaliste et une visualisation de données avancée.

![Dashboard preview](./docs/screen.png)


## 🎯 Objectif du projet

L’objectif de ce projet est de servir de **vitrine technique Angular** :

- démontrer une architecture réactive et maintenable
- simuler un dashboard bancaire crédible (fintech / SaaS)
- intégrer des graphiques avancés et synchronisés
- proposer une UX proche d’un produit réel

Ce projet n’est **pas un simple CRUD**, mais une démonstration de conception front-end orientée produit.

## 🚀 Fonctionnalités

### 📊 Dashboard
- Solde global
- Revenus et dépenses
- Variations (%) par rapport à la période précédente
- Comptes bancaires simulés

### 📈 Visualisation des données
- **Line chart (Chart.js)**  
  - solde cumulé
  - zone positive / négative (vert / rouge)
  - ligne zéro visible
- **Bar chart (Chart.js)**  
  - revenus vs dépenses
  - empilé
  - thème dark

### 🔎 Filtres globaux
- Filtre par période : **3 / 6 / 12 mois**
- Filtre par mois (toggle group)
- Synchronisation automatique :
  - KPI
  - graphiques
  - table des transactions

### 📋 Transactions
- Table Angular Material
- Scroll interne
- Header sticky
- Icônes directionnelles (in / out)
- Couleurs dynamiques selon le type

### 📄 Export
- Export PDF du dashboard
- Rendu fidèle à l’écran (html2canvas + jsPDF)

## 🧠 Architecture

- Angular **Standalone Components**
- Gestion d’état centralisée via `DashboardDataService`
- **RxJS** (`BehaviorSubject`, `combineLatest`)
- Single Source of Truth
- Composants UI “dumb”
- Aucun `subscribe` manuel (async pipe uniquement)

## 🛠️ Stack technique

- Angular (standalone)
- Angular Material (MDC)
- RxJS
- Chart.js
- html2canvas
- jsPDF
- SCSS (dark theme)

## ▶️ Lancer le projet

--->Bash
npm install
ng serve
Puis ouvrir dans le navigateur :
👉 http://localhost:4200

📌 Notes
Les données sont mockées mais réalistes
Le projet est conçu pour être facilement branché sur une API REST
L’architecture privilégie la lisibilité et la maintenabilité

👤 Auteur
Stéphane Evrard
Développeur Angular / Fullstack
📍 Annecy – Genève