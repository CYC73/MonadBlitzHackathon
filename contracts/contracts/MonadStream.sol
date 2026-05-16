// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MonadStream {
    address public owner;
    uint256 public totalBudget;
    uint256 public spentBudget;
    bool public isFrozen;

    event CostReported(uint256 cost, uint256 remaining);
    event FuseTriggered(uint256 totalSpent);
    event BudgetReplenished(uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor() payable {
        owner = msg.sender;
        totalBudget = msg.value; // 部署时存入的测试币作为初始预算
        isFrozen = false;
    }

    // 后端拦截调用
    function reportConsumption(uint256 cost) external onlyOwner returns (bool) {
        require(!isFrozen, "AI_FUSE_TRIGGERED: Budget completely exhausted!");

        spentBudget += cost;

        if (spentBudget >= totalBudget) {
            isFrozen = true;
            emit FuseTriggered(spentBudget);
        } else {
            emit CostReported(cost, totalBudget - spentBudget);
        }

        return isFrozen;
    }

    // 前端每0.4秒高频免费调用
    function getRemainingBudget() external view returns (uint256) {
        if (spentBudget >= totalBudget) {
            return 0;
        }
        return totalBudget - spentBudget;
    }

    // 充值续费
    function topUpBudget() external payable onlyOwner {
        totalBudget += msg.value;
        if (spentBudget < totalBudget) {
            isFrozen = false; 
        }
        emit BudgetReplenished(msg.value);
    }
}