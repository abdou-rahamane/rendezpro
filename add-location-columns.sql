-- Ajouter les colonnes de localisation à la table User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "specialite" TEXT,
ADD COLUMN IF NOT EXISTS "ville" TEXT,
ADD COLUMN IF NOT EXISTS "codePostal" TEXT,
ADD COLUMN IF NOT EXISTS "pays" TEXT DEFAULT 'France';
