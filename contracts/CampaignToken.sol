// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CampaignToken
 * @dev ERC-20 token untuk membuat campaign gratis
 * Token ini diberikan sebagai reward dan dapat digunakan untuk membuat petition tanpa bayar ETH
 */
contract CampaignToken is ERC20, Ownable {
    address public petitionContract;
    
    constructor() ERC20("Campaign Token", "CAMP") Ownable(msg.sender) {}
    
    /**
     * @dev Set address PetitionPlatform contract
     * Hanya bisa dipanggil sekali setelah PetitionPlatform di-deploy
     */
    function setPetitionContract(address _petitionContract) external onlyOwner {
        require(_petitionContract != address(0), "Invalid address");
        petitionContract = _petitionContract;
    }
    
    /**
     * @dev Mint token baru
     * Hanya bisa dipanggil oleh PetitionContract atau Owner
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == petitionContract || msg.sender == owner(), "Not authorized");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn token dari address tertentu
     * Hanya bisa dipanggil oleh PetitionContract
     */
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == petitionContract, "Not authorized");
        _burn(from, amount);
    }
}