class ShatayuCrypto {
    constructor() {
        this.portfolio = JSON.parse(localStorage.getItem('shatayuPortfolio')) || [];
        this.prices = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPrices();
        this.renderPortfolio();
        this.updateTotalStats();
        setInterval(() => this.loadPrices(), 30000); // Auto refresh every 30s
    }

    bindEvents() {
        document.getElementById('addCoinBtn').addEventListener('click', () => this.showAddModal());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelAdd').addEventListener('click', () => this.hideModal());
        document.getElementById('coinSearch').addEventListener('input', (e) => this.searchCoins(e.target.value));
        document.getElementById('addCoinConfirm').addEventListener('click', () => this.addCoinToPortfolio());
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('addCoinModal');
            if (e.target === modal) this.hideModal();
        });
    }

    async loadPrices() {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,cardano,solana,ripple,dogecoin,polkadot,chainlink,avalanche-2,shiba-inu,matic-network,internet-computer,cronos&vs_currencies=usd&include_24hr_change=true'
            );
            this.prices = await response.json();
            this.renderPortfolio();
            this.updateTotalStats();
        } catch (error) {
            console.error('Error loading prices:', error);
        }
    }

    refreshData() {
        this.loadPrices();
    }

    searchCoins(query) {
        if (query.length < 2) {
            document.getElementById('coinResults').style.display = 'none';
            return;
        }

        const coins = [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
            { id: 'tether', name: 'Tether', symbol: 'USDT' },
            { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
            { id: 'solana', name: 'Solana', symbol: 'SOL' },
            { id: 'ripple', name: 'XRP', symbol: 'XRP' },
            { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
            { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
            { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
            { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB' },
            { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
            { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
            { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
            { id: 'internet-computer', name: 'Internet Computer', symbol: 'ICP' },
            { id: 'cronos', name: 'Cronos', symbol: 'CRO' }
        ];

        const filtered = coins.filter(coin => 
            coin.name.toLowerCase().includes(query.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8);

        const resultsHtml = filtered.map(coin => `
            <div class="coin-result" data-coin-id="${coin.id}" data-coin-name="${coin.name}" data-symbol="${coin.symbol}">
                <img src="https://cryptologos.cc/logos/${coin.id}-${coin.symbol.toLowerCase()}-logo.png?v=032" 
                     alt="${coin.symbol}" class="coin-icon" 
                     onerror="this.src='https://via.placeholder.com/32/667eea/ffffff?text=${coin.symbol}'"
                     style="background: #667eea;">
                <div>
                    <strong>${coin.name}</strong><br>
                    <span style="color: #666; font-size: 0.9rem;">${coin.symbol}</span>
                </div>
            </div>
        `).join('');

        const resultsDiv = document.getElementById('coinResults');
        resultsDiv.innerHTML = resultsHtml;
        resultsDiv.style.display = filtered.length ? 'block' : 'none';

        document.querySelectorAll('.coin-result').forEach(result => {
            result.addEventListener('click', (e) => {
                const coinId = e.currentTarget.dataset.coinId;
                const coinName = e.currentTarget.dataset.coinName;
                const symbol = e.currentTarget.dataset.symbol;
                
                document.getElementById('coinSearch').value = `${coinName} (${symbol})`;
                document.getElementById('coinSearch').dataset.coinId = coinId;
                resultsDiv.style.display = 'none';
            });
        });
    }

    showAddModal() {
        document.getElementById('addCoinModal').style.display = 'block';
        document.getElementById('coinSearch').focus();
    }

    hideModal() {
        document.getElementById('addCoinModal').style.display = 'none';
        document.getElementById('coinSearch').value = '';
        document.getElementById('coinAmount').value = '';
        document.getElementById('purchasePrice').value = '';
        document.getElementById('coinSearch').dataset.coinId = '';
    }

    addCoinToPortfolio() {
        const coinId = document.getElementById('coinSearch').dataset.coinId;
        const amount = parseFloat(document.getElementById('coinAmount').value);
        const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;

        if (!coinId || !amount || amount <= 0) {
            alert('Please select a valid coin and amount');
            return;
        }

        // Check if coin already exists
        const exists = this.portfolio.find(c => c.id === coinId);
        if (exists) {
            if (confirm('Coin already exists. Add to existing amount?')) {
                exists.amount += amount;
            } else {
                return;
            }
        } else {
            this.portfolio.push({
                id: coinId,
                amount: amount,
                purchasePrice: purchasePrice,
                addedAt: new Date().toISOString()
            });
        }

        this.savePortfolio();
        this.hideModal();
        this.renderPortfolio();
        this.updateTotalStats();
    }

    deleteCoin(index) {
        if (confirm('Remove this coin from portfolio?')) {
            this.portfolio.splice(index, 1);
            this.savePortfolio();
            this.renderPortfolio();
            this.updateTotalStats();
        }
    }

    savePortfolio() {
        localStorage.setItem('shatayuPortfolio', JSON.stringify(this.portfolio));
    }

    renderPortfolio() {
        const tbody = document.getElementById('portfolioBody');
        tbody.innerHTML = '';

        if (this.portfolio.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-coins" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                        No coins in portfolio. Add your first coin!
                    </td>
                </tr>
            `;
            return;
        }

        this.portfolio.forEach((coin, index) => {
            const currentPrice = this.prices[coin.id]?.usd || 0;
            const currentValue = coin.amount * currentPrice;
            const change24h = this.prices[coin.id]?.usd_24h_change || 0;
            const changeClass = change24h >= 0 ? 'positive' : 'negative';
            const changeSign = change24h >= 0 ? '+' : '';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="https://cryptologos.cc/logos/${coin.id}-${coin.id.split('-')[0]}-logo.png?v=032" 
                             alt="${coin.id}" class="coin-icon" 
                             onerror="this.src='https://via.placeholder.com/32/667eea/ffffff?text=${coin.id.substring(0,3).toUpperCase()}'"
                             style="background: #667eea;">
                        <div>
                            <strong style="text-transform: capitalize;">${coin.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                            <br><small style="color: #666;">${coin.amount.toFixed(6)}</small>
                        </div>
                    </div>
                </td>
                <td style="font-family: monospace;">${coin.amount.toLocaleString(undefined, {maximumFractionDigits: 6})}</td>
                <td class="price">$${currentPrice ? currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2}) : 'N/A'}</td>
                <td class="value">$${currentValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td>
                    <span class="change ${changeClass}">
                        ${changeSign}${change24h ? change24h.toFixed(2) : '0'}%
                        ${change24h >= 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>'}
                    </span>
                </td>
                <td>
                    <button class="delete-btn" onclick="app.deleteCoin(${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateTotalStats() {
        const totalValue = this.portfolio.reduce((sum, coin) => {
            return sum + (coin.amount * (this.prices[coin.id]?.usd || 0));
        }, 0);

        let totalChange = 0;
        let totalCoinsValue = 0;
        this.portfolio.forEach(coin => {
            const value = coin.amount * (this.prices[coin.id]?.usd || 0);
            totalCoinsValue += value;
            if (value > 0) {
                const change = this.prices[coin.id]?.usd_24h_change || 0;
                totalChange += (change * value);
            }
        });

        const avgChange = totalCoinsValue > 0 ? (totalChange / totalCoinsValue) : 0;
        const changeClass = avgChange >= 0 ? 'positive' : 'negative';

        document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        document.getElementById('totalChange').textContent = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
        document.getElementById('totalChange').className = `stat-change ${changeClass}`;
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShatayuCrypto();
});