import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { listGuides } from '../services/api';

const GuideHistory = forwardRef((props, ref) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGuides = () => {
    setLoading(true);
    setError(null);
    listGuides()
      .then(data => {
        setGuides(data.guides || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement de l\'historique.');
        setLoading(false);
      });
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchGuides
  }));

  useEffect(() => {
    fetchGuides();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Historique des guides sauvegardés</h2>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-700">{error}</div>}
      {!loading && !error && guides.length === 0 && <div>Aucun guide sauvegardé.</div>}
      <ul className="space-y-2">
        {guides.map(filename => (
          <li key={filename} className="flex items-center justify-between border-b pb-2">
            <span>{filename}</span>
            <span>
              <a
                href={`/guides/${filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mr-4"
              >
                Visualiser
              </a>
              <a
                href={`/guides/${filename}`}
                download={filename}
                className="text-green-600 hover:underline"
              >
                Télécharger
              </a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default GuideHistory; 