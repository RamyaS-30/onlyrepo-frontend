import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../pages/supabaseClient';

function Breadcrumbs({ folderId }) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBreadcrumbs() {
      if (!folderId) {
        setBreadcrumbs([]);
        return;
      }

      setLoading(true);

      try {
        // Get session once
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setBreadcrumbs([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.REACT_APP_API_URL}/folders/${folderId}/breadcrumbs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch breadcrumb path');

        const pathData = await res.json();
        setBreadcrumbs(pathData || []);
      } catch (err) {
        console.error('Error fetching breadcrumbs:', err);
        setBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBreadcrumbs();
  }, [folderId]);

  // Add Dashboard as root crumb
  const allCrumbs = [{ id: 'dashboard', name: 'Dashboard' }, ...breadcrumbs];

  if (loading) {
    return (
      <nav aria-label="breadcrumb" className="mb-6 text-2xl font-semibold">
        Loading...
      </nav>
    );
  }

  if (allCrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-2xl font-semibold mb-6">
      {allCrumbs.map((crumb, idx) => {
        const isLast = idx === allCrumbs.length - 1;
        const linkTo = crumb.id === 'dashboard' ? '/dashboard' : `/folder/${crumb.id}`;

        return (
          <span key={crumb.id} className="flex items-center">
            {isLast ? (
              <span>{crumb.name}</span>
            ) : (
              <Link to={linkTo} className="hover:underline">
                {crumb.name}
              </Link>
            )}
            {!isLast && <span className="mx-2 text-gray-500">{'>'}</span>}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;