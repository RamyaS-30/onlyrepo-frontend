import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';
import UploadArea from '../components/UploadArea';
import FolderItem from '../components/FolderItem';
import FileItem from '../components/FileItem';
import Breadcrumbs from '../components/Breadcrumbs';
import SearchBar from '../components/SearchBar';
import SortControls from '../components/SortControls';
import { MdCloudUpload } from "react-icons/md";

function Dashboard() {
  const { folderId } = useParams();
  const navigate = useNavigate();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Search, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');  // Added order state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [viewingTrash, setViewingTrash] = useState(false);
  const [mediaType, setMediaType] = useState('all'); // all, image, document, video, other
  const [storageInfo, setStorageInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

const refreshFiles = () => setRefreshToggle(prev => !prev);


const cleanedFolderId = (!folderId || folderId === 'undefined' || folderId === 'null') ? null : folderId;
  
useEffect(() => {
  const fetchStorageInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/files/storage/usage`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch storage info:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Fetched storage info:', data);
      setStorageInfo(data);
    } catch (error) {
      console.error('Error fetching storage info:', error);
    }
  };

  fetchStorageInfo();
}, []);

  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    }

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  // Reset page on filter/search/folder change
  useEffect(() => {
    setFolders([]);
    setFiles([]);
    setPage(1);
    setHasMore(true);
  }, [searchTerm, sort, order, cleanedFolderId, viewingTrash]);

  // Calculate offset from page and limit
  const offset = (page - 1) * limit;

  // Fetch folders and files
  useEffect(() => {
    async function fetchData() {
      if (!session) return;

      try {
        const token = session.access_token;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        let fetchedFolders = [];
        let fetchedFiles = [];

        if (searchTerm.trim()) {
          // Use unified /api/search endpoint
          const searchUrl = new URL(`${process.env.REACT_APP_API_URL}/search`);
          searchUrl.searchParams.append('q', searchTerm);
          searchUrl.searchParams.append('limit', limit);
          searchUrl.searchParams.append('offset', offset);
          searchUrl.searchParams.append('sort', sort);
          searchUrl.searchParams.append('order', order);
          searchUrl.searchParams.append('folder_id', cleanedFolderId ?? 'null');

          const response = await fetch(searchUrl.toString(), { headers });

          if (!response.ok) {
            throw new Error('Failed to fetch search results');
          }

          const result = await response.json();
          fetchedFolders = result.folders || [];
          fetchedFiles = result.files || [];
        } else {
          // Use standard folders/files listing endpoints
          let foldersUrl, filesUrl;

          if (viewingTrash) {
            foldersUrl = new URL(`${process.env.REACT_APP_API_URL}/folders/trash`);
            filesUrl = new URL(`${process.env.REACT_APP_API_URL}/files/trash`);
          } else {
            foldersUrl = new URL(`${process.env.REACT_APP_API_URL}/folders`);
            filesUrl = new URL(`${process.env.REACT_APP_API_URL}/files`);
            foldersUrl.searchParams.append('parent_folder_id', cleanedFolderId ?? 'null');
            filesUrl.searchParams.append('folder_id', cleanedFolderId ?? 'null');
            foldersUrl.searchParams.append('sort', sort);
            filesUrl.searchParams.append('sort', sort);
            foldersUrl.searchParams.append('order', order);
            filesUrl.searchParams.append('order', order);
            foldersUrl.searchParams.append('limit', limit);
            filesUrl.searchParams.append('limit', limit);
            foldersUrl.searchParams.append('offset', offset);
            filesUrl.searchParams.append('offset', offset);
          }
          
          const [foldersRes, filesRes] = await Promise.all([
            fetch(foldersUrl, { headers }),
            fetch(filesUrl, { headers }),
          ]);

          if (!foldersRes.ok || !filesRes.ok) {
            throw new Error('Failed to fetch folders or files');
          }

          fetchedFolders = await foldersRes.json();
          fetchedFiles = await filesRes.json();

          if (viewingTrash) {
            fetchedFolders = fetchedFolders.map(folder => ({ ...folder, trashed: true }));
            fetchedFiles = fetchedFiles.map(file => ({ ...file, trashed: true }));
          }
        }

        setFolders((prev) => (page === 1 ? fetchedFolders : [...prev, ...fetchedFolders]));
        setFiles((prev) => (page === 1 ? fetchedFiles : [...prev, ...fetchedFiles]));
        setHasMore(fetchedFolders.length + fetchedFiles.length >= limit);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      }
    }

    fetchData();
  }, [cleanedFolderId, session, refreshToggle, searchTerm, sort, order, page, offset, limit, viewingTrash]);

  // Fetch current folder info
  useEffect(() => {
    async function fetchCurrentFolder() {
      if (!session) return;

      if (!cleanedFolderId) {
        setCurrentFolder(null);
        return;
      }

      try {
        const token = session.access_token;
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/folders/${cleanedFolderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch folder info');

        const folderData = await res.json();
        setCurrentFolder(folderData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCurrentFolder(null);
        console.error('Error fetching folder info:', err);
      }
    }

    fetchCurrentFolder();
  }, [cleanedFolderId, session]);

  // Infinite scroll handler
  useEffect(() => {
    function handleScroll() {
      const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (bottom && hasMore) {
        setPage((prev) => prev + 1);
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/login');
  }

  async function handleLogin() {
    navigate('/login');
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);

    try {
      const token = session.access_token;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_folder_id: cleanedFolderId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create folder');

      const newFolder = await response.json();
      setNewFolderName('');
      navigate(`/folder/${newFolder.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingFolder(false);
    }
  }

  const handleUploadSuccess = useCallback(() => {
    setRefreshToggle((prev) => !prev);
  }, []);

  // --- New handlers for trash, restore, and permanent delete ---

  async function trashFile(fileId) {
  if (!session) return;
  try {
    const token = session.access_token;
    const res = await fetch(`${process.env.REACT_APP_API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to trash file');
    setRefreshToggle((prev) => !prev);
  } catch (err) {
    alert(err.message);
  }
}

  async function restoreFile(fileId) {
    if (!session) return;
    try {
      const token = session.access_token;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/files/${fileId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to restore file');
      setRefreshToggle((prev) => !prev);
    } catch (err) {
      alert(err.message);
    }
  }

  async function permanentlyDeleteFile(fileId) {
    if (!session) return;
    try {
      const token = session.access_token;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/files/${fileId}/permanent`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to permanently delete file');
      setRefreshToggle((prev) => !prev);
    } catch (err) {
      alert(err.message);
    }
  }

  async function trashFolder(folderId) {
  if (!session) return;
  try {
    const token = session.access_token;
    const res = await fetch(`${process.env.REACT_APP_API_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to trash folder');
    setRefreshToggle((prev) => !prev);
  } catch (err) {
    alert(err.message);
  }
}

  async function restoreFolder(folderId) {
    if (!session) return;
    try {
      const token = session.access_token;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/folders/${folderId}/restore`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to restore folder');
      setRefreshToggle((prev) => !prev);
    } catch (err) {
      alert(err.message);
    }
  }

  async function permanentlyDeleteFolder(folderId) {
    if (!session) return;
    try {
      const token = session.access_token;
      const res = await fetch(`${process.env.REACT_APP_API_URL}/folders/${folderId}/permanent`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to permanently delete folder');
      setRefreshToggle((prev) => !prev);
    } catch (err) {
      alert(err.message);
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h2 className="text-2xl font-semibold mb-4">You are not logged in</h2>
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Logout
        </button>
      </div>
    );
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico'];
const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

function getExtension(filename) {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

const filteredFiles = files.filter((file) => {
  const mime = file.mime_type || '';
  const name = file.name || '';
  const ext = '.' + getExtension(name);

  if (mediaType === 'all') return true;

  if (mediaType === 'image') {
    return mime.startsWith('image/') || imageExtensions.includes(ext);
  }

  if (mediaType === 'video') {
    return mime.startsWith('video/') || videoExtensions.includes(ext);
  }

  if (mediaType === 'document') {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ].includes(mime) || documentExtensions.includes(ext);
  }

  if (mediaType === 'other') {
    const isImage = mime.startsWith('image/') || imageExtensions.includes(ext);
    const isVideo = mime.startsWith('video/') || videoExtensions.includes(ext);
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ].includes(mime) || documentExtensions.includes(ext);

    return !isImage && !isVideo && !isDocument;
  }

  return true;
});
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
  className={`
    bg-white border-r border-gray-200 p-6 flex-col
    md:flex md:w-64
    ${sidebarOpen ? 'fixed top-0 left-0 h-full w-64 z-50 shadow-lg' : 'hidden'}
  `}
>
  {/* Add a close button visible only on mobile */}
  <button
  className="absolute top-4 right-4 p-2 rounded hover:bg-gray-200 md:hidden"
  onClick={() => setSidebarOpen(false)}
  aria-label="Close Menu"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-800"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <MdCloudUpload className="text-blue-600 text-3xl" />
          <span>Only Repo</span>
        </h2>

        <button
          onClick={() => {
            setViewingTrash(false);
            setMediaType('all');
            }}
          className={`mb-2 text-left px-4 py-2 rounded hover:bg-blue-100 ${
            !viewingTrash && mediaType === 'all' ? 'bg-blue-200 text-blue-800' : 'text-gray-800'}`}>
          All Files
        </button>

        <button
          onClick={() => {
            setViewingTrash(false);
            setMediaType('image');
          }}
          className={`mb-2 text-left px-4 py-2 rounded hover:bg-blue-100 ${
            mediaType === 'image' ? 'bg-blue-200 text-blue-800' : 'text-gray-800'
          }`}
        >
          Images
        </button>
        
        <button
          onClick={() => {
            setViewingTrash(false);
            setMediaType('document');
          }}
          className={`mb-2 text-left px-4 py-2 rounded hover:bg-blue-100 ${
            mediaType === 'document' ? 'bg-blue-200 text-blue-800' : 'text-gray-800'
          }`}
        >
          Documents
        </button>
        
        <button
          onClick={() => {
            setViewingTrash(false);
            setMediaType('video');
          }}
          className={`mb-2 text-left px-4 py-2 rounded hover:bg-blue-100 ${
            mediaType === 'video' ? 'bg-blue-200 text-blue-800' : 'text-gray-800'
          }`}
        >
          Videos
        </button>
        
        <button
          onClick={() => {
            setViewingTrash(false);
            setMediaType('other');
          }}
          className={`mb-4 text-left px-4 py-2 rounded hover:bg-blue-100 ${
            mediaType === 'other' ? 'bg-blue-200 text-blue-800' : 'text-gray-800'
          }`}
        >
          Other
        </button>
        

  <button
    onClick={() => {
      setViewingTrash(true);
      setMediaType('all');
    }}
    className={`mb-4 text-left px-4 py-2 rounded hover:bg-red-100 ${
      viewingTrash ? 'bg-red-200 text-red-800' : 'text-gray-800'
    }`}
  >
    Trash
  </button>

  {storageInfo ? (
    <div className="mt-6">
      <div className="text-sm text-gray-700 font-semibold mb-1">Storage Usage</div>
    
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{(storageInfo.used / 1024 / 1024).toFixed(2)} MB</span>
        <span>{storageInfo.percent.toFixed(1)}%</span>
        <span>{(storageInfo.max / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className={`
            h-full rounded transition-all duration-300
            ${storageInfo.percent < 70
              ? 'bg-green-500'
              : storageInfo.percent < 90
              ? 'bg-yellow-500'
              : 'bg-red-500'}
          `}
          style={{ width: `${storageInfo.percent}%` }}
          title={`${storageInfo.percent.toFixed(1)}% used`}
        ></div>
      </div>
    </div>
  ) : (
    <div className="mt-6 text-sm text-gray-500">Loading storage info...</div>
  )}

  <button
    onClick={handleLogout}
    className="mt-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
  >
    Logout
  </button>
  
</aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 overflow-auto">
        <button
  className="md:hidden mb-4 p-2 rounded hover:bg-gray-200 self-start"
  onClick={() => setSidebarOpen(true)}
  aria-label="Open Menu"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>

        <Breadcrumbs folderId={cleanedFolderId} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-3xl font-semibold truncate max-w-xs">
            {viewingTrash ? 'Trash' : currentFolder ? currentFolder.name : 'Dashboard'}
          </h1>


          {!viewingTrash && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="New Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-48"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
              }}
              disabled={creatingFolder}
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        )}

        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <SearchBar onSearch={setSearchTerm} />
          <SortControls
            sort={sort}
            setSort={setSort}
            order={order}
            setOrder={setOrder}
          />
        </div>

        <section className="flex-1 overflow-auto">
          {folders.length === 0 && files.length === 0 && page === 1 ? (
            <p className="text-gray-500 text-center mt-20">
              No folders or files found.
            </p>
          ) : (
            <>
              {mediaType === 'all' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
                  {folders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      onTrash={() => trashFolder(folder.id)}
                      onRestore={() => restoreFolder(folder.id)}
                      onDelete={() => permanentlyDeleteFolder(folder.id)}
                    />
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onTrash={() => trashFile(file.id)}
                    onRestore={() => restoreFile(file.id)}
                    onDelete={() => permanentlyDeleteFile(file.id)}
                    onVersionUploaded={refreshFiles}
                  />
                ))}

              </div>
            </>
          )}
        </section>

        {!viewingTrash && (
        <UploadArea
          folderId={cleanedFolderId}
          token={session?.access_token}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      </main>
    </div>
  );
}

export default Dashboard;
