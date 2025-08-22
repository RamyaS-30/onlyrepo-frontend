import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function UploadArea({ folderId, token, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!token) {
        alert('User is not authenticated.');
        return;
      }

      setUploading(true);

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        if (folderId && isUUID(folderId)) {
          formData.append('folder_id', folderId);
        }
        console.log('📦 Received folder_id from frontend:', folderId);
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/files/upload`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (e) => {
              const percent = Math.round((e.loaded * 100) / e.total);
              setProgress(percent);
            },
          });

          onUploadSuccess(); // Refresh the file list
        } catch (err) {
          console.error('Upload error:', err.response?.data || err.message);
          alert(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
      setProgress(0);
    },
    [folderId, token, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-4 rounded cursor-pointer text-center transition ${
        isDragActive ? 'bg-blue-100' : 'bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div>
          <p className="mb-2">Uploading... {progress}%</p>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-500 rounded transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Drag & drop files here, or click to select</p>
      )}
    </div>
  );
}

export default UploadArea;