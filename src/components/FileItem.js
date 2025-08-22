import { useState } from 'react';
import ShareModal from './ShareModal';
import FileVersions from './FileVersions';
import axios from 'axios';
import supabase from '../pages/supabaseClient';

function FileItem({ file, onTrash, onRestore, onDelete, onVersionUploaded }) {
  const [showModal, setShowModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isImage = file.mime_type?.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  const isText = file.mime_type?.startsWith('text/');
  const isTrashed = file.trashed || false;

  const handleVersionUpload = async (e) => {
  const selectedFile = e.target.files[0];
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

      if (!token) {
        alert('Not authenticated. Please log in again.');
        return;
      }
    await axios.post(`${process.env.REACT_APP_API_URL}/files/${file.id}/new-version`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}` },
    });
    alert('New version uploaded!');
    // Optionally, refresh file data or trigger parent reload
    if (onVersionUploaded) onVersionUploaded();
  } catch (err) {
    console.error('Version upload failed:', err);
    alert('Failed to upload new version');
  } finally {
    setUploading(false);
  }
};

  return (
    <div
      className={`relative bg-white p-4 rounded-lg shadow text-center cursor-default hover:shadow-md transition
        flex flex-col md:flex-row md:items-start md:justify-between
        w-full md:max-w-[500px] md:min-w-[400px] md:h-auto
        ${isTrashed ? 'opacity-80' : ''}
      `}
    >
      {/* Left: preview and info */}
      <div className="md:w-2/3">
        <div className="font-medium truncate mb-1">{file.name}</div>
        <div className="text-xs text-gray-500 mb-2">{Math.round(file.size / 1024)} KB</div>

        {isImage && (
          <img
            src={file.public_url}
            alt={file.name}
            className="mx-auto rounded object-contain max-h-48 w-full md:w-auto"
            loading="lazy"
          />
        )}

        {isPdf && (
          <iframe
            src={file.public_url}
            title={file.name}
            className="w-full h-40 rounded md:h-48"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {isText && (
          <iframe
            src={file.public_url}
            title={file.name}
            className="w-full h-24 bg-white rounded md:h-32"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Download button (non-image, pdf, text) */}
        {!isTrashed && !isImage && !isPdf && !isText && (
          <a
            href={file.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 sm:mt-0 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
          >
            Download
          </a>
        )}
      </div>

      {/* Right: actions */}
      <div className="mt-4 md:mt-0 md:w-1/3 flex flex-col items-center md:items-end space-y-3">

        {/* Upload New Version */}
        {!isTrashed && (
          <div className="text-sm w-full">
            <label className="block text-gray-700 mb-1 break-words whitespace-normal text-center md:text-right">
              Upload new version:
            </label>
            <div className="flex flex-col items-center text-center">
              <input
                type="file"
                onChange={handleVersionUpload}
                disabled={uploading}
                className="text-sm text-gray-900 file:mb-1 file:py-1 file:px-2 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        {/* Show Versions toggle */}
        {!isTrashed && (
          <div className="text-sm">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="text-emerald-600 hover:text-emerald-800 focus:ring-emerald-400"
            >
              {showVersions ? 'Hide Versions' : 'Show Versions'}
            </button>
          </div>
        )}

        {/* File version list */}
        {!isTrashed && showVersions && (
          <FileVersions fileId={file.id} />
        )}

        {/* Buttons */}
        <div className="flex flex-col md:flex-row md:space-x-3 space-y-2 md:space-y-0 w-full md:w-auto">
          {!isTrashed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrash && onTrash();
              }}
              title="Trash"
              className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded w-full md:w-auto"
            >
              Trash
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore && onRestore();
                }}
                title="Restore"
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded w-full md:w-auto"
              >
                Restore
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Permanently delete this file? This action cannot be undone.')) {
                    onDelete && onDelete();
                  }
                }}
                title="Delete Permanently"
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded w-full md:w-auto"
              >
                Delete
              </button>
            </>
          )}

          {/* Share button (not shown in Trash) */}
          {!isTrashed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              title="Share"
              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded w-full md:w-auto"
            >
              Share
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <ShareModal
          resourceId={file.id}
          resourceType="file"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
export default FileItem;