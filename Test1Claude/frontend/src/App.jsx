import { useState } from 'react';
import VideoDropZone from './components/VideoDropZone';
import PromptInput, { defaultInstructions } from './components/PromptInput';
import GuideViewer from './components/GuideViewer';
import ExportButton from './components/ExportButton';
import { uploadVideo, uploadToGemini, analyzeVideo } from './services/api';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [geminiUri, setGeminiUri] = useState(null);
  const [prompt, setPrompt] = useState(defaultInstructions);
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

      console.log('🔵 [App] Starting Gemini analysis');
      const sanitizedPrompt = (prompt.replace(/\`\`\`/g, '')).replace(/\n/g, '');
      const response = await analyzeVideo(geminiUri, sanitizedPrompt);
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
              disabled={!geminiUri || !prompt.trim() || loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyse en cours...' : 'Analyser et Générer le Guide'}
            </button>
          </div>

          {/* Section Visualisation */}
          <div className="space-y-6">
            <GuideViewer guide={guide} loading={loading} videoFilename={uploadedFile?.filename} />
            {guide && (
              <ExportButton guide={guide} videoFilename={uploadedFile?.filename} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
