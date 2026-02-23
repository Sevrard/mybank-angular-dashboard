# 💰 MyBank

![Angular](https://img.shields.io/badge/Angular-21-red)
![Spring Boot](https://img.shields.io/badge/SpringBoot-API-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Docker-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-Personal-lightgrey)

Application web fullstack de gestion financière avec dashboard interactif, développée avec une architecture moderne et auto-hébergée.

* 🔗 **Demo live** : https://demo.fuky.synology.me
* 🔗 **Backend repo** : https://github.com/Sevrard/mybank-Spring-boot-API


![Dashboard preview](./docs/screen.png)


## 🚀 Stack technique

### 🖥️ Frontend

* Angular (Vite)
* Angular Material (theming dynamique)
* SCSS (design system custom + mixins)
* Charts (visualisation des données)

### ⚙️ Backend

* Java / Spring Boot
* API REST sécurisée
* Authentification JWT

### 🗄️ Base de données

* PostgreSQL (Docker)

### 🧱 Infra / DevOps

* NAS Synology (auto-hébergement)
* Docker (DB + services)
* Reverse proxy (accès externe)
* HTTPS


## 🔐 Authentification

* Authentification via **JWT (JSON Web Token)**
* Gestion sécurisée des sessions côté client
* Protection des routes backend
* Intercepteurs Angular pour injection automatique du token


## 📊 Fonctionnalités

* 🔑 Authentification utilisateur
* 💼 Dashboard financier
* 📈 Visualisation du solde et des transactions
* 📊 Graphiques dynamiques (revenus / dépenses)
* 🧾 Liste des transactions
* 🎨 Thèmes dynamiques (light / dark + palettes custom)
* ⚡ UI moderne type fintech


## 🌐 Intégration APIs externes

Mise en place d’un **proxy backend** pour interroger des APIs externes :

* 📉 Yahoo Finance
* 💱 Binance

### Pourquoi un proxy ?

* Évite les problèmes de CORS
* Sécurise les clés API
* Centralise la logique backend


## 🎨 Theming

Système de thème avancé basé sur :

* Angular Material theming
* Mixin SCSS custom
* Injection dynamique des palettes

👉 Permet :

* plusieurs thèmes (ex: Indigo & Pink, Purple & Green…)
* mode sombre / clair
* cohérence design globale


## 🏗️ Architecture

```bash
Frontend (Angular)
    ↓
Backend (Spring Boot API REST)
    ↓
PostgreSQL (Docker)

+ Proxy backend → APIs externes (Binance / Yahoo)
```

## ⚙️ Lancement du projet


```bash
cd frontend
npm install
npm run dev
```

## 🔥 Points clés

* Architecture **fullstack complète**
* Projet **auto-hébergé en production**
* Gestion du **theming avancé**
* Intégration **APIs financières**
* Approche **DevOps (NAS + Docker + proxy)**


## 📌 Roadmap

* [ ] Gestion multi-comptes avancée
* [ ] Catégorisation automatique des dépenses
* [ ] Notifications
* [x] Export PDF (dashboard)
* [ ] Export CSV
* [ ] PWA / mobile


## 👨‍💻 Auteur

**Stéphane Evrard**
Développeur Fullstack (Angular / React / Node / Java)

