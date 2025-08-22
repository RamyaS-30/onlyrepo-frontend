function SortControls({ sort, setSort, order, setOrder }) {
  return (
    <div className="flex items-center space-x-4">
      <label>
        Sort by:
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-1 border p-1 rounded"
        >
          <option value="name">Name</option>
          <option value="size">Size</option>
          <option value="date">Date</option>
        </select>
      </label>

      <label>
        Order:
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="ml-1 border p-1 rounded"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </label>
    </div>
  );
}

export default SortControls;