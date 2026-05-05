# RendezPro — Plateforme SaaS de prise de rendez-vous en ligne

Application web permettant aux professionnels de gérer leurs rendez-vous et à leurs clients de réserver en ligne via un lien personnalisé.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Style | Tailwind CSS v4 + shadcn/ui |
| Auth | NextAuth.js (Credentials) |
| ORM | Prisma |
| Base de données | PostgreSQL via Supabase |
| Notifications | Sonner |

---

## Prérequis

- **Node.js** v18 ou supérieur → [nodejs.org](https://nodejs.org)
- **npm** (inclus avec Node.js)
- Un compte **Supabase** → [supabase.com](https://supabase.com) (gratuit)

> Docker n'est **pas** nécessaire. La base de données est hébergée sur Supabase cloud.

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/abdou-rahamane/rendezpro.git
cd rendezpro
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données Supabase
# Récupérez cette URL dans : Supabase > Project Settings > Database > Connection string (mode "Transaction")
DATABASE_URL="postgresql://postgres:[MOT_DE_PASSE]@[HOST]:6543/postgres?pgbouncer=true"

# NextAuth — clé secrète (générez-en une avec : openssl rand -base64 32)
NEXTAUTH_SECRET="votre_secret_aleatoire_ici"

# URL de l'application en local
NEXTAUTH_URL="http://localhost:3000"
```

> **Important :** Ne jamais committer le fichier `.env` — il est déjà exclu via `.gitignore`.

### 4. Synchroniser la base de données

```bash
npx prisma generate
npx prisma db push
```

> Cette commande crée toutes les tables nécessaires dans votre base Supabase.

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## Fonctionnalités principales

- **Inscription / Connexion** → `/auth/register` et `/auth/login`
- **Dashboard professionnel** → `/dashboard`
  - Statistiques des rendez-vous
  - Gestion des types de RDV
  - Configuration des disponibilités
  - Liste des rendez-vous
- **Page de réservation publique** → `/{username}`
  - Sélection du type de RDV, date et créneau horaire
  - Formulaire client (nom, email, téléphone, message)
  - Confirmation de réservation

---

## Structure du projet

```
rendezpro/
├── app/
│   ├── [username]/          # Page de réservation publique
│   ├── api/                 # Routes API (auth, booking, event-types...)
│   ├── auth/                # Pages login / register
│   ├── booking/             # Page de confirmation
│   └── dashboard/           # Tableau de bord professionnel
├── components/ui/           # Composants shadcn/ui
├── lib/                     # Prisma client, Auth config
├── prisma/
│   └── schema.prisma        # Schéma de la base de données
└── .env                     # Variables d'environnement (non commité)
```

---

## Commandes utiles

```bash
npm run dev          # Lancer en développement
npm run build        # Build de production
npx prisma studio    # Interface graphique pour la base de données
npx prisma db push   # Appliquer les changements du schéma
```

---

## Récupérer l'URL Supabase

1. Allez sur [supabase.com](https://supabase.com) → votre projet
2. **Project Settings** → **Database**
3. Copiez la **Connection string** en mode `Transaction` (port 6543)
4. Remplacez `[YOUR-PASSWORD]` par votre mot de passe de base de données
