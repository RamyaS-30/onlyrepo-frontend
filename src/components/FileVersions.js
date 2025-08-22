import { useEffect, useState } from 'react';
import axios from 'axios';
import supabase from '../pages/supabaseClient';

function FileVersions({ fileId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/${fileId}/versions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setVersions(response.data || []);
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [fileId]);

  const handleDownload = async (versionId, filename) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Not authenticated');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/versions/${versionId}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Check console for details.');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading versions...</p>;
  if (versions.length === 0) return <p className="text-sm text-gray-400">No versions found.</p>;

  return (
    <div className="mt-2 text-left text-sm border rounded p-3 bg-gray-50 w-full min-w-[280px] max-w-[300px]">
  <h4 className="font-medium mb-2">Version History</h4>
  <ul className="space-y-2">
    {versions.map((v, index) => (
      <li
        key={v.id || index}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-1 last:border-b-0"
      >
        <div className="mb-1 sm:mb-0 break-words whitespace-normal w-full">
          <p className="text-gray-800 break-words">{v.name}</p>
          <p className="text-gray-500 text-xs">
            {Math.round(v.size / 1024)} KB • {new Date(v.created_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => handleDownload(v.id, v.name)}
          className="mt-2 sm:mt-0 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
        >
          Download
        </button>
      </li>
    ))}
  </ul>
</div>
  );
}

export default FileVersions;