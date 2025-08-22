import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../pages/supabaseClient';

function SharePage() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSharedResource() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${process.env.REACT_APP_API_URL}/share/access/${shareId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load shared resource');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchSharedResource();
  }, [shareId]);

  if (error) return <div className="text-center mt-10 text-red-600 font-semibold">Error: {error}</div>;
  if (!data) return <div className="text-center mt-10 text-gray-600">Loading...</div>;

  const { resource, role, resource_type } = data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-md p-6 max-w-md w-full text-center">
        <h1 className="text-xl font-bold mb-4 text-blue-600">Shared Resource</h1>

        <div className="text-left space-y-2">
          <p><strong className="text-gray-700">Name:</strong> {resource.name || resource.title || 'Unnamed'}</p>
          <p><strong className="text-gray-700">Type:</strong> {resource_type === 'file' ? 'File 📄' : 'Folder 📁'}</p>
          <p><strong className="text-gray-700">Access Role:</strong> {role}</p>

          {resource_type === 'file' && resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Download File
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharePage;