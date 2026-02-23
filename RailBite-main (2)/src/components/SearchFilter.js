import React from 'react';

function SearchFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  dietaryType,
  onDietaryTypeChange,
  allergenFree,
  onAllergenFreeChange,
  showFilters = true,
  showDietaryFilters = true
}) {
  return (
    <div className="search-filter-container">
      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search for food items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <span
            className="clear-search"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-gray)',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </span>
        )}
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="filter-controls">
          {/* Sort By */}
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
              <option value="default">Default</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label>Price Range</label>
            <select value={priceRange} onChange={(e) => onPriceRangeChange(e.target.value)}>
              <option value="all">All Prices</option>
              <option value="0-100">Under ৳100</option>
              <option value="100-200">৳100 - ৳200</option>
              <option value="200-300">৳200 - ৳300</option>
              <option value="300+">Above ৳300</option>
            </select>
          </div>

          {/* Dietary Type Filter */}
          {showDietaryFilters && onDietaryTypeChange && (
            <div className="filter-group">
              <label>Dietary</label>
              <select value={dietaryType || 'all'} onChange={(e) => onDietaryTypeChange(e.target.value)}>
                <option value="all">All Types</option>
                <option value="veg">🥬 Vegetarian</option>
                <option value="non-veg">🍖 Non-Veg</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="egg">🥚 Egg</option>
              </select>
            </div>
          )}

          {/* Allergen Filter */}
          {showDietaryFilters && onAllergenFreeChange && (
            <div className="filter-group">
              <label>Allergen Free</label>
              <select value={allergenFree || 'none'} onChange={(e) => onAllergenFreeChange(e.target.value)}>
                <option value="none">No Filter</option>
                <option value="nuts">Nut Free</option>
                <option value="gluten">Gluten Free</option>
                <option value="dairy">Dairy Free</option>
                <option value="eggs">Egg Free</option>
                <option value="soy">Soy Free</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchFilter;
