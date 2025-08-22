import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ShareModal from './ShareModal';
import { FolderIcon } from '@heroicons/react/24/outline';

function FolderItem({ folder, onTrash, onRestore, onDelete }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const isTrashed = folder.trashed || false;

  const handleClick = () => {
    if (!isTrashed) {
      navigate(`/folder/${folder.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center cursor-pointer rounded-lg p-4 bg-white shadow hover:shadow-md transition h-full
        ${isTrashed ? 'opacity-60 cursor-default' : ''}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <FolderIcon className="w-12 h-12 text-blue-500 mb-2" />
      <div className="text-center text-blue-700 font-semibold truncate w-full mb-4">
        {folder.name}
      </div>

      <div className="flex space-x-3 text-sm">
        {!isTrashed ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrash && onTrash();
            }}
            title="Trash"
            className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded"
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
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Restore
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    'Permanently delete this folder? This action cannot be undone.'
                  )
                ) {
                  onDelete && onDelete();
                }
              }}
              title="Delete Permanently"
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Delete
            </button>
          </>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          onKeyDown={(e) => {
            e.stopPropagation(); // Prevent keyboard events bubbling up and triggering folder navigation
          }}
          title="Share"
          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          Share
        </button>

      </div>

      {showModal && (
        <ShareModal
          resourceId={folder.id}
          resourceType="folder"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default FolderItem;