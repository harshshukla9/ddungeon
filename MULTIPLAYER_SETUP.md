# DDungeon Multiplayer Setup

This guide will help you set up and run the multiplayer functionality for DDungeon.

## Features

- **Cooperative Mode**: Players work together with shared health and combined score
- **Competitive Mode**: Players compete individually for the highest score
- **Real-time Synchronization**: Player movements, attacks, and game events sync across all players
- **Room System**: Create or join game rooms with up to 4 players
- **Lobby System**: Easy room discovery and player management
- **Web3 Integration**: Built with RainbowKit and Wagmi for blockchain connectivity
- **Modern UI**: Uses Shadcn UI components with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

The multiplayer system uses Socket.IO for real-time communication and includes Web3 integration:

```bash
pnpm install
```

Key dependencies include:
- `socket.io-client`: WebSocket communication
- `mobx` & `mobx-react-lite`: State management
- `@rainbow-me/rainbowkit` & `wagmi`: Web3 integration
- `phaser`: Game engine
- `@radix-ui/*`: UI components

### 2. Start the WebSocket Server

You'll need to run a WebSocket server for multiplayer functionality. The server is already set up in the `server/` directory:

```bash
# Navigate to server directory
cd server

# Install server dependencies
pnpm install

# Start the server
pnpm start
```

Alternatively, you can use the development mode with auto-restart:
```bash
pnpm dev
```

The server will run on `http://localhost:3001` by default and uses Socket.IO for WebSocket communication.

### 3. Start the Game

In a separate terminal (from the project root), start your game:

```bash
pnpm dev
```

The game will be available at `http://localhost:5173` (Vite default port).

### 4. Access Multiplayer

1. Open your game in the browser at `http://localhost:5173`
2. Click "Multiplayer" on the main menu
3. Enter your player name and choose a color (Red, Blue, Green, Yellow, Purple, Orange)
4. Either create a new room or join an existing one
5. Wait for the host to start the game
6. Start playing with friends!

## Game Modes

### Cooperative Mode
- All players share the same health pool
- Score is combined across all players
- Players work together to survive and progress
- If shared health reaches 0, the game ends for everyone

### Competitive Mode
- Each player has individual health and score
- Players compete for the highest score
- Players can be eliminated individually
- Last player standing or highest score wins

## Controls

- **Movement**: Arrow keys or WASD
- **Attack**: Spacebar
- **Return to Lobby**: ESC key

## Multiplayer UI

The multiplayer interface shows:
- Current game mode (Cooperative/Competitive)
- Player health (shared or individual)
- Score (team or individual)
- Player list with colors and scores
- Recent game events
- Room information

## Technical Details

### Architecture
- **Frontend**: React + Vite + Phaser.js with MobX for state management
- **Backend**: Node.js + Socket.IO for real-time communication
- **State Management**: MobX for reactive state updates
- **UI Framework**: Shadcn UI components with Tailwind CSS
- **Web3**: RainbowKit + Wagmi for blockchain integration
- **Network Protocol**: Socket.IO WebSocket messages for game synchronization

### Key Components
- `MultiplayerClient` (`src/lib/multiplayer/client.ts`): Handles WebSocket communication
- `MultiplayerState` (`src/lib/multiplayer/state.ts`): Manages multiplayer game state
- `MultiplayerPlayer` (`src/components/game/entities/multiplayer-player.ts`): Network-synchronized player entity
- `MultiplayerDungeonScene` (`src/components/game/scenes/multiplayer-dungeon.tsx`): Multiplayer game scene
- `MultiplayerLobbyScene` (`src/components/game/scenes/multiplayer-lobby-scene.tsx`): Room creation and joining
- `MultiplayerLobby` (`src/components/multiplayer-lobby.tsx`): React lobby component
- `MultiplayerUI` (`src/components/multiplayer-ui.tsx`): In-game multiplayer interface

### Network Events
- `create_room`: Create a new game room
- `join_room`: Join an existing room
- `leave_room`: Leave current room
- `player_joined/left`: Player connection management
- `player_update`: Position and state synchronization
- `game_event`: Game actions (attacks, coin pickup, etc.)
- `get_room_list`: Request list of available rooms
- `start_game`: Host starts the game
- `game_started`: Game start notification

## Troubleshooting

### Connection Issues
- Ensure the WebSocket server is running on port 3001
- Check that no firewall is blocking the connection
- Verify the server URL in `src/lib/multiplayer/client.ts` (default: `ws://localhost:3001`)
- Check browser console for WebSocket connection errors

### Game Sync Issues
- Check browser console for WebSocket errors
- Ensure all players have stable internet connections
- Restart the server if synchronization problems persist
- Verify all players are in the same room before starting the game

### Performance
- Limit rooms to 4 players maximum for optimal performance
- Close unused browser tabs to free up resources
- Use a wired internet connection for best results
- Ensure the server has sufficient resources for multiple concurrent rooms

## Development

To extend the multiplayer functionality:

1. **Add New Game Events**: Update the `GameEvent` type in `src/lib/multiplayer/types.ts` and handle them in the client
2. **Custom Game Modes**: Extend the game mode system in `MultiplayerDungeonScene`
3. **Additional UI**: Add new components to the multiplayer UI system using Shadcn UI
4. **Server Features**: Extend the WebSocket server in `server/server-example.js` with new event handlers
5. **State Management**: Update `MultiplayerState` class for new state properties

## Production Deployment

For production deployment:

1. **Server**: Deploy the WebSocket server to a cloud service (Heroku, AWS, etc.)
2. **Client**: Update the server URL in `src/lib/multiplayer/client.ts` to point to your production server
3. **Environment**: Set up environment variables for production server URL
4. **Scaling**: Consider using Redis for room state management in multi-server setups
5. **Security**: Add authentication and rate limiting to the WebSocket server
6. **Build**: Use `pnpm build` to create production build of the client

## Contributing

When adding new multiplayer features:

1. Update the TypeScript types in `src/lib/multiplayer/types.ts`
2. Implement client-side logic in the appropriate components
3. Add server-side handling in `server/server-example.js`
4. Update the `MultiplayerState` class for new state management
5. Test with multiple clients to ensure synchronization
6. Update this documentation with new features

Enjoy playing DDungeon with friends! 🎮
