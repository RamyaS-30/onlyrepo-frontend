import { useState } from 'react';
import axios from 'axios';
import copy from 'copy-to-clipboard';
import { toast } from 'react-toastify';
import supabase from '../pages/supabaseClient'; // Adjust path if needed

function ShareModal({ resourceId, resourceType, onClose }) {
  const [role, setRole] = useState('viewer');
  const [link, setLink] = useState('');

  const handleShare = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('You must be logged in to generate a link');
        return;
      }

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/share/link`,
        { resource_id: resourceId, resource_type: resourceType, role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLink(res.data.link);
      toast.success('Link generated!');
    } catch (error) {
      console.error('Share link error:', error);
      toast.error('Failed to generate link');
    }
  };

  const handleCopy = () => {
    if (!link) return;
    copy(link);
    toast.success('Link copied');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Share {resourceType}</h2>
        <div>
          <label className="block mb-1">Permission:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </div>
        <button onClick={handleShare} className="bg-blue-500 text-white px-4 py-2 rounded">
          Generate Link
        </button>
        {link && (
          <>
            <div className="bg-gray-100 p-2 rounded break-all">{link}</div>
            <button onClick={handleCopy} className="bg-green-500 text-white px-4 py-2 rounded">
              Copy Link
            </button>
          </>
        )}
        <button onClick={onClose} className="text-gray-500 hover:underline mt-2">
          Close
        </button>
      </div>
    </div>
  );
}

export default ShareModal;