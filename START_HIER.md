# 🚀 Quick Start Guide - RDW App

## Waarom zie ik een wit scherm?

Je ziet een wit scherm omdat dit een moderne React app is die Node.js nodig heeft om te draaien. Je kunt het HTML bestand niet direct openen in de browser.

## 📦 Installatie Stappen

### 1. Installeer Node.js

**Optie A: Via Homebrew (Aangeraden voor Mac)**
```bash
# Installeer Homebrew als je het nog niet hebt
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installeer Node.js
brew install node
```

**Optie B: Directe Download**
- Ga naar [nodejs.org](https://nodejs.org/)
- Download de LTS versie (20.x)
- Installeer het .pkg bestand

### 2. Controleer installatie
```bash
node --version
npm --version
```

### 3. Installeer project dependencies
```bash
# Ga naar je project directory
cd /Users/sandermuziek/Documents/CursorAI/RDW

# Installeer alle benodigde packages
npm install
```

### 4. Start de development server
```bash
npm run dev
```

### 5. Open je browser
De app draait nu op: **http://localhost:3000**

## 🎯 Wat kun je verwachten?

- **Homepage** met overzicht van alle features
- **Trekgewicht Check** - Test met kenteken zoals "1-ABC-23"
- **Kenteken Zoeken** - Probeer wildcards zoals "*BMW*"
- **Dark mode** toggle in de header
- **Responsive design** - werkt op mobiel en desktop

## 🐛 Problemen?

**"Command not found: npm"**
- Node.js is niet correct geïnstalleerd
- Herstart je terminal na installatie

**"Module not found errors"**
- Run `npm install` opnieuw
- Zorg dat je in de juiste directory bent

**"Port 3000 already in use"**
- Gebruik een andere port: `npm run dev -- --port 3001`

## 📱 Live Demo

Als je geen Node.js wilt installeren, kan ik de app ook deployen naar een gratis hosting service zodat je het direct kunt testen in je browser.

---

**Tip**: Deze app gebruikt echte RDW data! Probeer kentekens zoals:
- 1-ABC-23
- 12-AB-34  
- AB-123-C 