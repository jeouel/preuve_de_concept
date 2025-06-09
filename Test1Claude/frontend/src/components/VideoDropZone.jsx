import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function VideoDropZone({ onDrop, uploadedFile, disabled }) {
  const onDropCallback = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles[0]);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-4"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {uploadedFile ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">Vidéo téléchargée:</p>
          <p className="font-semibold text-gray-800">{uploadedFile.originalName}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">
            {isDragActive
              ? 'Déposez la vidéo ici...'
              : 'Glissez-déposez une vidéo ici, ou cliquez pour sélectionner'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Formats supportés: MP4, AVI, MOV, MKV, WebM
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoDropZone;
