# CONTEXT — todor : état du projet

> **Dernière mise à jour : 2026-06-10 (IA réelle : dictée vocale, scan photo, assistant via OpenRouter).** Ce fichier est le document de suivi du projet : ce qui est fait, comment c'est organisé, ce qui reste.
> Le prototype interactif de référence est dans `../design_handoff_todor/` — ouvrir `todor.html` dans un navigateur.
> Historique : ce fichier était initialement le brief d'implémentation (session du 2026-06-08) ; les 4 phases prévues sont implémentées depuis le 2026-06-09.

---

## 1. Ce qu'est l'app

**todor** est une app mobile de gestion de tâches partagée (famille, couple, coloc).
Elle combine : liste de courses, projets, calendrier d'échéances, capture multimodale (voix + photo) et assistant IA.

## 2. Stack effective

- **Expo SDK 56** + expo-router (file-based routing), React Native 0.85, React 19, TypeScript 6
- **Zustand 5** + AsyncStorage (`persist`) pour l'état
- **Reanimated 4** + gesture-handler pour les animations
- Polices Google : Bricolage Grotesque (titres) + Hanken Grotesk (corps) via `@expo-google-fonts/*`
- Export : `expo-print` (PDF) + `expo-sharing` + `expo-file-system`
- IA : `@anthropic-ai/sdk` (vision Claude via `.env`), OpenRouter en `fetch` direct (clé saisie dans l'app), Web Speech API (dictée, web), `expo-image-picker` (photo)

⚠️ Lire les docs versionnées https://docs.expo.dev/versions/v56.0.0/ avant d'écrire du code (cf. `AGENTS.md`).

## 3. Structure réelle des fichiers

```
todor/
├── app/                        ← expo-router, tabs déclarées dans _layout.tsx
│   ├── _layout.tsx             ← fonts, GestureHandlerRoot, ThemeProvider, <Tabs>
│   ├── index.tsx               ← Accueil (projets par dossier, favoris, tags, NewProjectSheet)
│   ├── tasks.tsx               ← Tâches (search, chips statut, tri, vue liste/grille)
│   ├── agenda.tsx              ← Agenda (toggle calendrier/liste, retards, groupé par date)
│   ├── ai.tsx                  ← Assistant IA (OpenRouter + contexte des listes ; scripté sans clé)
│   ├── settings.tsx            ← Réglages (palette, config OpenRouter, import JSON, exports)
│   └── project/[id].tsx        ← Détail projet (onglet caché via href: null)
├── components/
│   ├── ui/                     ← Avatar, Btn, DueBadge, PriorityBar, Progress, Sheet, TagChips, Toast
│   ├── tasks/                  ← TaskListRow, TaskCard, TaskDetailSheet (+ pickers inline)
│   └── capture/                ← VoiceSheet, PhotoSheet, NewProjectSheet
├── store/
│   ├── taskStore.ts            ← CRUD tâches, récurrence, historique, hydratation seed
│   ├── projectStore.ts         ← projets dynamiques (seed + addProject), getAllProjects()
│   ├── settingsStore.ts        ← palette accent + clé/modèle OpenRouter (persistés)
│   └── types.ts                ← Task, Project, Member, Tag, Folder, FilterState…
├── lib/
│   ├── dates.ts                ← startOfDay, diffDays, dueStatus, nextDue, monthGrid
│   ├── sort.ts                 ← filterTasks, sortTasks (tri "smart")
│   ├── importExport.ts         ← parseImport, exportJSON, exportCSV, export PDF (HTML)
│   ├── speech.web.ts           ← dictée vocale Web Speech API (web) / speech.ts = stub natif
│   ├── dictation.ts            ← parseur dictée libre → items/tâches
│   ├── vision.ts               ← scan photo : route OpenRouter → Claude → simulation
│   ├── openrouter.ts           ← client OpenRouter (modèles vision, test, chatCompletion)
│   └── assistant.ts            ← chat de l'onglet IA (contexte listes, bloc <add>)
├── constants/
│   ├── data.ts                 ← seed : MEMBERS, PRIORITIES, TAGS, FOLDERS, PROJECTS, 28 TASKS
│   ├── tokens.ts               ← Colors, Radius, Space, FontFamily, PALETTES
│   └── animations.ts           ← timings de référence (sheetUp 340ms, scrim 250ms…)
├── context/
│   └── ThemeContext.tsx        ← accent à chaud depuis settingsStore
└── .env.example                ← EXPO_PUBLIC_ANTHROPIC_API_KEY (le .env réel est gitignoré)
```

Écarts par rapport au plan initial : pas de groupe `app/(tabs)/` (tabs à plat, détail projet masqué de la tab bar) ; pas de dossiers `components/home|agenda|shared` (le contenu vit dans les écrans) ; pas de `RingProgress`/`AvatarStack` en fichiers séparés ; trois stores au lieu d'un.

## 4. Ce qui est fait

### Commits du 2026-06-09 (implémentation initiale)

| Commit | Contenu |
|--------|---------|
| `76de4dc` | Phases 1–4 complètes : navigation + données + tous les écrans, TaskDetailSheet et pickers, Agenda, IA simulée, Réglages avec import/export, VoiceSheet/PhotoSheet simulés |
| `7f4d5cf` | Polices custom chargées, palette persistée (settingsStore + ThemeContext), Sheet réécrit en Reanimated 4, checkPop sur les checkboxes, export PDF |
| `ac94ee8` | Bouton "Nouveau Projet / Liste" fonctionnel : projectStore dynamique, NewProjectSheet (nom, emoji, couleur, dossier), intégration Accueil/détail/import |
| `ec40d82` | Fix saisie bloquée dans les sheets (scrim qui interceptait les touchers) + libellé "Nouvelle liste" |

### Commits du 2026-06-10 (corrections + IA réelle)

| Commit | Contenu |
|--------|---------|
| `6b15854` | Fix sheets vides (page blanche) sur web : `flex: 0` → `flexGrow: 0` sur les ScrollView (flex-basis 0% en react-native-web) |
| `67b6aef` | Dictée vocale réelle sur web : Web Speech API fr-FR (`lib/speech.web.ts`), transcription live, parseur dictée → items/tâches (`lib/dictation.ts`), simulation en repli sur natif |
| `2bc7920` | Scan photo réel : expo-image-picker + vision IA double fournisseur (`lib/vision.ts`) — OpenRouter configurable dans l'app (Réglages → Assistant IA : clé, liste des modèles vision, bouton Tester) ou API Claude via `.env` |
| `90f5a78` | Assistant IA (onglet ✨) branché sur OpenRouter : contexte réel des listes dans le prompt système, historique, suggestions d'ajout `<add>` → carte "Tout ajouter" |

Logique métier en place : récurrence (`toggleDone` crée l'occurrence suivante), dénormalisation `color`/`emoji`/`projectName` sur chaque tâche, historique des mutations, favoris, hydratation du seed (offsets `*Off` → vraies `Date` au premier boot), persistance AsyncStorage.

## 5. Fonctionnalités IA — état et configuration

La configuration vit dans **Réglages → Assistant IA → "Scan photo (vision)"** : clé OpenRouter saisie dans l'app (persistée localement), choix du modèle (liste vision chargée en direct), bouton 🧪 Tester. Cette clé sert au scan photo **et** au chat de l'onglet IA.

| Fonction | État | Détail |
|----------|------|--------|
| Assistant (onglet ✨) | **Réel via OpenRouter** | `lib/assistant.ts` — contexte des listes, historique 12 tours, bloc `<add>` ; scripté sans clé |
| Scan photo | **Réel partout** | `lib/vision.ts` route : OpenRouter (prioritaire) → Claude (`EXPO_PUBLIC_ANTHROPIC_API_KEY` dans `.env`, `claude-opus-4-8`, JSON structuré ; relancer `expo start -c` après modif) → simulation |
| Dictée vocale | **Réel sur web** | Web Speech API (Chrome/Edge, fr-FR) ; sur mobile natif la simulation reste (vraie reco = dev build ou API cloud) |

⚠️ Les clés vivent côté client : OK pour un usage perso, pas pour distribuer l'app.

## 6. Ce qui reste / limitations connues

- **Données locales** : pas de backend, pas de vrai partage multi-utilisateurs (les membres sont des données seed)
- **Notifications** : toggles UI seulement — `expo-notifications` n'est pas installé, aucun rappel réel n'est programmé
- **Dictée vocale sur mobile natif** : simulation (vraie reconnaissance = development build ou API cloud)
- **Pas de tests** automatisés (vérifications faites en headless Chromium au fil des changements, non rejouables)
- **Pas vérifié sur device réel** récent — valider gestures, safe areas et perfs des animations sur iOS/Android

## 7. Références utiles

- Modèle de données : `store/types.ts` (source de vérité, ne plus dupliquer ici)
- Design tokens et 4 palettes accent (Sprout/Tomate/Indigo/Prune) : `constants/tokens.ts`
- Timings d'animation : `constants/animations.ts`
- Format d'import JSON (généré par Claude) : `lib/importExport.ts` — `due` accepte `"+N"`, `"today"`, `"demain"`, `"YYYY-MM-DD"`
- Export CSV : colonnes `Tâche / Projet / Priorité / Échéance / Heure / Étiquettes / Statut / Assigné`
