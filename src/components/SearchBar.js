import { useState, useMemo } from 'react';
import debounce from 'lodash.debounce';
//import axios from 'axios';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  // Debounce API calls by 300ms
  const debounced = useMemo(
    () => debounce((val) => onSearch(val), 300),
    [onSearch]
  );

  const handleChange = (e) => {
    setQuery(e.target.value);
    debounced(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="Search..."
      value={query}
      onChange={handleChange}
      className="border p-2 rounded w-full"
    />
  );
}

export default SearchBar;