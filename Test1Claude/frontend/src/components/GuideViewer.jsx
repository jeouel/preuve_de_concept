import ReactMarkdown from 'react-markdown';

function GuideViewer({ guide, loading }) {
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

  // Toujours afficher le texte comme du Markdown
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[800px] overflow-y-auto text-gray-800">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

export default GuideViewer;
