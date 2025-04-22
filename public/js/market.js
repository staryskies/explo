/**
 * Market functionality for the tower defense game
 */
// Log that market.js is loaded
console.log('Market component loaded');

// Market object
const market = {
  // Current market data
  data: {
    listings: [],
    myListings: []
  },

  // Initialize market
  initialize() {
    // Get DOM elements
    this.marketModal = document.getElementById('market-modal');
    this.closeMarket = document.getElementById('close-market');
    this.marketTabs = document.querySelectorAll('.market-tab');
    this.marketTabContents = document.querySelectorAll('.market-tab-content');
    
    // Listings table
    this.listingsTable = document.getElementById('listings-table');
    this.listingsTableBody = this.listingsTable?.querySelector('tbody');
    
    // My listings table
    this.myListingsTable = document.getElementById('my-listings-table');
    this.myListingsTableBody = this.myListingsTable?.querySelector('tbody');
    
    // Initialize event listeners
    this.initEventListeners();
    
    console.log('Market initialized');
  },
  
  // Initialize event listeners
  initEventListeners() {
    // Close market modal
    if (this.closeMarket) {
      this.closeMarket.addEventListener('click', () => {
        this.marketModal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === this.marketModal) {
        this.marketModal.style.display = 'none';
      }
    });
    
    // Tab switching
    this.marketTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        this.marketTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab contents
        this.marketTabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        // Show selected tab content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  },
  
  // Open market modal
  openMarket() {
    // Load market data
    this.loadMarketData();
    
    // Show modal
    this.marketModal.style.display = 'block';
  },
  
  // Load market data
  async loadMarketData() {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Load data from server or local storage
      await this.loadListings();
      await this.loadMyListings();
      
      console.log('Market data loaded');
    } catch (error) {
      console.error('Error loading market data:', error);
      this.showErrorState('Failed to load market data. Please try again later.');
    }
  },
  
  // Show loading state
  showLoadingState() {
    const loadingHtml = `
      <tr>
        <td colspan="5" class="loading-cell">
          <div class="loading-spinner"></div>
          <div>Loading market data...</div>
        </td>
      </tr>
    `;
    
    if (this.listingsTableBody) {
      this.listingsTableBody.innerHTML = loadingHtml;
    }
    
    if (this.myListingsTableBody) {
      this.myListingsTableBody.innerHTML = loadingHtml;
    }
  },
  
  // Show error state
  showErrorState(message) {
    const errorHtml = `
      <tr>
        <td colspan="5" class="error-cell">
          <div class="error-icon">⚠️</div>
          <div>${message}</div>
        </td>
      </tr>
    `;
    
    if (this.listingsTableBody) {
      this.listingsTableBody.innerHTML = errorHtml;
    }
    
    if (this.myListingsTableBody) {
      this.myListingsTableBody.innerHTML = errorHtml;
    }
  },
  
  // Load listings
  async loadListings() {
    try {
      // For static version, use mock data
      const mockListings = [
        { id: 1, seller: 'Player1', item: 'Cannon Tower', variant: 'Fire', price: 500, date: '2023-06-15' },
        { id: 2, seller: 'Player2', item: 'Tesla Tower', variant: 'Ice', price: 750, date: '2023-06-14' },
        { id: 3, seller: 'Player3', item: 'Sniper Tower', variant: 'Poison', price: 1000, date: '2023-06-13' },
        { id: 4, seller: 'Player4', item: 'Missile Tower', variant: 'Lightning', price: 1250, date: '2023-06-12' },
        { id: 5, seller: 'Player5', item: 'Laser Tower', variant: 'Water', price: 1500, date: '2023-06-11' },
        { id: 6, seller: 'Player6', item: 'Gatling Tower', variant: 'Earth', price: 1750, date: '2023-06-10' },
        { id: 7, seller: 'Player7', item: 'Mortar Tower', variant: 'Wind', price: 2000, date: '2023-06-09' },
        { id: 8, seller: 'Player8', item: 'Flamethrower Tower', variant: 'Shadow', price: 2250, date: '2023-06-08' },
        { id: 9, seller: 'Player9', item: 'Frost Tower', variant: 'Light', price: 2500, date: '2023-06-07' },
        { id: 10, seller: 'Player10', item: 'Poison Tower', variant: 'Dark', price: 2750, date: '2023-06-06' }
      ];
      
      // Update data
      this.data.listings = mockListings;
      
      // Update table
      if (this.listingsTableBody) {
        this.listingsTableBody.innerHTML = '';
        
        mockListings.forEach(listing => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${listing.seller}</td>
            <td>${listing.item}</td>
            <td>${listing.variant || 'None'}</td>
            <td>${listing.price} Silver</td>
            <td>
              <button class="buy-btn" data-id="${listing.id}">Buy</button>
            </td>
          `;
          this.listingsTableBody.appendChild(row);
        });
        
        // Add event listeners to buy buttons
        const buyButtons = this.listingsTableBody.querySelectorAll('.buy-btn');
        buyButtons.forEach(button => {
          button.addEventListener('click', () => {
            const listingId = button.getAttribute('data-id');
            this.buyListing(listingId);
          });
        });
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      throw error;
    }
  },
  
  // Load my listings
  async loadMyListings() {
    try {
      // Check if user is logged in
      if (!window.authService.isLoggedIn()) {
        if (this.myListingsTableBody) {
          this.myListingsTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="info-cell">
                <div>Please log in to view your listings.</div>
              </td>
            </tr>
          `;
        }
        return;
      }
      
      // For static version, use mock data
      const mockMyListings = [
        { id: 11, item: 'Cannon Tower', variant: 'Fire', price: 500, date: '2023-06-15' },
        { id: 12, item: 'Tesla Tower', variant: 'Ice', price: 750, date: '2023-06-14' },
        { id: 13, item: 'Sniper Tower', variant: 'Poison', price: 1000, date: '2023-06-13' }
      ];
      
      // Update data
      this.data.myListings = mockMyListings;
      
      // Update table
      if (this.myListingsTableBody) {
        this.myListingsTableBody.innerHTML = '';
        
        if (mockMyListings.length === 0) {
          this.myListingsTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="info-cell">
                <div>You don't have any active listings.</div>
              </td>
            </tr>
          `;
          return;
        }
        
        mockMyListings.forEach(listing => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${listing.item}</td>
            <td>${listing.variant || 'None'}</td>
            <td>${listing.price} Silver</td>
            <td>${listing.date}</td>
            <td>
              <button class="cancel-btn" data-id="${listing.id}">Cancel</button>
            </td>
          `;
          this.myListingsTableBody.appendChild(row);
        });
        
        // Add event listeners to cancel buttons
        const cancelButtons = this.myListingsTableBody.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
          button.addEventListener('click', () => {
            const listingId = button.getAttribute('data-id');
            this.cancelListing(listingId);
          });
        });
      }
    } catch (error) {
      console.error('Error loading my listings:', error);
      throw error;
    }
  },
  
  // Buy a listing
  async buyListing(listingId) {
    try {
      // Check if user is logged in
      if (!window.authService.isLoggedIn()) {
        alert('Please log in to buy items from the market.');
        return;
      }
      
      // Find the listing
      const listing = this.data.listings.find(l => l.id.toString() === listingId.toString());
      if (!listing) {
        alert('Listing not found.');
        return;
      }
      
      // Check if user has enough silver
      const userSilver = window.playerData.silver;
      if (userSilver < listing.price) {
        alert('Not enough silver to buy this item.');
        return;
      }
      
      // Confirm purchase
      if (!confirm(`Are you sure you want to buy ${listing.item} (${listing.variant || 'No variant'}) for ${listing.price} Silver?`)) {
        return;
      }
      
      // For static version, simulate purchase
      window.playerData.silver -= listing.price;
      window.playerData.saveToLocalStorage();
      
      // Remove listing from list
      this.data.listings = this.data.listings.filter(l => l.id.toString() !== listingId.toString());
      
      // Update UI
      this.loadListings();
      
      // Update player stats
      updateUI();
      
      alert('Purchase successful!');
    } catch (error) {
      console.error('Error buying listing:', error);
      alert('Failed to buy listing. Please try again later.');
    }
  },
  
  // Cancel a listing
  async cancelListing(listingId) {
    try {
      // Find the listing
      const listing = this.data.myListings.find(l => l.id.toString() === listingId.toString());
      if (!listing) {
        alert('Listing not found.');
        return;
      }
      
      // Confirm cancellation
      if (!confirm(`Are you sure you want to cancel your listing for ${listing.item} (${listing.variant || 'No variant'})?`)) {
        return;
      }
      
      // For static version, simulate cancellation
      this.data.myListings = this.data.myListings.filter(l => l.id.toString() !== listingId.toString());
      
      // Update UI
      this.loadMyListings();
      
      alert('Listing cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert('Failed to cancel listing. Please try again later.');
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  market.initialize();
  
  // Add event listener to market button
  const marketButton = document.getElementById('market-button');
  if (marketButton) {
    marketButton.addEventListener('click', () => {
      market.openMarket();
    });
  }
});
