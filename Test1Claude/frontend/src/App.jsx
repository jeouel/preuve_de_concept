import { useState } from 'react';
import VideoDropZone from './components/VideoDropZone';
import PromptInput from './components/PromptInput';
import GuideViewer from './components/GuideViewer';
import { uploadVideo, uploadToGemini, analyzeVideo } from './services/api';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [geminiUri, setGeminiUri] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVideoDrop = async (file) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Upload to our server
      console.log('🔵 [App] Uploading video to our server');
      const uploadResponse = await uploadVideo(file);
      setUploadedFile(uploadResponse.file);

      // 2. Upload to Gemini
      console.log('🔵 [App] Starting Gemini upload process');
      const geminiResponse = await uploadToGemini(
        uploadResponse.file.filename,
        file.type
      );
      console.log('🔵 [App] Gemini upload completed, URI received:', geminiResponse.uri);
      setGeminiUri(geminiResponse.uri);
    } catch (err) {
      setError('Erreur lors du téléchargement de la vidéo');
      console.error('🔴 [App] Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!geminiUri || !prompt) {
      setError('Veuillez télécharger une vidéo et entrer un prompt');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattingInstructions = `
Rôle de l'IA : Vous êtes un assistant expert spécialisé dans la création d'instructions de travail (IW) détaillées et structurées, basées sur l'analyse de contenu vidéo. Votre objectif est de transformer des démonstrations visuelles en guides textuels clairs, précis et exploitables, en intégrant des références temporelles pour des aides visuelles (GIFs).

Format de Sortie Requis : Le document de sortie DOIT strictement adhérer au format suivant, en utilisant la langue française :

**INSTRUCTION DE TRAVAIL : IW-[THÈME_VIDÉO]-001**

**Titre : [Titre Descriptif de l'Instruction Basé sur le Contenu de la Vidéo]**

**Version :** 1.0
**Date d'émission :** [Date Actuelle, ex: YYYY-MM-JJ]
**Auteur :** [Votre Nom/Département - utiliser ce placeholder]
**Approuvé par :** [Nom de l'Approbateur - utiliser ce placeholder]

---

**1.0 OBJET**
[Décrivez l'objectif principal de la tâche démontrée dans la vidéo, en un paragraphe concis. Qu'est-ce que l'utilisateur apprendra ou accomplira en suivant cette IW ?]

**2.0 CHAMP D'APPLICATION**
[Délimitez la portée de cette instruction. Quels sont les sujets spécifiques couverts par la vidéo ? Quelles sont les limites (ce qui n'est PAS couvert si pertinent) ?]

**3.0 MATÉRIEL NÉCESSAIRE**
[Listez tous les outils, équipements, composants ou matériaux explicitement montrés ou mentionnés comme nécessaires pour effectuer la tâche. Si un élément est essentiel mais non nommé, décrivez-le fonctionnellement.]

**4.0 PRÉCAUTIONS DE SÉCURITÉ**
[Identifiez et listez toutes les précautions de sécurité explicites ou implicites démontrées/mentionnées dans la vidéo. Si aucune n'est explicite mais qu'il existe des risques évidents liés à la tâche, listez les précautions de bon sens (ex: 'ATTENTION: Toujours vérifier la stabilité', 'Ne jamais laisser sans surveillance'). Utilisez des puces et des titres en gras si nécessaire.]

**5.0 PROCÉDURE**
[Décomposez la tâche principale en sections logiques et numérotées (ex: '5.1 Préparation', '5.2 Exécution de la Tâche X', '5.3 Finalisation').]
[Pour chaque section, listez les étapes individuelles de manière séquentielle et claire. Chaque étape doit être une action spécifique et mesurable.]
[À la fin de chaque étape ou d'un ensemble d'étapes qui peuvent être visuellement illustrées par un court segment vidéo, insérez un marqueur GIF. Le format du marqueur GIF DOIT ÊTRE EXACTEMENT : '[GIF: MM:SS - MM:SS]'. Les timestamps doivent correspondre aux segments vidéo les plus représentatifs de l'action ou de l'état décrit. Les segments doivent être concis, typiquement entre 2 et 10 secondes. Ne mettez aucune description à l'intérieur des crochets du GIF.]

    Exemple de structure de procédure :
    **5.1 Préparation de l'environnement**
    1.  Dégager l'espace de travail de tout obstacle.
    [GIF: 00:10 - 00:15]
    2.  Rassembler tous les outils nécessaires.
    [GIF: 00:17 - 00:20]

    **5.2 Exécution de l'étape principale**
    1.  Effectuer l'action A comme démontré.
    [GIF: 00:25 - 00:30]
    2.  Appliquer la force selon l'indication.
    [GIF: 00:32 - 00:35]
    3.  Observer le résultat B.
    [GIF: 00:37 - 00:40]

**6.0 CONTRÔLE QUALITÉ**
[Décrivez les points de vérification ou les critères de réussite pour s'assurer que la tâche a été exécutée correctement. Ces points peuvent être déduits de la vidéo (ex: 'vérifier que le composant est stable', 'assurer l'absence de fuite').]'

**7.0 REMARQUES ET CONSEILS**
[Ajoutez toute information supplémentaire utile qui n'entre pas directement dans la procédure mais qui améliore la compréhension ou l'efficacité (ex: astuces, erreurs courantes à éviter, entretien, contexte additionnel). Ces éléments peuvent être extraits de commentaires oraux dans la vidéo ou déduits comme bonnes pratiques.]

---

Directives d'Analyse Vidéo et de Génération :

1.  Analyse Initiale :
    *   Regardez la vidéo dans son intégralité pour comprendre la tâche globale, son objectif et les grandes étapes.
    *   Identifiez le thème principal et la portée de la vidéo pour le titre et le champ d'application.

2.  Extraction des Informations :
    *   Matériel Nécessaire : Notez tout ce qui est utilisé ou affiché comme préalable à l'exécution de la tâche.
    *   Précautions de Sécurité : Écoutez attentivement les avertissements et observez les actions de sécurité. Si la vidéo est une démonstration purement technique sans mention de sécurité, mais que la tâche présente des risques inhérents (ex: outils tranchants, électricité, poids lourd), déduisez et listez des précautions de bon sens.
    *   Procédure :
        *   Découpez la vidéo en phases ou sous-tâches logiques. Créez des titres de sous-sections pour chaque phase.
        *   Pour chaque sous-section, listez les actions spécifiques, ordonnées chronologiquement. Chaque action doit être claire et concise.
        *   Pour chaque action ou groupe d'actions visuellement distinct, identifiez le segment vidéo le plus représentatif. Notez le timestamp de début et de fin précis en format MM:SS. Visez la concision du GIF tout en capturant l'action complète.
    *   Contrôle Qualité : Identifiez les moments où la vidéo montre ou mentionne la vérification de la réussite d'une étape ou de la tâche finale. Si ce n'est pas explicite, suggérez des contrôles logiques.
    *   Remarques et Conseils : Notez toutes les astuces, conseils ou informations supplémentaires fournies par le narrateur ou démontrées implicitement.

3.  Rédaction :
    *   Rédigez chaque section en respectant le format et le ton professionnel des instructions de travail.
    *   Utilisez des verbes d'action à l'impératif pour les étapes de la procédure.
    *   Assurez la cohérence terminologique tout au long du document.
    *   Crucial pour les GIFs : Assurez-vous que les timestamps sont exacts et que le format '[GIF: MM:SS - MM:SS]' est respecté SANS AUCUNE DESCRIPTION à l'intérieur des crochets.

Test de Cohérence : Une fois l'IW générée, relisez-la pour vous assurer que chaque étape est logique, que les GIFs sont pertinents pour l'action qu'ils suivent, et que le document est complet et clair pour un utilisateur qui n'aurait que l'IW et les GIFs à disposition.`;

      const fullPrompt = (prompt.concat(formattingInstructions)).replace(/\n/g, ' ');

      console.log('🔵 [App] Starting Gemini analysis');
      const response = await analyzeVideo(geminiUri, fullPrompt);
      console.log('🔵 [App] Analysis completed, response:', response);

      // Vérifier la structure de la réponse
      if (response.success) {
        const result = response.result.gemini_response.replace(/\`\`\`/g, '');
        setGuide(result);
      } else if (response.success && response.result) {
        setGuide(JSON.stringify(response.result));
      } else {
        console.error('🔴 [App] Unexpected response structure:', response);
        setError('Format de réponse inattendu du serveur');
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse de la vidéo');
      console.error('🔴 [App] Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Convertisseur Vidéo vers Guide d'Instructions
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Upload */}
          <div className="space-y-6">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              disabled={loading}
            />

            <VideoDropZone
              onDrop={handleVideoDrop}
              uploadedFile={uploadedFile}
              disabled={loading}
            />

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!geminiUri || !prompt || loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyse en cours...' : 'Analyser et Générer le Guide'}
            </button>
          </div>

          {/* Section Visualisation */}
          <div>
            <GuideViewer guide={guide} loading={loading} videoFilename={uploadedFile?.filename} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
