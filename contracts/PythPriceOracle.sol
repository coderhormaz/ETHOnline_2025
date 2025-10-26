// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPyth
 * @notice Interface for Pyth Network price oracle
 * @dev https://docs.pyth.network/price-feeds/contract-addresses
 */
interface IPyth {
    struct Price {
        int64 price;           // Price with exponent
        uint64 conf;           // Confidence interval
        int32 expo;            // Price exponent
        uint256 publishTime;   // Publish timestamp
    }
    
    function getPrice(bytes32 id) external view returns (Price memory);
    function getPriceUnsafe(bytes32 id) external view returns (Price memory);
    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable;
    function getUpdateFee(bytes[] calldata priceUpdateData) external view returns (uint256);
}

/**
 * @title PythPriceOracle
 * @notice Wrapper for Pyth Network price feeds with token price management
 * @dev Provides live crypto prices for portfolio valuation
 */
contract PythPriceOracle is Ownable {
    
    // ============ State Variables ============
    
    IPyth public pyth;
    
    // Token address => Pyth price feed ID
    mapping(address => bytes32) public tokenToPriceId;
    
    // Symbol => Pyth price feed ID (for convenience)
    mapping(string => bytes32) public symbolToPriceId;
    
    // Token address => symbol
    mapping(address => string) public tokenSymbol;
    
    uint256 public maxPriceAge = 60; // 60 seconds max age
    
    // ============ Events ============
    
    event PriceFeedAdded(address indexed token, string symbol, bytes32 priceId);
    event PriceFeedUpdated(bytes32 indexed priceId, int64 price, uint256 timestamp);
    event MaxPriceAgeUpdated(uint256 oldAge, uint256 newAge);
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize with Pyth contract address
     * @param _pyth Pyth Network contract address
     * 
     * Pyth Addresses:
     * - Arbitrum Mainnet: 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C
     * - Arbitrum Sepolia: 0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF
     */
    constructor(address _pyth) Ownable(msg.sender) {
        require(_pyth != address(0), "Invalid Pyth address");
        pyth = IPyth(_pyth);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Add price feed for a token
     * @param token Token contract address
     * @param symbol Token symbol (e.g., "BTC", "ETH")
     * @param priceId Pyth price feed ID
     */
    function addPriceFeed(
        address token,
        string memory symbol,
        bytes32 priceId
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(priceId != bytes32(0), "Invalid price ID");
        
        tokenToPriceId[token] = priceId;
        symbolToPriceId[symbol] = priceId;
        tokenSymbol[token] = symbol;
        
        emit PriceFeedAdded(token, symbol, priceId);
    }
    
    /**
     * @notice Batch add price feeds
     * @param tokens Array of token addresses
     * @param symbols Array of symbols
     * @param priceIds Array of Pyth price feed IDs
     */
    function batchAddPriceFeeds(
        address[] memory tokens,
        string[] memory symbols,
        bytes32[] memory priceIds
    ) external onlyOwner {
        require(
            tokens.length == symbols.length && tokens.length == priceIds.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            require(priceIds[i] != bytes32(0), "Invalid price ID");
            
            tokenToPriceId[tokens[i]] = priceIds[i];
            symbolToPriceId[symbols[i]] = priceIds[i];
            tokenSymbol[tokens[i]] = symbols[i];
            
            emit PriceFeedAdded(tokens[i], symbols[i], priceIds[i]);
        }
    }
    
    /**
     * @notice Update max price age
     * @param _maxAge New max age in seconds
     */
    function setMaxPriceAge(uint256 _maxAge) external onlyOwner {
        require(_maxAge > 0 && _maxAge <= 300, "Invalid max age"); // 5 min max
        uint256 oldAge = maxPriceAge;
        maxPriceAge = _maxAge;
        emit MaxPriceAgeUpdated(oldAge, _maxAge);
    }
    
    // ============ Price Feed Functions ============
    
    /**
     * @notice Update price feeds with new data
     * @param priceUpdateData Pyth price update data
     */
    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable {
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient update fee");
        
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);
        
        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get token price from Pyth
     * @param token Token address
     * @return price Price in USD (scaled by 10^8)
     * @return timestamp Price publish timestamp
     */
    function getTokenPrice(address token) 
        external 
        view 
        returns (int64 price, uint256 timestamp) 
    {
        bytes32 priceId = tokenToPriceId[token];
        require(priceId != bytes32(0), "Price feed not found");
        
        IPyth.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
        
        // Check price freshness
        require(
            block.timestamp - pythPrice.publishTime <= maxPriceAge,
            "Price too old"
        );
        
        return (pythPrice.price, pythPrice.publishTime);
    }
    
    /**
     * @notice Get token price by symbol
     * @param symbol Token symbol (e.g., "BTC")
     * @return price Price in USD (scaled by 10^8)
     * @return timestamp Price publish timestamp
     */
    function getPriceBySymbol(string memory symbol)
        external
        view
        returns (int64 price, uint256 timestamp)
    {
        bytes32 priceId = symbolToPriceId[symbol];
        require(priceId != bytes32(0), "Price feed not found");
        
        IPyth.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
        
        require(
            block.timestamp - pythPrice.publishTime <= maxPriceAge,
            "Price too old"
        );
        
        return (pythPrice.price, pythPrice.publishTime);
    }
    
    /**
     * @notice Get price with full details
     * @param token Token address
     * @return price Price value
     * @return conf Confidence interval
     * @return expo Price exponent
     * @return timestamp Publish time
     */
    function getTokenPriceWithDetails(address token)
        external
        view
        returns (int64 price, uint64 conf, int32 expo, uint256 timestamp)
    {
        bytes32 priceId = tokenToPriceId[token];
        require(priceId != bytes32(0), "Price feed not found");
        
        IPyth.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
        
        return (
            pythPrice.price,
            pythPrice.conf,
            pythPrice.expo,
            pythPrice.publishTime
        );
    }
    
    /**
     * @notice Check if price is stale
     * @param token Token address
     * @return isStale True if price is older than maxPriceAge
     */
    function isPriceStale(address token) external view returns (bool isStale) {
        bytes32 priceId = tokenToPriceId[token];
        if (priceId == bytes32(0)) return true;
        
        IPyth.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
        return block.timestamp - pythPrice.publishTime > maxPriceAge;
    }
    
    /**
     * @notice Calculate total value of multiple tokens
     * @param tokens Array of token addresses
     * @param amounts Array of token amounts (in token decimals)
     * @return totalValue Total value in USD (scaled by 10^8)
     */
    function calculatePortfolioValue(
        address[] memory tokens,
        uint256[] memory amounts
    ) external view returns (uint256 totalValue) {
        require(tokens.length == amounts.length, "Length mismatch");
        
        int256 total = 0;
        
        for (uint256 i = 0; i < tokens.length; i++) {
            bytes32 priceId = tokenToPriceId[tokens[i]];
            require(priceId != bytes32(0), "Price feed not found");
            
            IPyth.Price memory pythPrice = pyth.getPriceUnsafe(priceId);
            
            // Check freshness
            require(
                block.timestamp - pythPrice.publishTime <= maxPriceAge,
                "Price too old"
            );
            
            // Calculate value: amount * price
            // Note: Adjust for token decimals and price exponent in production
            total += int256(amounts[i]) * pythPrice.price;
        }
        
        require(total >= 0, "Negative total value");
        return uint256(total);
    }
    
    /**
     * @notice Get Pyth price feed ID for a token
     * @param token Token address
     * @return priceId Pyth price feed ID
     */
    function getPriceId(address token) external view returns (bytes32 priceId) {
        return tokenToPriceId[token];
    }
    
    /**
     * @notice Get update fee for price data
     * @param priceUpdateData Price update data
     * @return fee Required fee in wei
     */
    function getUpdateFee(bytes[] calldata priceUpdateData) 
        external 
        view 
        returns (uint256 fee) 
    {
        return pyth.getUpdateFee(priceUpdateData);
    }
}
