# Guide d'Intégration pour Application Web (CRUD, Requêtes GET multiples, GPT, Transcription)
Ce guide explique comment intégrer votre application à l'API qui gère à la fois les opérations CRUD (Create, Read, Update, Delete) dans MongoDB, les requêtes à GPT (ASK_GPT), la transcription audio, l'exécution de requêtes BigQuery, l'envoi de SMS et d'appels Twilio, et l'analyse de fichiers avec Gemini.

## Endpoints Disponibles
Les endpoints sont disponibles dans le fichier openapi.yaml

## Format de Réponse Standard
Toutes les réponses suivent ce format :
```json
{
  "success": true,
  "results": [ ... ]
}
```
- **success** : booléen, indique si la requête a réussi ou échoué
- **results** : tableau d'objets décrivant le résultat

## Instructions Spécifiques

### Configuration pour l'Enregistrement Audio
1. **Configuration MediaRecorder optimisée pour iOS**
   - Mono (`channelCount: 1`)
   - Fréquence d'échantillonnage : 44.1 kHz
   - Bitrate réduit à 32 kbps via `audioBitsPerSecond: 32000`
   - Traitement audio activé (echoCancellation, autoGainControl, noiseSuppression)

2. **Stratégie de buffering**
   - Découpage en micro-chunks de 50 ms via `mediaRecorder.start(50)` pour éviter les problèmes de mémoire tampon sur Safari iOS

3. **Détection dynamique du format**
   - Évaluer le MIME type supporté par le navigateur
   - Adapter automatiquement l'extension lors de l'envoi POST (webm / wav / mp4 / aac)

4. **Envoi FormData**
```javascript
formData.append('file', audioBlob, `recording_${timestamp}.${fileExtension}`);
fetch(endpoint, { method: 'POST', body: formData });
```

5. **Gestion timeout**
   - Implémenter un `AbortController` avec un timeout de 30 s pour les environnements iOS instables

### Architecture BigQuery
1. **SERVER-SIDE ENCAPSULATION**
   - Toutes les interactions avec BigQuery doivent être effectuées exclusivement depuis le backend Next.js (API Routes ou Server Actions)
   - Utilisez des mécanismes appropriés comme les API Routes ou les Server Actions pour encapsuler cette communication externe

2. **CLIENT-SERVER BOUNDARY**
   - Les composants frontend doivent appeler une API interne côté serveur pour accéder aux résultats BigQuery
   - Ne pas inclure de logique SQL ou accès direct à l'API externe dans le code client

3. **SÉCURITÉ**
   - Assurez-vous que les détails sensibles restent confinés à l'implémentation côté serveur
   - Ne jamais exposer les détails dans le navigateur du client ou les bundles JavaScript

4. **TITRE DE L'ONGLET (BI)**
   - Si le projet est un rapport BI (Business Intelligence), le titre de l'onglet du navigateur doit être défini sur `"Rapport - Intelligence Industrielle"`

5. **CACHE**
   - Les résultats de la requête SQL doivent être mis en cache localement via **IndexedDB**
   - Ne pas utiliser **localStorage** (limité à 5 Mo)
   - Stocker la réponse avec une clé correspondant à un hash de la requête SQL
   - Vérifier d'abord IndexedDB avant d'interroger le serveur

### Instructions pour les Modèles IA (GPT et Gemini)
1. **Format de Réponse**
   - Les modèles répondent toujours en JSON
   - Spécifier le format JSON attendu dans les instructions système
   - Ne pas mentionner la clé "results" dans les instructions
   - Exemple de format : `{ 'explication': '...' }`

2. **Gestion des Fichiers**
   - Pour les fichiers légers (< 15Mo) : utiliser directement `GEMINI_FILE_LIGHT`
   - Pour les fichiers volumineux : utiliser le processus en deux étapes avec `GEMINI_FILE_UPLOAD` puis `GEMINI_FILE_ANALYZE`

### Communication (Email, SMS, Appel)
1. **Email**
   - Support du format HTML et texte
   - Gestion des destinataires multiples (cc, bcc)
   - Validation des adresses email

2. **SMS et Appel**
   - Format international des numéros (+1 automatique si manquant)
   - Gestion des messages pour les appels (TTS ou TwiML)
   - Vérification du solde et des numéros valides

Pour les détails spécifiques des appels API, veuillez consulter le fichier OpenAPI.yaml qui contient la documentation complète de tous les endpoints et leurs paramètres.