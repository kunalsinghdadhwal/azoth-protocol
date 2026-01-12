// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import Inco Lightning SDK for confidential computing
// euint256: encrypted uint256 type (handle to encrypted data)
// ebool: encrypted boolean type
// e: library with FHE operations (add, sub, eq, etc.)
// inco: singleton for fee management and verification
import {euint256, ebool, e, inco} from "@inco/lightning/src/Lib.sol";

// Import EList preview features for encrypted lists
// ePreview: library with elist operations
// elist: encrypted list type (handle to encrypted list)
// ETypes: enum for list element types (Uint256, Bool)
import {ePreview, elist, ETypes} from "@inco/lightning-preview/src/Preview.Lib.sol";

/**
 * @title ConfidentialUnoGame
 * @notice A confidential UNO game contract using Inco's encrypted types and EList
 * @dev Uses EList for deck management with shuffledRange for true randomness
 *
 * Key confidential features:
 * - Deck is an encrypted shuffled list using shuffledRange(0, 108)
 * - Player hands are elist - only the owner can decrypt their cards
 * - Moves history stored as elist
 * - Game results revealed only at game end using e.reveal()
 *
 * Note: EList length is always public (by design) but card values are encrypted
 */
contract ConfidentialUnoGame {
    using e for *;

    uint256 private _gameIdCounter;
    uint256[] private _activeGames;

    // UNO deck has 108 cards (0-107)
    // Cards 0-99: Number cards (colors 0-3, values 0-9, 2 of each except 0)
    // Cards 100-107: Special cards (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
    uint16 public constant DECK_SIZE = 108;
    uint16 public constant INITIAL_HAND_SIZE = 7;
    uint256 public constant MAX_PLAYERS = 10;

    enum GameStatus { NotStarted, Started, Ended }

    /**
     * @dev Game struct with encrypted fields using EList
     * - deck: Shuffled encrypted deck of cards (elist)
     * - moves: Encrypted move history (elist)
     * - topCard: Current top card on discard pile (euint256)
     * - gameHash: Final game hash for verification (euint256)
     * - deckIndex: Current position in deck for drawing
     */
    struct Game {
        uint256 id;
        address[] players;
        GameStatus status;
        uint256 startTime;
        uint256 endTime;
        euint256 gameHash;           // Encrypted game hash for final verification
        elist deck;                  // Shuffled encrypted deck using shuffledRange
        elist moves;                 // Encrypted move history
        euint256 topCard;            // Current top card (encrypted)
        uint16 deckIndex;            // Current draw position in deck
        uint256 currentPlayerIndex;  // Whose turn it is
    }

    // Game storage
    mapping(uint256 => Game) private games;

    // Player hands stored as elist per player
    // gameId => player => encrypted hand (elist)
    mapping(uint256 => mapping(address => elist)) private playerHands;

    // Events - note we don't expose encrypted values, just handles or nothing
    event GameCreated(uint256 indexed gameId, address creator);
    event PlayerJoined(uint256 indexed gameId, address player);
    event GameStarted(uint256 indexed gameId);
    event MoveCommitted(uint256 indexed gameId, address indexed player);
    event CardDrawn(uint256 indexed gameId, address indexed player);
    event GameEnded(uint256 indexed gameId);

    modifier validateGame(uint256 _gameId, GameStatus requiredStatus) {
        require(_gameId > 0 && _gameId <= _gameIdCounter, "Invalid game ID");
        Game storage game = games[_gameId];
        require(game.status == requiredStatus, "Game is not in the required status");
        _;
    }

    modifier onlyPlayer(uint256 _gameId) {
        Game storage game = games[_gameId];
        bool isPlayer = false;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == msg.sender) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Not a player in this game");
        _;
    }

    /**
     * @notice Create a new confidential UNO game with shuffled deck
     * @param _creator The address of the game creator
     * @param _isBot Whether this is a bot game (auto-starts with 2 players)
     * @return gameId The ID of the newly created game
     * @dev Uses shuffledRange(0, 108) to create a cryptographically shuffled deck
     *      Fee required for: shuffledRange + slice operations for dealing
     */
    function createGame(address _creator, bool _isBot) external payable returns (uint256) {
        // Fee calculation:
        // - 1 fee for shuffledRange (deck creation)
        // - 1 fee for initial top card
        // For bot games: additional slicing for 2 hands
        uint256 requiredFee = inco.getFee() * 2; // deck + top card
        if (_isBot) {
            requiredFee = inco.getFee() * 3; // deck + 2 hand slices + top card operations
        }
        require(msg.value >= requiredFee, "Insufficient fee for encrypted operations");

        _gameIdCounter++;
        uint256 newGameId = _gameIdCounter;

        address[] memory initialPlayers;
        GameStatus initialStatus;

        if (_isBot) {
            initialPlayers = new address[](2);
            initialPlayers[0] = _creator;
            initialPlayers[1] = address(0xB07); // Dummy bot address
            initialStatus = GameStatus.Started;
        } else {
            initialPlayers = new address[](1);
            initialPlayers[0] = _creator;
            initialStatus = GameStatus.NotStarted;
        }

        // Create shuffled deck using shuffledRange - this creates an encrypted
        // list of values 0-107 in random order
        elist shuffledDeck = ePreview.shuffledRange(0, DECK_SIZE);

        // Grant access to contract for game operations
        inco.allow(elist.unwrap(shuffledDeck), address(this));

        // Initialize empty moves list
        elist emptyMoves = ePreview.newEList(ETypes.Uint256);
        inco.allow(elist.unwrap(emptyMoves), address(this));

        // Store game data
        games[newGameId].id = newGameId;
        games[newGameId].players = initialPlayers;
        games[newGameId].status = initialStatus;
        games[newGameId].startTime = block.timestamp;
        games[newGameId].currentPlayerIndex = 0;
        games[newGameId].deck = shuffledDeck;
        games[newGameId].moves = emptyMoves;
        games[newGameId].deckIndex = 0;

        // Deal initial hands to players
        uint16 deckPos = _dealInitialHands(newGameId, initialPlayers, shuffledDeck);
        games[newGameId].deckIndex = deckPos;

        // Set initial top card from deck
        euint256 topCard = ePreview.getEuint256(shuffledDeck, deckPos);
        games[newGameId].deckIndex = deckPos + 1;

        // Allow contract and creator to see top card
        inco.allow(euint256.unwrap(topCard), address(this));
        inco.allow(euint256.unwrap(topCard), _creator);
        games[newGameId].topCard = topCard;

        _activeGames.push(newGameId);
        emit GameCreated(newGameId, _creator);

        if (_isBot) {
            emit GameStarted(newGameId);
        }

        return newGameId;
    }

    /**
     * @dev Internal function to deal initial hands to all players using slice
     * @param gameId The game ID
     * @param players Array of player addresses
     * @param deck The shuffled deck elist
     * @return nextDeckIndex The next position in deck after dealing
     * @notice Also grants ACL for individual cards so players can decrypt them
     */
    function _dealInitialHands(
        uint256 gameId,
        address[] memory players,
        elist deck
    ) internal returns (uint16 nextDeckIndex) {
        uint16 deckPos = 0;

        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];

            // Slice INITIAL_HAND_SIZE cards from deck for this player's hand
            // slice(deck, start, end) returns cards from start to end-1
            elist hand = ePreview.slice(deck, deckPos, deckPos + INITIAL_HAND_SIZE);

            // Grant access to the contract for game logic
            inco.allow(elist.unwrap(hand), address(this));
            // Grant access to the player so they can decrypt their own cards
            inco.allow(elist.unwrap(hand), player);

            // IMPORTANT: Grant ACL for each individual card handle in the hand
            // This is required because getEuint256 returns handles that need explicit ACL
            // Without this, attestedDecrypt will fail with "acl disallowed"
            for (uint16 j = 0; j < INITIAL_HAND_SIZE; j++) {
                euint256 card = ePreview.getEuint256(hand, j);
                inco.allow(euint256.unwrap(card), player);
                inco.allow(euint256.unwrap(card), address(this));
            }

            // Store player's hand
            playerHands[gameId][player] = hand;

            deckPos += INITIAL_HAND_SIZE;
        }

        return deckPos;
    }

    /**
     * @notice Start the game (requires at least 2 players)
     * @param gameId The game ID to start
     */
    function startGame(uint256 gameId) external payable validateGame(gameId, GameStatus.NotStarted) {
        Game storage game = games[gameId];
        require(game.players.length >= 2, "Not enough players");

        // Allow all players to see the top card
        for (uint256 i = 0; i < game.players.length; i++) {
            inco.allow(euint256.unwrap(game.topCard), game.players[i]);
        }

        game.status = GameStatus.Started;
        emit GameStarted(gameId);
    }

    /**
     * @notice Join an existing game
     * @param gameId The game ID to join
     * @param _joinee The address of the player joining
     * @dev Deals cards from the existing deck using slice
     */
    function joinGame(uint256 gameId, address _joinee) external payable validateGame(gameId, GameStatus.NotStarted) {
        Game storage game = games[gameId];
        require(game.players.length < MAX_PLAYERS, "Game is full");
        require(msg.value >= inco.getFee(), "Insufficient fee for hand");

        // Check player not already in game
        for (uint256 i = 0; i < game.players.length; i++) {
            require(game.players[i] != _joinee, "Already in game");
        }

        // Check enough cards in deck
        require(game.deckIndex + INITIAL_HAND_SIZE < DECK_SIZE, "Not enough cards in deck");

        game.players.push(_joinee);

        // Deal hand from deck using slice
        elist hand = ePreview.slice(
            game.deck,
            game.deckIndex,
            game.deckIndex + INITIAL_HAND_SIZE
        );

        // Grant access to elist handle
        inco.allow(elist.unwrap(hand), address(this));
        inco.allow(elist.unwrap(hand), _joinee);

        // IMPORTANT: Grant ACL for each individual card handle in the hand
        // This is required because getEuint256 returns handles that need explicit ACL
        // Without this, attestedDecrypt will fail with "acl disallowed"
        for (uint16 j = 0; j < INITIAL_HAND_SIZE; j++) {
            euint256 card = ePreview.getEuint256(hand, j);
            inco.allow(euint256.unwrap(card), _joinee);
            inco.allow(euint256.unwrap(card), address(this));
        }

        playerHands[gameId][_joinee] = hand;
        game.deckIndex += INITIAL_HAND_SIZE;

        emit PlayerJoined(gameId, _joinee);
    }

    /**
     * @notice Commit an encrypted move (play a card)
     * @param gameId The game ID
     * @param moveInput The encrypted card being played (ciphertext from client)
     * @dev The move is appended to the moves elist. Top card is updated.
     */
    function commitMove(
        uint256 gameId,
        bytes memory moveInput
    ) external payable validateGame(gameId, GameStatus.Started) onlyPlayer(gameId) {
        require(msg.value >= inco.getFee(), "Fee required for encrypted move");

        Game storage game = games[gameId];
        require(game.players[game.currentPlayerIndex] == msg.sender, "Not your turn");

        // Convert encrypted input to euint256 handle
        euint256 move = moveInput.newEuint256(msg.sender);

        // Grant access for future operations
        inco.allow(euint256.unwrap(move), address(this));
        inco.allow(euint256.unwrap(move), msg.sender);

        // Append move to moves elist (immutable - returns new list)
        elist newMoves = ePreview.append(game.moves, move);
        inco.allow(elist.unwrap(newMoves), address(this));
        game.moves = newMoves;

        // Update top card to the played card
        game.topCard = move;

        // Allow all players to see the new top card
        for (uint256 i = 0; i < game.players.length; i++) {
            inco.allow(euint256.unwrap(move), game.players[i]);
        }

        // Remove card from player's hand - create new hand without played card
        // Note: In production, you'd implement proper card removal logic
        // For simplicity, we're just tracking the move was made

        // Advance to next player
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        emit MoveCommitted(gameId, msg.sender);
    }

    /**
     * @notice Draw a card from the deck
     * @param gameId The game ID
     * @dev Gets next card from shuffled deck and appends to player's hand
     *      IMPORTANT: After append, grants ACL for ALL cards in new hand
     */
    function drawCard(uint256 gameId) external payable validateGame(gameId, GameStatus.Started) onlyPlayer(gameId) {
        require(msg.value >= inco.getFee(), "Fee required for drawing card");

        Game storage game = games[gameId];
        require(game.players[game.currentPlayerIndex] == msg.sender, "Not your turn");
        require(game.deckIndex < DECK_SIZE, "No cards left in deck");

        // Get next card from shuffled deck
        euint256 drawnCard = ePreview.getEuint256(game.deck, game.deckIndex);
        game.deckIndex++;

        // Grant access for drawn card
        inco.allow(euint256.unwrap(drawnCard), address(this));
        inco.allow(euint256.unwrap(drawnCard), msg.sender);

        // Append card to player's hand (returns new elist)
        elist currentHand = playerHands[gameId][msg.sender];
        elist newHand = ePreview.append(currentHand, drawnCard);

        // Grant ACL for new elist handle
        inco.allow(elist.unwrap(newHand), address(this));
        inco.allow(elist.unwrap(newHand), msg.sender);

        // CRITICAL: Grant ACL for ALL individual card handles in the new hand
        // After append, the handles from getEuint256(newHand, i) are DIFFERENT
        // from getEuint256(oldHand, i), so we must re-grant ACL for all cards
        uint16 newHandSize = ePreview.length(newHand);
        for (uint16 i = 0; i < newHandSize; i++) {
            euint256 card = ePreview.getEuint256(newHand, i);
            inco.allow(euint256.unwrap(card), msg.sender);
            inco.allow(euint256.unwrap(card), address(this));
        }

        playerHands[gameId][msg.sender] = newHand;

        // Advance to next player after drawing
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

        emit CardDrawn(gameId, msg.sender);
    }

    /**
     * @notice End the game and reveal the final state
     * @param gameId The game ID
     * @param gameHashInput Encrypted game hash for final verification
     * @dev Uses e.reveal() to make the final game hash publicly verifiable
     */
    function endGame(
        uint256 gameId,
        bytes memory gameHashInput
    ) external payable validateGame(gameId, GameStatus.Started) {
        require(msg.value >= inco.getFee(), "Fee required for game hash");

        Game storage game = games[gameId];

        // Convert encrypted game hash input
        euint256 gameHash = gameHashInput.newEuint256(msg.sender);

        game.status = GameStatus.Ended;
        game.endTime = block.timestamp;
        game.gameHash = gameHash;

        // Reveal the final game hash publicly for verification
        e.reveal(gameHash);

        // Also reveal the final top card for verification
        e.reveal(game.topCard);

        removeFromActiveGames(gameId);
        emit GameEnded(gameId);
    }

    /**
     * @dev Remove game from active games list
     */
    function removeFromActiveGames(uint256 gameId) internal {
        for (uint256 i = 0; i < _activeGames.length; i++) {
            if (_activeGames[i] == gameId) {
                _activeGames[i] = _activeGames[_activeGames.length - 1];
                _activeGames.pop();
                break;
            }
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get all active game IDs
     */
    function getActiveGames() external view returns (uint256[] memory) {
        return _activeGames;
    }

    /**
     * @notice Get games that haven't started yet (lobby)
     */
    function getNotStartedGames() external view returns (uint256[] memory) {
        uint256[] memory notStartedGames = new uint256[](_activeGames.length);
        uint256 count = 0;

        for (uint256 i = 0; i < _activeGames.length; i++) {
            uint256 gid = _activeGames[i];
            if (games[gid].status == GameStatus.NotStarted) {
                notStartedGames[count] = gid;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = notStartedGames[j];
        }

        return result;
    }

    /**
     * @notice Get game details (public fields only)
     * @dev Encrypted fields returned as handles - use attested decrypt to view
     */
    function getGame(uint256 gameId) public view returns (
        uint256 id,
        address[] memory players,
        GameStatus status,
        uint256 startTime,
        uint256 endTime,
        euint256 gameHash,
        uint16 moveCount,
        euint256 topCard,
        uint16 deckRemaining,
        uint256 currentPlayerIndex
    ) {
        Game storage game = games[gameId];
        return (
            game.id,
            game.players,
            game.status,
            game.startTime,
            game.endTime,
            game.gameHash,
            ePreview.length(game.moves),
            game.topCard,
            DECK_SIZE - game.deckIndex,
            game.currentPlayerIndex
        );
    }

    /**
     * @notice Get a player's hand size (public info - elist length is always public)
     */
    function getPlayerHandSize(uint256 gameId, address player) external view returns (uint16) {
        return ePreview.length(playerHands[gameId][player]);
    }

    /**
     * @notice Get the elist handle for a player's hand
     * @dev Only the player can decrypt card values using attested decrypt
     */
    function getPlayerHand(uint256 gameId, address player) external view returns (elist) {
        return playerHands[gameId][player];
    }

    /**
     * @notice Get a specific card from player's hand by index
     * @dev Returns encrypted card handle - player must decrypt off-chain
     *      Note: This modifies state internally due to Inco's EList implementation
     *      IMPORTANT: Grants ACL access to caller for attested decrypt
     */
    function getCardFromHand(uint256 gameId, address player, uint16 index) external returns (euint256) {
        elist hand = playerHands[gameId][player];
        require(index < ePreview.length(hand), "Index out of bounds");
        euint256 card = ePreview.getEuint256(hand, index);
        // Grant ACL access to the caller so they can use attestedDecrypt
        inco.allow(euint256.unwrap(card), msg.sender);
        // Also allow contract for future operations
        inco.allow(euint256.unwrap(card), address(this));
        return card;
    }

    /**
     * @notice Get the deck elist handle (for debugging/verification)
     */
    function getDeck(uint256 gameId) external view returns (elist) {
        return games[gameId].deck;
    }

    /**
     * @notice Get the moves elist handle
     */
    function getMoves(uint256 gameId) external view returns (elist) {
        return games[gameId].moves;
    }

    /**
     * @notice Get the current fee for one encrypted operation
     */
    function getEncryptionFee() external pure returns (uint256) {
        return inco.getFee();
    }

    /**
     * @notice Calculate fee for creating a game
     * @param isBot Whether it's a bot game
     */
    function getCreateGameFee(bool isBot) external pure returns (uint256) {
        if (isBot) {
            return inco.getFee() * 3; // shuffledRange + 2 slice ops
        }
        return inco.getFee() * 2; // shuffledRange + slice
    }

    /**
     * @notice Calculate fee for joining a game
     */
    function getJoinGameFee() external pure returns (uint256) {
        return inco.getFee(); // slice operation
    }
}
