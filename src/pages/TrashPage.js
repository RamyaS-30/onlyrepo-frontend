import React, { useEffect, useState } from 'react';
import FileItem from '../components/FileItem';
import FolderItem from '../components/FolderItem';

function TrashPage() {
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [trashedFolders, setTrashedFolders] = useState([]);

  useEffect(() => {
    // 🔁 Replace with your API calls
    fetch('/api/files?trashed=true')
      .then((res) => res.json())
      .then(setTrashedFiles);

    fetch('/api/folders?trashed=true')
      .then((res) => res.json())
      .then(setTrashedFolders);
  }, []);

  const handleRestoreFile = (fileId) => {
    // 🔁 Replace with your restore API
    fetch(`/api/files/${fileId}/restore`, { method: 'POST' })
      .then(() => setTrashedFiles(prev => prev.filter(f => f.id !== fileId)));
  };

  const handleDeleteFile = (fileId) => {
    // 🔁 Replace with your delete API
    fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      .then(() => setTrashedFiles(prev => prev.filter(f => f.id !== fileId)));
  };

  const handleRestoreFolder = (folderId) => {
    fetch(`/api/folders/${folderId}/restore`, { method: 'POST' })
      .then(() => setTrashedFolders(prev => prev.filter(f => f.id !== folderId)));
  };

  const handleDeleteFolder = (folderId) => {
    fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      .then(() => setTrashedFolders(prev => prev.filter(f => f.id !== folderId)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-red-600">Trash</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trashedFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onRestore={() => handleRestoreFolder(folder.id)}
            onDelete={() => handleDeleteFolder(folder.id)}
          />
        ))}

        {trashedFiles.map(file => (
          <FileItem
            key={file.id}
            file={file}
            onRestore={() => handleRestoreFile(file.id)}
            onDelete={() => handleDeleteFile(file.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default TrashPage;