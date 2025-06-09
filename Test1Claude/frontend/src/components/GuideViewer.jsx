import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

function extractPhotoTimestamps(markdown) {
  const regex = /\[PHOTO: (\d{2}:\d{2}:\d{2})\]/g;
  const timestamps = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    timestamps.push(match[1]);
  }
  return timestamps;
}

function removePhotoTags(markdown) {
  // Supprime toutes les balises [PHOTO: ...] du texte
  return markdown.replace(/\[PHOTO: \d{2}:\d{2}:\d{2}\]/g, '');
}

function GuideViewer({ guide, loading, videoFilename }) {
  const [finalMarkdown, setFinalMarkdown] = useState('');
  const [screenshots, setScreenshots] = useState([]); // [{ ts, url }]

  useEffect(() => {
    if (loading || !guide) {
      setFinalMarkdown('');
      setScreenshots([]);
      return;
    }
    let markdown = '';
    if (typeof guide === 'string') {
      markdown = guide;
    } else if (guide.gemini_response) {
      markdown = guide.gemini_response;
    } else if (guide.results && Array.isArray(guide.results) && typeof guide.results[0] === 'string') {
      markdown = guide.results[0];
    } else if (guide.results && Array.isArray(guide.results) && guide.results[0]?.gemini_response) {
      markdown = guide.results[0].gemini_response;
    } else {
      markdown = JSON.stringify(guide);
    }

    const timestamps = extractPhotoTimestamps(markdown);
    console.log('[GuideViewer] Extracted timestamps:', timestamps);

    // Nettoyer le texte pour enlever les balises [PHOTO: ...]
    setFinalMarkdown(removePhotoTags(markdown));

    if (!videoFilename || timestamps.length === 0) {
      setScreenshots([]);
      return;
    }

    // Appel backend pour générer les screenshots
    axios.post('/api/gemini/screenshots', {
      videoFilename,
      timestamps
    }).then(res => {
      console.log('[GuideViewer] Screenshot API response:', res.data);
      const images = [];
      for (const ts of timestamps) {
        const url = res.data.results[ts];
        if (url) {
          images.push({ ts, url });
        }
      }
      setScreenshots(images);
    }).catch(err => {
      console.error('[GuideViewer] Screenshot API error:', err);
      setScreenshots([]);
    });
  }, [guide, loading, videoFilename]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>Le guide d'instructions apparaîtra ici après l'analyse</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[800px] overflow-y-auto text-gray-800">
      <ReactMarkdown>{finalMarkdown}</ReactMarkdown>
      {screenshots.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Captures extraites de la vidéo :</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map(({ ts, url }) => (
              <div key={ts} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 shadow">
                <img src={url} alt={`Screenshot à ${ts}`} className="w-full h-auto rounded mb-2" />
                <span className="text-xs text-gray-600">{ts}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GuideViewer;
