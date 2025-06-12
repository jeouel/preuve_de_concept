import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { visit } from 'unist-util-visit';

function parseTimeToSeconds(time) {
  // Supporte MM:SS ou HH:MM:SS
  const parts = time.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function extractGifTimestamps(markdown) {
  // [GIF: MM:SS - MM:SS] ou [GIF: HH:MM:SS - HH:MM:SS]
  const regex = /\[GIF: (\d{2}:\d{2}(?::\d{2})?) - (\d{2}:\d{2}(?::\d{2})?)\]/g;
  const gifs = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const start = match[1];
    const end = match[2];
    const startSec = parseTimeToSeconds(start);
    const endSec = parseTimeToSeconds(end);
    gifs.push({
      start,
      end,
      duration: Math.max(0, endSec - startSec),
      raw: match[0],
    });
  }
  return gifs;
}

function removeGifTags(markdown) {
  // Supprime toutes les balises [GIF: ...]
  return markdown.replace(/\[GIF: \d{2}:\d{2}(?::\d{2})? - \d{2}:\d{2}(?::\d{2})?\]/g, '');
}

function GuideViewer({ guide, loading, videoFilename }) {
  const [finalMarkdown, setFinalMarkdown] = useState('');
  const [gifs, setGifs] = useState([]); // [{ ts, url, duration }]
  const [gifMap, setGifMap] = useState({}); // { start: { url, duration } }

  useEffect(() => {
    if (loading || !guide) {
      setFinalMarkdown('');
      setGifs([]);
      setGifMap({});
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

    const gifsArr = extractGifTimestamps(markdown);
    console.log('[GuideViewer] Extracted GIFs:', gifsArr);

    // Ne pas nettoyer les balises GIF, on passe le markdown original !
    setFinalMarkdown(markdown);

    if (!videoFilename || gifsArr.length === 0) {
      setGifs([]);
      setGifMap({});
      return;
    }

    axios.post('/api/gemini/gifs', {
      videoFilename,
      gifs: gifsArr.map(gif => ({ start: gif.start, duration: gif.duration }))
    }).then(res => {
      console.log('[GuideViewer] gif API response:', res.data);
      const images = [];
      const map = {};
      for (let i = 0; i < gifsArr.length; i++) {
        const ts = gifsArr[i].start;
        const url = res.data.results[ts];
        if (url) {
          images.push({ ts, url, duration: gifsArr[i].duration });
          map[ts] = { url, duration: gifsArr[i].duration };
        }
      }
      setGifs(images);
      setGifMap(map);
    }).catch(err => {
      console.error('[GuideViewer] gif API error:', err);
      setGifs([]);
      setGifMap({});
    });
  }, [guide, loading, videoFilename]);

  // Plugin rehype pour remplacer les balises GIF par un tag HTML custom
  function rehypeGif() {
    return (tree) => {
      visit(tree, 'text', (node, index, parent) => {
        const regex = /\[GIF: (\d{2}:\d{2}(?::\d{2})?) - (\d{2}:\d{2}(?::\d{2})?)\]/g;
        let match;
        let lastIndex = 0;
        const newChildren = [];
        while ((match = regex.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            newChildren.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
          }
          newChildren.push({
            type: 'element',
            tagName: 'gif-placeholder',
            properties: { start: match[1] },
            children: [],
          });
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < node.value.length) {
          newChildren.push({ type: 'text', value: node.value.slice(lastIndex) });
        }
        if (newChildren.length > 0 && parent && Array.isArray(parent.children)) {
          parent.children.splice(index, 1, ...newChildren);
        }
      });
    };
  }

  // Composant React pour afficher le GIF à la place du tag
  const GifPlaceholder = ({ node }) => {
    const start = node.properties.start;
    const gif = gifMap[start];
    if (!gif) return <span style={{ color: 'red' }}>[GIF non généré]</span>;
    return (
      <div className="my-4 flex flex-col items-center">
        <img
          src={gif.url}
          alt={`GIF at ${start}`}
          className="w-auto max-w-xs h-auto rounded-lg shadow-md"
        />
        <div className="text-xs text-gray-500 mt-1">{start} ({gif.duration}s)</div>
      </div>
    );
  };

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
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[800px] overflow-y-auto">
      <div className="prose max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeGif]}
          components={{
            'gif-placeholder': GifPlaceholder,
          }}
        >
          {finalMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default GuideViewer;
