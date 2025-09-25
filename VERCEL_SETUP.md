# Configurazione Vercel per l'App

## Problema Risolto
Il login con `master@codit.com` non funzionava perché le variabili d'ambiente di Supabase non erano configurate su Vercel.

## Passaggi per Configurare le Variabili d'Ambiente su Vercel

### 1. Accedi al Dashboard di Vercel
- Vai su [vercel.com](https://vercel.com)
- Accedi al tuo account
- Seleziona il progetto dell'app

### 2. Configura le Variabili d'Ambiente
- Vai su **Settings** → **Environment Variables**
- Aggiungi le seguenti variabili:

```
EXPO_PUBLIC_SUPABASE_URL = https://ngbgnzxcklvehhgssmev.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmduenhja2x2ZWhoZ3NzbWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3ODQxNTQsImV4cCI6MjA3NDM2MDE1NH0.RlEIYMAE4iU6ITZ7Dxwm0CbYh0qF1FVF64YS7yNakZw
```

### 3. Applica le Variabili a Tutti gli Ambienti
- Seleziona **Production**, **Preview**, e **Development**
- Salva le modifiche

### 4. Rideploy l'App
- Vai su **Deployments**
- Clicca sui tre puntini dell'ultimo deployment
- Seleziona **Redeploy**

## Account di Test Disponibili

Dopo la configurazione, questi account funzioneranno:

- **Admin**: `admin@codit.com` (qualsiasi password)
- **Master**: `master@codit.com` (qualsiasi password)
- **Team Leader**: `leader@codit.com` (qualsiasi password)
- **Senior**: `senior@codit.com` (qualsiasi password)

## Verifica del Funzionamento

1. Apri la console del browser (F12)
2. Prova a fare login con `master@codit.com`
3. Controlla i log della console per vedere:
   - "Supabase configuration" con URL e chiave
   - "Login attempt for: master@codit.com"
   - "Created new user in Supabase" o "Found existing user"

## Fallback Locale

Se Supabase non è disponibile, l'app funziona comunque in modalità offline usando AsyncStorage locale.