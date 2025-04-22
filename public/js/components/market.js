/**
 * Market component for the tower defense game
 */
// Log that market.js is loaded
console.log('Market component loaded');

// Market component
const marketComponent = {
  // Market state
  state: {
    activeTab: 'buy-tab',
    listings: [], // Global market listings
    filters: {
      tower: 'all',
      variant: 'all',
      sort: 'price-asc'
    }
  },

  // Initialize the market component
  init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Update currency display
    this.updateCurrencyDisplay();
  },

  // Set up event listeners
  setupEventListeners() {
    // Market button
    const marketButton = document.getElementById('market-button');
    if (marketButton) {
      marketButton.addEventListener('click', () => this.openMarket());
    }

    // Close button
    const closeMarket = document.getElementById('close-market');
    if (closeMarket) {
      closeMarket.addEventListener('click', () => this.closeMarket());
    }

    // Tab buttons
    const marketTabs = document.querySelectorAll('.market-tab');
    marketTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Filters
    const towerFilter = document.getElementById('market-tower-filter');
    if (towerFilter) {
      towerFilter.addEventListener('change', () => {
        this.state.filters.tower = towerFilter.value;
        this.filterListings();
      });
    }

    const variantFilter = document.getElementById('market-variant-filter');
    if (variantFilter) {
      variantFilter.addEventListener('change', () => {
        this.state.filters.variant = variantFilter.value;
        this.filterListings();
      });
    }

    const sortFilter = document.getElementById('market-sort');
    if (sortFilter) {
      sortFilter.addEventListener('change', () => {
        this.state.filters.sort = sortFilter.value;
        this.filterListings();
      });
    }

    // Create listing button
    const createListingBtn = document.getElementById('create-listing-btn');
    if (createListingBtn) {
      createListingBtn.addEventListener('click', () => this.createListing());
    }

    // Tower select for selling
    const sellTowerSelect = document.getElementById('sell-tower-select');
    if (sellTowerSelect) {
      sellTowerSelect.addEventListener('change', () => this.updateVariantOptions());
    }
  },

  // Open the market
  openMarket() {
    const marketModal = document.getElementById('market-modal');
    if (marketModal) {
      marketModal.style.display = 'block';
      
      // Load market data
      this.loadMarketData();
      
      // Update currency display
      this.updateCurrencyDisplay();
      
      // Update tower options
      this.updateTowerOptions();
      
      // Switch to the active tab
      this.switchTab(this.state.activeTab);
    }
  },

  // Close the market
  closeMarket() {
    const marketModal = document.getElementById('market-modal');
    if (marketModal) {
      marketModal.style.display = 'none';
    }
  },

  // Switch tabs
  switchTab(tabId) {
    // Update active tab
    this.state.activeTab = tabId;
    
    // Update tab buttons
    const tabs = document.querySelectorAll('.market-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab content
    const tabContents = document.querySelectorAll('.market-tab-content');
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    // Load tab-specific data
    if (tabId === 'buy-tab') {
      this.loadMarketListings();
    } else if (tabId === 'sell-tab') {
      this.updateTowerOptions();
    } else if (tabId === 'listings-tab') {
      this.loadPlayerListings();
    }
  },

  // Load market data
  loadMarketData() {
    // In a real implementation, this would fetch data from the server
    // For now, we'll use a mock implementation
    
    // Generate some mock listings if we don't have any
    if (this.state.listings.length === 0) {
      this.generateMockListings();
    }
    
    // Load listings
    this.loadMarketListings();
    
    // Load player listings
    this.loadPlayerListings();
  },

  // Generate mock listings for testing
  generateMockListings() {
    const mockListings = [
      {
        id: 'mock1',
        towerType: 'basic',
        variant: 'gold',
        price: 50,
        sellerId: 'mock-seller-1',
        sellerName: 'Player1',
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'mock2',
        towerType: 'archer',
        variant: 'fire',
        price: 120,
        sellerId: 'mock-seller-2',
        sellerName: 'Player2',
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      {
        id: 'mock3',
        towerType: 'cannon',
        variant: 'explosive',
        price: 200,
        sellerId: 'mock-seller-3',
        sellerName: 'Player3',
        createdAt: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
      },
      {
        id: 'mock4',
        towerType: 'sniper',
        variant: 'railgun',
        price: 350,
        sellerId: 'mock-seller-4',
        sellerName: 'Player4',
        createdAt: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
      },
      {
        id: 'mock5',
        towerType: 'tesla',
        variant: 'storm',
        price: 500,
        sellerId: 'mock-seller-5',
        sellerName: 'Player5',
        createdAt: new Date(Date.now() - 18000000).toISOString() // 5 hours ago
      }
    ];
    
    this.state.listings = mockListings;
  },

  // Load market listings
  loadMarketListings() {
    // Filter and sort listings
    const filteredListings = this.filterListings();
    
    // Get the listings container
    const listingsContainer = document.getElementById('market-buy-listings');
    if (!listingsContainer) return;
    
    // Clear the container
    listingsContainer.innerHTML = '';
    
    // Add listings
    if (filteredListings.length === 0) {
      listingsContainer.innerHTML = '<div class="empty-message">No listings found</div>';
      return;
    }
    
    filteredListings.forEach(listing => {
      const listingElement = this.createListingElement(listing);
      listingsContainer.appendChild(listingElement);
    });
  },

  // Filter listings based on current filters
  filterListings() {
    let filtered = [...this.state.listings];
    
    // Filter by tower
    if (this.state.filters.tower !== 'all') {
      filtered = filtered.filter(listing => listing.towerType === this.state.filters.tower);
    }
    
    // Filter by variant
    if (this.state.filters.variant !== 'all') {
      filtered = filtered.filter(listing => listing.variant === this.state.filters.variant);
    }
    
    // Sort listings
    if (this.state.filters.sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.state.filters.sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (this.state.filters.sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return filtered;
  },

  // Create a listing element
  createListingElement(listing) {
    const listingElement = document.createElement('div');
    listingElement.className = 'market-listing';
    listingElement.dataset.id = listing.id;
    
    // Get tower and variant data
    const towerData = towerStats[listing.towerType] || { name: listing.towerType, color: '#999' };
    const variantData = towerVariants[listing.variant] || { name: listing.variant, color: '#999' };
    
    // Create listing content
    listingElement.innerHTML = `
      <div class="listing-tower" style="background-color: ${towerData.color}">
        <div class="listing-variant" style="background-color: ${variantData.color}"></div>
      </div>
      <div class="listing-info">
        <div class="listing-name">${towerData.name} (${variantData.name})</div>
        <div class="listing-seller">Seller: ${listing.sellerName}</div>
        <div class="listing-time">Listed: ${this.formatTimeAgo(listing.createdAt)}</div>
      </div>
      <div class="listing-price">
        <span class="price-amount">${listing.price}</span>
        <span class="price-currency">Gems</span>
      </div>
      <button class="buy-btn" data-id="${listing.id}">Buy</button>
    `;
    
    // Add buy button event listener
    const buyButton = listingElement.querySelector('.buy-btn');
    buyButton.addEventListener('click', () => this.buyListing(listing.id));
    
    return listingElement;
  },

  // Format time ago
  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // Difference in seconds
    
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  },

  // Buy a listing
  buyListing(listingId) {
    // Find the listing
    const listing = this.state.listings.find(l => l.id === listingId);
    if (!listing) {
      alert('Listing not found');
      return;
    }
    
    // Check if player has enough gems
    if (playerData.gems < listing.price) {
      alert('Not enough gems');
      return;
    }
    
    // Confirm purchase
    if (!confirm(`Are you sure you want to buy ${towerStats[listing.towerType]?.name || listing.towerType} (${towerVariants[listing.variant]?.name || listing.variant}) for ${listing.price} gems?`)) {
      return;
    }
    
    // Spend gems
    if (!spendGems(listing.price)) {
      alert('Failed to spend gems');
      return;
    }
    
    // Add tower to inventory
    addTowerToInventory(listing.towerType, listing.variant);
    
    // Remove listing
    this.state.listings = this.state.listings.filter(l => l.id !== listingId);
    
    // Add to transaction history
    if (!playerData.marketHistory) {
      playerData.marketHistory = [];
    }
    
    playerData.marketHistory.push({
      type: 'buy',
      towerType: listing.towerType,
      variant: listing.variant,
      price: listing.price,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      timestamp: new Date().toISOString()
    });
    
    // Save player data
    savePlayerData();
    
    // Update UI
    this.loadMarketListings();
    this.updateCurrencyDisplay();
    
    // Show success message
    alert(`Successfully purchased ${towerStats[listing.towerType]?.name || listing.towerType} (${towerVariants[listing.variant]?.name || listing.variant})`);
  },

  // Load player's listings
  loadPlayerListings() {
    // Get the listings container
    const listingsContainer = document.getElementById('your-listings');
    if (!listingsContainer) return;
    
    // Clear the container
    listingsContainer.innerHTML = '';
    
    // Get player's listings
    const playerListings = playerData.marketListings || [];
    
    // Add listings
    if (playerListings.length === 0) {
      listingsContainer.innerHTML = '<div class="empty-message">You have no active listings</div>';
      return;
    }
    
    playerListings.forEach(listing => {
      const listingElement = this.createPlayerListingElement(listing);
      listingsContainer.appendChild(listingElement);
    });
  },

  // Create a player listing element
  createPlayerListingElement(listing) {
    const listingElement = document.createElement('div');
    listingElement.className = 'market-listing player-listing';
    listingElement.dataset.id = listing.id;
    
    // Get tower and variant data
    const towerData = towerStats[listing.towerType] || { name: listing.towerType, color: '#999' };
    const variantData = towerVariants[listing.variant] || { name: listing.variant, color: '#999' };
    
    // Create listing content
    listingElement.innerHTML = `
      <div class="listing-tower" style="background-color: ${towerData.color}">
        <div class="listing-variant" style="background-color: ${variantData.color}"></div>
      </div>
      <div class="listing-info">
        <div class="listing-name">${towerData.name} (${variantData.name})</div>
        <div class="listing-time">Listed: ${this.formatTimeAgo(listing.createdAt)}</div>
      </div>
      <div class="listing-price">
        <span class="price-amount">${listing.price}</span>
        <span class="price-currency">Gems</span>
      </div>
      <button class="cancel-btn" data-id="${listing.id}">Cancel</button>
    `;
    
    // Add cancel button event listener
    const cancelButton = listingElement.querySelector('.cancel-btn');
    cancelButton.addEventListener('click', () => this.cancelListing(listing.id));
    
    return listingElement;
  },

  // Cancel a listing
  cancelListing(listingId) {
    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel this listing?')) {
      return;
    }
    
    // Cancel the listing
    if (cancelMarketListing(listingId)) {
      // Update UI
      this.loadPlayerListings();
      
      // Show success message
      alert('Listing cancelled successfully');
    } else {
      // Show error message
      alert('Failed to cancel listing');
    }
  },

  // Update tower options for selling
  updateTowerOptions() {
    // Get the tower select element
    const towerSelect = document.getElementById('sell-tower-select');
    if (!towerSelect) return;
    
    // Clear the select
    towerSelect.innerHTML = '';
    
    // Add tower options
    Object.keys(playerData.towerInventory || {}).forEach(towerType => {
      // Skip towers with no inventory
      if (!playerData.towerInventory[towerType] || playerData.towerInventory[towerType].count <= 0) {
        return;
      }
      
      const towerData = towerStats[towerType] || { name: towerType };
      const count = playerData.towerInventory[towerType].count;
      
      const option = document.createElement('option');
      option.value = towerType;
      option.textContent = `${towerData.name} (${count})`;
      towerSelect.appendChild(option);
    });
    
    // Update variant options
    this.updateVariantOptions();
  },

  // Update variant options for selling
  updateVariantOptions() {
    // Get the tower select element
    const towerSelect = document.getElementById('sell-tower-select');
    if (!towerSelect) return;
    
    // Get the selected tower
    const selectedTower = towerSelect.value;
    if (!selectedTower) return;
    
    // Get the variant select element
    const variantSelect = document.getElementById('sell-variant-select');
    if (!variantSelect) return;
    
    // Clear the select
    variantSelect.innerHTML = '';
    
    // Add variant options
    const variants = playerData.towerInventory[selectedTower]?.variants || {};
    
    Object.keys(variants).forEach(variant => {
      // Skip variants with no inventory
      if (variants[variant] <= 0) {
        return;
      }
      
      const variantData = towerVariants[variant] || { name: variant };
      const count = variants[variant];
      
      const option = document.createElement('option');
      option.value = variant;
      option.textContent = `${variantData.name} (${count})`;
      variantSelect.appendChild(option);
    });
  },

  // Create a new listing
  createListing() {
    // Get the tower select element
    const towerSelect = document.getElementById('sell-tower-select');
    if (!towerSelect) return;
    
    // Get the selected tower
    const selectedTower = towerSelect.value;
    if (!selectedTower) {
      alert('Please select a tower');
      return;
    }
    
    // Get the variant select element
    const variantSelect = document.getElementById('sell-variant-select');
    if (!variantSelect) return;
    
    // Get the selected variant
    const selectedVariant = variantSelect.value;
    if (!selectedVariant) {
      alert('Please select a variant');
      return;
    }
    
    // Get the price input
    const priceInput = document.getElementById('sell-price');
    if (!priceInput) return;
    
    // Get the price
    const price = parseInt(priceInput.value);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    // Create the listing
    const listing = createMarketListing(selectedTower, selectedVariant, price);
    if (!listing) {
      alert('Failed to create listing');
      return;
    }
    
    // Add to global listings
    this.state.listings.push(listing);
    
    // Update UI
    this.loadPlayerListings();
    this.updateTowerOptions();
    
    // Show success message
    alert('Listing created successfully');
  },

  // Update currency display
  updateCurrencyDisplay() {
    // Update silver display
    const silverDisplay = document.getElementById('market-silver-amount');
    if (silverDisplay) {
      silverDisplay.textContent = playerData.silver;
    }
    
    // Update gems display
    const gemsDisplay = document.getElementById('market-gems-amount');
    if (gemsDisplay) {
      gemsDisplay.textContent = playerData.gems;
    }
  }
};

// Initialize the market component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  marketComponent.init();
});
