// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPythPriceOracle {
    function getTokenPrice(address token) external view returns (int64 price, uint256 timestamp);
    function calculatePortfolioValue(address[] memory tokens, uint256[] memory amounts) external view returns (uint256);
}

/**
 * @title PortfolioManager
 * @notice Manages crypto portfolios with PYUSD investments, auto-rebalancing, and live price tracking
 * @dev Integrates with Pyth Network for real-time price feeds
 */
contract PortfolioManager is Ownable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Portfolio {
        string portfolioId;           // Unique identifier
        string name;                  // Display name (e.g., "Bluechip Blend")
        string category;              // Category (e.g., "Stable Growth", "AI & Agents")
        address[] tokens;             // Token addresses in the portfolio
        uint256[] weights;            // Allocation weights (must sum to 10000 = 100%)
        uint8 riskLevel;              // 1=Low, 2=Medium, 3=High
        uint256 rebalanceFrequency;   // Seconds between rebalances (e.g., 30 days)
        uint256 lastRebalanced;       // Last rebalance timestamp
        bool isActive;                // Portfolio status
        uint256 totalInvested;        // Total PYUSD invested across all users
        uint256 createdAt;            // Creation timestamp
    }
    
    struct UserInvestment {
        uint256 pyusdAmount;          // PYUSD invested by user
        uint256 shares;               // Portfolio shares owned
        uint256 investedAt;           // Investment timestamp
        uint256 lastWithdrawal;       // Last withdrawal timestamp
    }
    
    struct RebalanceEvent {
        uint256 timestamp;
        uint256[] oldWeights;
        uint256[] newWeights;
        uint256 totalValue;
        string reason;
    }
    
    // ============ State Variables ============
    
    mapping(string => Portfolio) public portfolios;
    mapping(address => mapping(string => UserInvestment)) public userInvestments;
    mapping(string => RebalanceEvent[]) public rebalanceHistory;
    
    string[] public activePortfolioIds;
    
    IERC20 public pyusd;                          // PYUSD token contract
    IPythPriceOracle public priceOracle;          // Pyth price oracle
    
    uint256 public constant WEIGHT_PRECISION = 10000;  // 100% = 10000
    uint256 public constant MIN_INVESTMENT = 10 * 1e6;  // 10 PYUSD minimum
    uint256 public rebalanceThreshold = 500;      // 5% deviation triggers rebalance
    
    address public rebalancer;                    // Authorized rebalancer address
    
    // ============ Events ============
    
    event PortfolioCreated(
        string indexed portfolioId,
        string name,
        address[] tokens,
        uint256[] weights,
        uint8 riskLevel
    );
    
    event UserInvested(
        address indexed user,
        string indexed portfolioId,
        uint256 pyusdAmount,
        uint256 shares,
        uint256 timestamp
    );
    
    event UserWithdrew(
        address indexed user,
        string indexed portfolioId,
        uint256 pyusdAmount,
        uint256 shares,
        uint256 timestamp
    );
    
    event PortfolioRebalanced(
        string indexed portfolioId,
        uint256[] oldWeights,
        uint256[] newWeights,
        uint256 totalValue,
        uint256 timestamp
    );
    
    event WeightsUpdated(
        string indexed portfolioId,
        uint256[] newWeights,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier onlyRebalancer() {
        require(msg.sender == rebalancer || msg.sender == owner(), "Not authorized rebalancer");
        _;
    }
    
    modifier validPortfolio(string memory portfolioId) {
        require(portfolios[portfolioId].isActive, "Portfolio not active");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _pyusd,
        address _priceOracle,
        address _rebalancer
    ) Ownable(msg.sender) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_priceOracle != address(0), "Invalid oracle address");
        
        pyusd = IERC20(_pyusd);
        priceOracle = IPythPriceOracle(_priceOracle);
        rebalancer = _rebalancer;
    }
    
    // ============ Portfolio Management ============
    
    /**
     * @notice Create a new portfolio
     * @param portfolioId Unique identifier
     * @param name Display name
     * @param category Portfolio category
     * @param tokens Token addresses
     * @param weights Allocation weights (must sum to 10000)
     * @param riskLevel Risk level (1=Low, 2=Medium, 3=High)
     * @param rebalanceFrequency Rebalance frequency in seconds
     */
    function createPortfolio(
        string memory portfolioId,
        string memory name,
        string memory category,
        address[] memory tokens,
        uint256[] memory weights,
        uint8 riskLevel,
        uint256 rebalanceFrequency
    ) external onlyOwner {
        require(portfolios[portfolioId].createdAt == 0, "Portfolio already exists");
        require(tokens.length > 0 && tokens.length <= 10, "Invalid token count");
        require(tokens.length == weights.length, "Length mismatch");
        require(riskLevel >= 1 && riskLevel <= 3, "Invalid risk level");
        
        // Validate weights sum to 100%
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            require(weights[i] > 0, "Weight must be positive");
            totalWeight += weights[i];
        }
        require(totalWeight == WEIGHT_PRECISION, "Weights must sum to 10000");
        
        portfolios[portfolioId] = Portfolio({
            portfolioId: portfolioId,
            name: name,
            category: category,
            tokens: tokens,
            weights: weights,
            riskLevel: riskLevel,
            rebalanceFrequency: rebalanceFrequency,
            lastRebalanced: block.timestamp,
            isActive: true,
            totalInvested: 0,
            createdAt: block.timestamp
        });
        
        activePortfolioIds.push(portfolioId);
        
        emit PortfolioCreated(portfolioId, name, tokens, weights, riskLevel);
    }
    
    /**
     * @notice Invest PYUSD into a portfolio
     * @param portfolioId Portfolio to invest in
     * @param pyusdAmount Amount of PYUSD to invest
     */
    function investInPortfolio(
        string memory portfolioId,
        uint256 pyusdAmount
    ) external nonReentrant validPortfolio(portfolioId) {
        require(pyusdAmount >= MIN_INVESTMENT, "Below minimum investment");
        
        Portfolio storage portfolio = portfolios[portfolioId];
        UserInvestment storage investment = userInvestments[msg.sender][portfolioId];
        
        // Transfer PYUSD from user
        require(
            pyusd.transferFrom(msg.sender, address(this), pyusdAmount),
            "PYUSD transfer failed"
        );
        
        // Calculate shares (first investor gets 1:1, subsequent get proportional)
        uint256 shares;
        if (portfolio.totalInvested == 0) {
            shares = pyusdAmount;
        } else {
            // shares = (pyusdAmount * totalShares) / totalValue
            uint256 totalValue = getPortfolioTotalValue(portfolioId);
            uint256 totalShares = _getTotalShares(portfolioId);
            shares = (pyusdAmount * totalShares) / totalValue;
        }
        
        // Update user investment
        investment.pyusdAmount += pyusdAmount;
        investment.shares += shares;
        if (investment.investedAt == 0) {
            investment.investedAt = block.timestamp;
        }
        
        // Update portfolio total
        portfolio.totalInvested += pyusdAmount;
        
        emit UserInvested(msg.sender, portfolioId, pyusdAmount, shares, block.timestamp);
    }
    
    /**
     * @notice Withdraw investment from portfolio
     * @param portfolioId Portfolio to withdraw from
     * @param sharesToWithdraw Number of shares to withdraw (0 = withdraw all)
     */
    function withdrawFromPortfolio(
        string memory portfolioId,
        uint256 sharesToWithdraw
    ) external nonReentrant validPortfolio(portfolioId) {
        UserInvestment storage investment = userInvestments[msg.sender][portfolioId];
        require(investment.shares > 0, "No investment found");
        
        if (sharesToWithdraw == 0) {
            sharesToWithdraw = investment.shares;
        }
        require(sharesToWithdraw <= investment.shares, "Insufficient shares");
        
        // Calculate PYUSD amount based on current portfolio value
        uint256 totalValue = getPortfolioTotalValue(portfolioId);
        uint256 totalShares = _getTotalShares(portfolioId);
        uint256 pyusdAmount = (sharesToWithdraw * totalValue) / totalShares;
        
        // Update user investment
        investment.shares -= sharesToWithdraw;
        investment.pyusdAmount = (investment.shares * totalValue) / totalShares;
        investment.lastWithdrawal = block.timestamp;
        
        // Update portfolio total
        portfolios[portfolioId].totalInvested -= pyusdAmount;
        
        // Transfer PYUSD to user
        require(pyusd.transfer(msg.sender, pyusdAmount), "PYUSD transfer failed");
        
        emit UserWithdrew(msg.sender, portfolioId, pyusdAmount, sharesToWithdraw, block.timestamp);
    }
    
    // ============ Rebalancing ============
    
    /**
     * @notice Update portfolio weights (triggers rebalance)
     * @param portfolioId Portfolio to update
     * @param newWeights New allocation weights
     * @param reason Reason for rebalance
     */
    function updatePortfolioWeights(
        string memory portfolioId,
        uint256[] memory newWeights,
        string memory reason
    ) external onlyRebalancer validPortfolio(portfolioId) {
        Portfolio storage portfolio = portfolios[portfolioId];
        require(newWeights.length == portfolio.tokens.length, "Length mismatch");
        
        // Validate weights
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < newWeights.length; i++) {
            require(newWeights[i] > 0, "Weight must be positive");
            totalWeight += newWeights[i];
        }
        require(totalWeight == WEIGHT_PRECISION, "Weights must sum to 10000");
        
        // Store old weights for event
        uint256[] memory oldWeights = portfolio.weights;
        
        // Update weights
        portfolio.weights = newWeights;
        portfolio.lastRebalanced = block.timestamp;
        
        // Record rebalance event
        uint256 totalValue = getPortfolioTotalValue(portfolioId);
        rebalanceHistory[portfolioId].push(RebalanceEvent({
            timestamp: block.timestamp,
            oldWeights: oldWeights,
            newWeights: newWeights,
            totalValue: totalValue,
            reason: reason
        }));
        
        emit PortfolioRebalanced(portfolioId, oldWeights, newWeights, totalValue, block.timestamp);
    }
    
    /**
     * @notice Check if portfolio needs rebalancing
     * @param portfolioId Portfolio to check
     * @return needsRebalance True if rebalance is needed
     */
    function needsRebalancing(string memory portfolioId) 
        public 
        view 
        validPortfolio(portfolioId) 
        returns (bool needsRebalance) 
    {
        Portfolio storage portfolio = portfolios[portfolioId];
        
        // Check if enough time has passed
        if (block.timestamp - portfolio.lastRebalanced >= portfolio.rebalanceFrequency) {
            return true;
        }
        
        // Check if weights have drifted beyond threshold
        // (In production, compare actual token holdings vs target weights)
        return false;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get portfolio total value in PYUSD
     * @param portfolioId Portfolio ID
     * @return totalValue Total value in PYUSD
     */
    function getPortfolioTotalValue(string memory portfolioId) 
        public 
        view 
        validPortfolio(portfolioId) 
        returns (uint256 totalValue) 
    {
        Portfolio storage portfolio = portfolios[portfolioId];
        
        // For MVP, return total invested (in production, calculate actual token values)
        return portfolio.totalInvested;
        
        // Production implementation would:
        // 1. Get actual token balances
        // 2. Fetch prices from Pyth oracle
        // 3. Calculate total value
    }
    
    /**
     * @notice Get user's investment value in PYUSD
     * @param user User address
     * @param portfolioId Portfolio ID
     * @return currentValue Current value in PYUSD
     * @return invested Original invested amount
     * @return shares User's shares
     */
    function getUserInvestmentValue(address user, string memory portfolioId)
        external
        view
        validPortfolio(portfolioId)
        returns (uint256 currentValue, uint256 invested, uint256 shares)
    {
        UserInvestment storage investment = userInvestments[user][portfolioId];
        
        if (investment.shares == 0) {
            return (0, 0, 0);
        }
        
        uint256 totalValue = getPortfolioTotalValue(portfolioId);
        uint256 totalShares = _getTotalShares(portfolioId);
        
        currentValue = (investment.shares * totalValue) / totalShares;
        invested = investment.pyusdAmount;
        shares = investment.shares;
    }
    
    /**
     * @notice Get portfolio details
     * @param portfolioId Portfolio ID
     * @return portfolio Portfolio struct
     */
    function getPortfolio(string memory portfolioId) 
        external 
        view 
        returns (Portfolio memory portfolio) 
    {
        return portfolios[portfolioId];
    }
    
    /**
     * @notice Get all active portfolio IDs
     * @return ids Array of portfolio IDs
     */
    function getActivePortfolios() external view returns (string[] memory ids) {
        return activePortfolioIds;
    }
    
    /**
     * @notice Get rebalance history for a portfolio
     * @param portfolioId Portfolio ID
     * @return history Array of rebalance events
     */
    function getRebalanceHistory(string memory portfolioId)
        external
        view
        returns (RebalanceEvent[] memory history)
    {
        return rebalanceHistory[portfolioId];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set rebalancer address
     * @param _rebalancer New rebalancer address
     */
    function setRebalancer(address _rebalancer) external onlyOwner {
        require(_rebalancer != address(0), "Invalid address");
        rebalancer = _rebalancer;
    }
    
    /**
     * @notice Set rebalance threshold
     * @param _threshold New threshold (in basis points)
     */
    function setRebalanceThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold <= 2000, "Threshold too high"); // Max 20%
        rebalanceThreshold = _threshold;
    }
    
    /**
     * @notice Deactivate a portfolio
     * @param portfolioId Portfolio to deactivate
     */
    function deactivatePortfolio(string memory portfolioId) external onlyOwner {
        portfolios[portfolioId].isActive = false;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Get total shares across all users for a portfolio
     * @param portfolioId Portfolio ID
     * @return total Total shares
     */
    function _getTotalShares(string memory portfolioId) internal view returns (uint256 total) {
        // In production, maintain a totalShares mapping for efficiency
        // For MVP, this is simplified
        return portfolios[portfolioId].totalInvested;
    }
}
