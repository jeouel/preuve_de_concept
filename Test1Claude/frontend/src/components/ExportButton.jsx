import { useState } from 'react';
import { marked } from 'marked';
import { saveGuide } from '../services/api';

function ExportButton({ guide, videoFilename, onGuideSaved }) {
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleExport = async () => {
    if (!guide || !videoFilename) return;

    try {
      setExporting(true);

      // Convertir les GIFs en base64
      const gifRegex = /\[GIF: (\d{2}:\d{2}(?::\d{2})?) - (\d{2}:\d{2}(?::\d{2})?)\]/g;
      let match;
      const gifPromises = [];
      const gifMap = new Map();
      const matches = [];

      // Collecte tous les matches d'abord pour éviter le problème d'index dans le FileReader
      while ((match = gifRegex.exec(guide)) !== null) {
        matches.push({
          full: match[0],
          start: match[1],
        });
      }

      for (const m of matches) {
        const start = m.start.replace(/:/g, '_');
        const gifFilename = `${videoFilename.split('.')[0]}_${start}.gif`;
        const promise = fetch(`/gifs/${gifFilename}`)
          .then(response => {
            if (!response.ok) return null;
            return response.blob();
          })
          .then(blob => {
            if (!blob || blob.size === 0) return;
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                gifMap.set(m.full, reader.result);
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          });
        gifPromises.push(promise);
      }

      await Promise.all(gifPromises);

      // 1. Remplacement des GIFs par des balises HTML temporaires
      let guideWithGifs = guide.replace(gifRegex, (match) => {
        const base64Gif = gifMap.get(match);
        if (base64Gif) {
          return `<div class="gif-container">
            <img src="${base64Gif}" alt="GIF ${match}">
            <div class="gif-timestamp">${match}</div>
          </div>`;
        }
        return `<div class="gif-container"><span class="gif-missing">GIF non disponible</span><div class="gif-timestamp">${match}</div></div>`;
      });

      // 2. Conversion Markdown → HTML
      const guideHtml = marked.parse(guideWithGifs);

      const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide d'Instructions</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #2c3e50;
            margin-top: 1.5em;
        }
        h1 {
            border-bottom: 2px solid #eee;
            padding-bottom: 0.5em;
        }
        .gif-container {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .gif-container img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        .gif-timestamp {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 2em;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .material-list {
            list-style-type: none;
            padding-left: 0;
        }
        .material-list li {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .material-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #666;
        }
        .procedure-step {
            margin-bottom: 15px;
            padding-left: 20px;
            position: relative;
        }
        .procedure-step:before {
            content: attr(data-step);
            position: absolute;
            left: 0;
            font-weight: bold;
            color: #2c3e50;
        }
        .gif-missing {
            color: #b91c1c;
            font-style: italic;
            background: #fee2e2;
            border-radius: 4px;
            padding: 8px;
            margin: 10px 0;
            display: inline-block;
        }
    </style>
</head>
<body>
    ${guideHtml}
</body>
</html>`;

      // Créer et télécharger le fichier HTML
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guide_${videoFilename.split('.')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (!guide || !videoFilename) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      // Générer le HTML comme pour l'export
      const gifRegex = /\[GIF: (\d{2}:\d{2}(?::\d{2})?) - (\d{2}:\d{2}(?::\d{2})?)\]/g;
      let match;
      const gifPromises = [];
      const gifMap = new Map();
      const matches = [];
      while ((match = gifRegex.exec(guide)) !== null) {
        matches.push({
          full: match[0],
          start: match[1],
        });
      }
      for (const m of matches) {
        const start = m.start.replace(/:/g, '_');
        const gifFilename = `${videoFilename.split('.')[0]}_${start}.gif`;
        const promise = fetch(`/gifs/${gifFilename}`)
          .then(response => {
            if (!response.ok) return null;
            return response.blob();
          })
          .then(blob => {
            if (!blob || blob.size === 0) return;
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                gifMap.set(m.full, reader.result);
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          });
        gifPromises.push(promise);
      }
      await Promise.all(gifPromises);
      let guideWithGifs = guide.replace(gifRegex, (match) => {
        const base64Gif = gifMap.get(match);
        if (base64Gif) {
          return `<div class=\"gif-container\">\n            <img src=\"${base64Gif}\" alt=\"GIF ${match}\">\n            <div class=\"gif-timestamp\">${match}</div>\n          </div>`;
        }
        return `<div class=\"gif-container\"><span class=\"gif-missing\">GIF non disponible</span><div class=\"gif-timestamp\">${match}</div></div>`;
      });
      const guideHtml = marked.parse(guideWithGifs);
      const html = `<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Guide d'Instructions</title><style>body {font-family: Arial, sans-serif;line-height: 1.6;max-width: 800px;margin: 0 auto;padding: 20px;color: #333;}h1, h2, h3 {color: #2c3e50;margin-top: 1.5em;}h1 {border-bottom: 2px solid #eee;padding-bottom: 0.5em;}.gif-container {margin: 20px 0;padding: 15px;background: #f8f9fa;border-radius: 8px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}.gif-container img {max-width: 100%;height: auto;border-radius: 4px;}.gif-timestamp {color: #666;font-size: 0.9em;margin-top: 5px;}.section {margin-bottom: 2em;}.warning {background-color: #fff3cd;border-left: 4px solid #ffc107;padding: 15px;margin: 20px 0;}.material-list {list-style-type: none;padding-left: 0;}.material-list li {margin-bottom: 8px;padding-left: 20px;position: relative;}.material-list li:before {content: \"•\";position: absolute;left: 0;color: #666;}.procedure-step {margin-bottom: 15px;padding-left: 20px;position: relative;}.procedure-step:before {content: attr(data-step);position: absolute;left: 0;font-weight: bold;color: #2c3e50;}.gif-missing {color: #b91c1c;font-style: italic;background: #fee2e2;border-radius: 4px;padding: 8px;margin: 10px 0;display: inline-block;}</style></head><body>${guideHtml}</body></html>`;
      const filename = `guide_${videoFilename.split('.')[0]}_${new Date().toISOString().split('T')[0]}.html`;
      const result = await saveGuide(html, filename);
      if (result.success) {
        setSaveSuccess(true);
        if (onGuideSaved) onGuideSaved();
      } else {
        setSaveError('Erreur lors de la sauvegarde.');
      }
    } catch (e) {
      setSaveError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={!guide || !videoFilename || exporting}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? 'Export en cours...' : 'Exporter en HTML'}
      </button>
      <button
        onClick={handleSave}
        disabled={!guide || !videoFilename || saving}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Sauvegarde en cours...' : 'Sauvegarder sur le serveur'}
      </button>
      {saveSuccess && <div className="text-green-700 text-sm">Guide sauvegardé avec succès !</div>}
      {saveError && <div className="text-red-700 text-sm">{saveError}</div>}
    </div>
  );
}

export default ExportButton; 