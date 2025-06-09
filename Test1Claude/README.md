# Application Vidéo vers Guide d'Instructions

## Prérequis

- Node.js (v18+)
- FFmpeg installé sur le système
- Clé API Google Gemini

## Installation

1. Cloner le projet
2. Installer FFmpeg:
   - Windows: `choco install ffmpeg`
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

3. Configuration Backend:
   ```bash
   cd backend
   npm install
   # Créer le fichier .env avec le token API
   echo "PORT=5000" > .env
   echo "API_BEARER_TOKEN=jOI$3jd^bwMN#L" >> .env
