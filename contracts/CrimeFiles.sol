// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";
import {RandomnessReceiverBase} from "randomness-solidity/src/RandomnessReceiverBase.sol";

contract CrimeFiles is AbstractBlocklockReceiver {
    
    // --- Constants and State Variables ---
    uint256 public constant ACCESS_FEE = 0 ether;
    uint256 public constant MEGA_BOUNTY = 0 ether; // Set the mega bounty amount here

    uint256 public currentRequestId; // To track the current Blocklock request
    address private s_randomnessReceiver; // Address of the MockRandomnessReceiver contract
    uint256 private s_vrfRequestId; // To track the current VRF request
    address[] private s_tiedParticipants; // Stores participants with correct verdicts during a tie
    
    // --- Mappings and Structs ---
    struct Request {
        address requestedBy;
        uint32 encryptedAt;
        uint32 decryptedAt;
        TypesLib.Ciphertext encryptedValue;
        string message;
    }

    struct CaseFile {
        uint256 poolPrize;
        address[] participants;
        mapping(address => bool) hasAccessed;
        mapping(address => string) verdicts;
        bool isDecrypted;
        address winner;
        bool prizeDistributed;
    }

    // Mapping Case ID with Request data
    mapping(uint256 => Request) public userRequests;
    // Mapping Case ID with Case CID
    mapping(uint256 => string) public caseCID;
    // Mapping Case ID with CaseFile data
    mapping(uint256 => CaseFile) public caseFiles;
    // Mapping to track active VRF requests
    mapping(uint256 => bool) public isRandomnessRequestActive;

    // --- Events ---
    event CaseCreated(uint256 indexed caseId, string cid, address creator);
    event CaseAccessed(uint256 indexed caseId, address participant);
    event VerdictRegistered(uint256 indexed caseId, address participant, string verdict);
    event WinnerDeclared(uint256 indexed caseId, address winner, uint256 prize);
    event CaseDecrypted(uint256 indexed caseId, string decryptedMessage);
    event RandomnessRequested(uint256 indexed caseId, uint256 requestId);
    event TieBreakerWinnerChosen(uint256 indexed caseId, address winner, uint256 megaBounty);

    // --- Constructor ---
    constructor(address blocklockSender, address randomnessReceiver) AbstractBlocklockReceiver(blocklockSender) {
        s_randomnessReceiver = randomnessReceiver;
    }

    // --- Core Functions ---

    /**
     * @dev Creates a new case file and initiates a timelock request.
     */
    function createCase(
        string memory cid,
        uint32 callbackGasLimit,
        uint32 _encryptedAt,
        uint32 _decryptedAt,
        bytes calldata condition,
        TypesLib.Ciphertext calldata encryptedData
    ) external payable returns (uint256, uint256) {
        (uint256 _requestId, uint256 requestPrice) =
            _requestBlocklockPayInNative(callbackGasLimit, condition, encryptedData);
        
        currentRequestId = _requestId;
        
        userRequests[_requestId] = Request({
            requestedBy: msg.sender,
            encryptedAt: _encryptedAt,
            decryptedAt: _decryptedAt,
            encryptedValue: encryptedData,
            message: ""
        });
        caseCID[_requestId] = cid;
        
        caseFiles[_requestId].poolPrize = 0;
        caseFiles[_requestId].isDecrypted = false;
        caseFiles[_requestId].prizeDistributed = false;
        
        emit CaseCreated(_requestId, cid, msg.sender);
        return (currentRequestId, requestPrice);
    }
    
    /**
     * @dev Callback for when Blocklock data is received.
     */
    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        require(userRequests[_requestId].requestedBy != address(0), "Invalid request id.");
        Request storage request = userRequests[_requestId];
        request.message = abi.decode(_decrypt(request.encryptedValue, decryptionKey), (string));
        
        caseFiles[_requestId].isDecrypted = true;
        
        emit CaseDecrypted(_requestId, request.message);
    }

    /**
     * @dev Allows a user to access a case file and pay the access fee.
     */
    function accessCaseFile(uint256 caseID) payable public {
        require(msg.value == ACCESS_FEE, "Must pay exactly to access case file");
        require(userRequests[caseID].requestedBy != address(0), "Case does not exist");
        require(!caseFiles[caseID].hasAccessed[msg.sender], "You have already accessed this case");
        
        caseFiles[caseID].poolPrize += msg.value;
        
        caseFiles[caseID].hasAccessed[msg.sender] = true;
        caseFiles[caseID].participants.push(msg.sender);
        
        emit CaseAccessed(caseID, msg.sender);
    }
    
    /**
     * @dev Registers a participant's verdict for a case.
     */
    function registerVerdict(uint256 caseID, string memory verdict) public {
        require(caseFiles[caseID].hasAccessed[msg.sender], "You must access the case file first");
        require(!caseFiles[caseID].isDecrypted, "Case has already been decrypted");
        require(bytes(verdict).length > 0, "Verdict cannot be empty");
        
        caseFiles[caseID].verdicts[msg.sender] = verdict;
        
        emit VerdictRegistered(caseID, msg.sender, verdict);
    }
    
    /**
     * @dev Checks for a winner and handles single winners or ties.
     * Triggers VRF request in case of a tie.
     */
    function checkWinner(uint256 caseID) public {
        require(caseFiles[caseID].isDecrypted, "Case must be decrypted first");
        require(!caseFiles[caseID].prizeDistributed, "Prize has already been distributed");
        require(!isRandomnessRequestActive[caseID], "VRF request is already in progress");

        CaseFile storage caseFile = caseFiles[caseID];
        Request storage request = userRequests[caseID];
        
        address[] memory potentialWinners = new address[](caseFile.participants.length);
        uint256 winnerCount = 0;

        for (uint256 i = 0; i < caseFile.participants.length; i++) {
            address participant = caseFile.participants[i];
            string memory participantVerdict = caseFile.verdicts[participant];
            
            if (keccak256(abi.encodePacked(participantVerdict)) == keccak256(abi.encodePacked(request.message))) {
                potentialWinners[winnerCount] = participant;
                winnerCount++;
            }
        }

        if (winnerCount == 0) {
            return;
        }

        // Split the pool prize among all successful participants
        uint256 prizePerWinner = caseFile.poolPrize / winnerCount;

        for (uint256 i = 0; i < winnerCount; i++) {
            address winner = potentialWinners[i];
            (bool success, ) = payable(winner).call{value: prizePerWinner}("");
            require(success, "Base prize transfer failed");
        }

        if (winnerCount == 1) {
            // Only one winner, they get the full pool and the mega bounty.
            address winner = potentialWinners[0];
            (bool success, ) = payable(winner).call{value: MEGA_BOUNTY}("");
            require(success, "Mega bounty transfer failed");
            
            caseFile.winner = winner;
            caseFile.prizeDistributed = true;
            
            emit WinnerDeclared(caseID, winner, caseFile.poolPrize + MEGA_BOUNTY);
        } else {
            // Tie-breaker needed for the mega bounty
            s_vrfRequestId = caseID;
            s_tiedParticipants = new address[](winnerCount);
            for(uint i = 0; i < winnerCount; i++) {
                s_tiedParticipants[i] = potentialWinners[i];
            }

            isRandomnessRequestActive[caseID] = true;

            emit RandomnessRequested(caseID, s_vrfRequestId);
        }
    }

    /**
     * @dev VRF callback function to process the random number and pick a winner.
     * This function is expected to be called by the MockRandomnessReceiver contract.
     */
    function onRandomnessReceived(uint256 requestId, bytes32 randomness) internal {
        require(isRandomnessRequestActive[s_vrfRequestId], "No active request for this case");
        require(requestId == s_vrfRequestId, "Request ID mismatch");

        isRandomnessRequestActive[s_vrfRequestId] = false;

        uint256 index = uint256(randomness) % s_tiedParticipants.length;
        address megaBountyWinner = s_tiedParticipants[index];

        (bool success, ) = payable(megaBountyWinner).call{value: MEGA_BOUNTY}("");
        require(success, "Mega bounty transfer failed");

        delete s_tiedParticipants;

        CaseFile storage caseFile = caseFiles[s_vrfRequestId];
        caseFile.winner = megaBountyWinner;
        caseFile.prizeDistributed = true;

        emit TieBreakerWinnerChosen(s_vrfRequestId, megaBountyWinner, MEGA_BOUNTY);
    }

    // --- View Functions ---
    function getCaseParticipants(uint256 caseID) external view returns (address[] memory) {
        return caseFiles[caseID].participants;
    }
    
    function getUserVerdict(uint256 caseID, address user) external view returns (string memory) {
        return caseFiles[caseID].verdicts[user];
    }
    
    function getCaseDetails(uint256 caseID) external view returns (
        uint256 poolPrize,
        uint256 participantCount,
        bool isDecrypted,
        address winner,
        bool prizeDistributed
    ) {
        CaseFile storage caseFile = caseFiles[caseID];
        return (
            caseFile.poolPrize,
            caseFile.participants.length,
            caseFile.isDecrypted,
            caseFile.winner,
            caseFile.prizeDistributed
        );
    }
    
    function hasUserAccessed(uint256 caseID, address user) external view returns (bool) {
        return caseFiles[caseID].hasAccessed[user];
    }
}
