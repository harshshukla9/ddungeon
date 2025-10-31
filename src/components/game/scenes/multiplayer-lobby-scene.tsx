import Phaser from 'phaser';
import { multiplayerState, multiplayerClient } from '~/lib/multiplayer';
import { reaction } from 'mobx';

export class MultiplayerLobbyScene extends Phaser.Scene {
  private connectionStatusText!: Phaser.GameObjects.Text;
  private isConnected = false;
  private isTransitioning = false;
  
  // Player setup UI
  private playerSetupContainer!: Phaser.GameObjects.Container;
  private playerNameText!: Phaser.GameObjects.Text;
  private playerColorText!: Phaser.GameObjects.Text;
  private createPlayerButton!: Phaser.GameObjects.Text;
  private selectedColor = 'blue';
  private playerName = '';
  
  // Room creation UI
  private roomCreationContainer!: Phaser.GameObjects.Container;
  private roomNameText!: Phaser.GameObjects.Text;
  private gameModeText!: Phaser.GameObjects.Text;
  private createRoomButton!: Phaser.GameObjects.Text;
  private selectedGameMode: 'cooperative' | 'competitive' = 'cooperative';
  
  // Room list UI
  private roomListContainer!: Phaser.GameObjects.Container;
  private roomListText!: Phaser.GameObjects.Text;
  private refreshButton!: Phaser.GameObjects.Text;
  private roomButtons: Phaser.GameObjects.Text[] = [];
  
  // Current room UI
  private currentRoomContainer!: Phaser.GameObjects.Container;
  private roomInfoText!: Phaser.GameObjects.Text;
  private playerListText!: Phaser.GameObjects.Text;
  private startGameButton!: Phaser.GameObjects.Text;
  private leaveRoomButton!: Phaser.GameObjects.Text;
  
  // Input handling
  private inputText = '';
  private isTyping = false;
  private currentInputField = '';
  
  // MobX reaction disposer
  private stateReactionDisposer?: () => void;

  constructor() {
    super({ key: 'MultiplayerLobbyScene' });
  }

  preload() {
    this.load.image('background', '/background.png');
    this.load.image('logo', '/logo.png');
  }

  create() {
    console.log('MultiplayerLobbyScene created');
    const { width, height } = this.scale;
    
    // Background
    const bgImage = this.add.image(width / 2, height / 2, 'background');
    
    // Get the actual texture dimensions
    const texture = bgImage.texture;
    const source = texture.source[0];
    const bgWidth = source?.width ?? bgImage.width;
    const bgHeight = source?.height ?? bgImage.height;
    
    // Calculate scale to cover the entire viewport while maintaining aspect ratio
    const scaleX = width / bgWidth;
    const scaleY = height / bgHeight;
    const scale = Math.max(scaleX, scaleY);
    
    bgImage
      .setOrigin(0.5, 0.5)
      .setScale(scale);
    
    // Logo
    this.add
      .image(width / 2, height / 4, 'logo')
      .setScale(0.1)
      .setDepth(1);

    // Title
    this.add
      .text(width / 2, height / 3 + 80, 'Multiplayer Lobby', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Connection status
    this.connectionStatusText = this.add
      .text(width / 2, height / 3 + 130, 'Connecting...', {
        fontSize: '18px',
        color: '#ffff00',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Connect to multiplayer server
    void this.connectToServer();

    // Setup simple UI elements
    this.setupSimpleUI();
    
    // Setup MobX reaction to watch for state changes
    this.setupStateReaction();
    
    // Setup game started listener
    this.setupGameStartedListener();
  }

  private async connectToServer() {
    try {
      const connected = await multiplayerClient.connect();
      this.isConnected = connected;
      
      if (connected) {
        this.updateConnectionStatus('Connected to server', '#00ff00');
        multiplayerClient.requestRoomList();
      } else {
        this.updateConnectionStatus('Failed to connect', '#ff0000');
      }
    } catch (error) {
      console.error('Connection error:', error);
      this.updateConnectionStatus('Connection error', '#ff0000');
    }
  }

  private updateConnectionStatus(text: string, color: string) {
    this.connectionStatusText.setText(text).setColor(color);
  }

  private setupSimpleUI() {
    // Setup input handling
    this.setupInputHandling();
    
    // Create UI containers
    this.createPlayerSetupUI();
    this.createRoomCreationUI();
    this.createRoomListUI();
    this.createCurrentRoomUI();
    
    // Show appropriate UI based on state
    this.updateUI();
    
    // Add ESC key listener
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('HomeScene');
    });
  }

  private setupStateReaction() {
    // Watch for changes in localPlayer and currentRoom
    this.stateReactionDisposer = reaction(
      () => ({
        localPlayer: multiplayerState.localPlayer,
        currentRoom: multiplayerState.currentRoom,
        availableRooms: multiplayerState.availableRooms
      }),
      (state) => {
        if (this.isTransitioning) return; // Don't update UI during transition
        console.log('State changed, updating UI:', state);
        this.updateUI();
      }
    );
  }

  private setupGameStartedListener() {
    multiplayerClient.onGameStarted(() => {
      if (this.isTransitioning) return; // Prevent multiple transitions
      console.log('Game started! Transitioning to multiplayer dungeon...');
      this.isTransitioning = true;
      this.cleanup();
      this.scene.start('MultiplayerDungeonScene');
      this.scene.stop();
    });
  }

  private setupInputHandling() {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isTransitioning) return; // Don't process input during transition
      console.log('Key pressed:', event.key, 'isTyping:', this.isTyping);
      
      if (!this.isTyping) return;
      
      if (event.key === 'Enter') {
        console.log('Enter pressed, calling handleInputSubmit');
        this.handleInputSubmit();
      } else if (event.key === 'Backspace') {
        this.inputText = this.inputText.slice(0, -1);
      } else if (event.key.length === 1) {
        this.inputText += event.key;
      }
      
      this.updateInputDisplay();
    });
  }

  private createPlayerSetupUI() {
    const { width, height } = this.scale;
    
    this.playerSetupContainer = this.add.container(width / 2, height / 2 + 180);
    
    // Background panel
    const panelBg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0x444444);
    this.playerSetupContainer.add(panelBg);
    
    // Title
    const title = this.add.text(0, -120, 'Player Setup', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);
    
    // Player name
    this.playerNameText = this.add.text(0, -60, 'Name: [Click to enter]', {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: '#222222',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.playerNameText.on('pointerdown', () => {
      console.log('Name input clicked!');
      this.startTyping('name');
    });
    
    this.playerNameText.on('pointerover', () => {
      this.playerNameText.setBackgroundColor('#333333');
    });
    
    this.playerNameText.on('pointerout', () => {
      this.playerNameText.setBackgroundColor('#222222');
    });
    
    // Player color
    this.playerColorText = this.add.text(0, -10, 'Color: Blue [Click to change]', {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: '#222222',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.playerColorText.on('pointerdown', () => {
      this.cycleColor();
    });
    
    this.playerColorText.on('pointerover', () => {
      this.playerColorText.setBackgroundColor('#333333');
    });
    
    this.playerColorText.on('pointerout', () => {
      this.playerColorText.setBackgroundColor('#222222');
    });
    
    // Create player button
    this.createPlayerButton = this.add.text(0, 50, 'Create Player', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#006600',
      padding: { x: 25, y: 12 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.createPlayerButton.on('pointerdown', () => {
      console.log('Create Player button clicked!');
      this.createPlayer();
    });
    
    this.createPlayerButton.on('pointerover', () => {
      this.createPlayerButton.setBackgroundColor('#008800');
    });
    
    this.createPlayerButton.on('pointerout', () => {
      this.createPlayerButton.setBackgroundColor('#006600');
    });
    
    this.playerSetupContainer.add([
      panelBg,
      title,
      this.playerNameText,
      this.playerColorText,
      this.createPlayerButton
    ]);
  }

  private createRoomCreationUI() {
    const { width, height } = this.scale;
    
    this.roomCreationContainer = this.add.container(width / 2 - 220, height / 2 + 150);
    
    // Background panel
    const panelBg = this.add.rectangle(0, 0, 400, 250, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0x444444);
    this.roomCreationContainer.add(panelBg);
    
    // Title
    const title = this.add.text(0, -100, 'Create Room', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);
    
    // Room name
    this.roomNameText = this.add.text(0, -40, 'Room Name: [Click to enter]', {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: '#222222',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.roomNameText.on('pointerdown', () => {
      this.startTyping('roomName');
    });
    
    this.roomNameText.on('pointerover', () => {
      this.roomNameText.setBackgroundColor('#333333');
    });
    
    this.roomNameText.on('pointerout', () => {
      this.roomNameText.setBackgroundColor('#222222');
    });
    
    // Game mode
    this.gameModeText = this.add.text(0, 10, 'Mode: Cooperative [Click to change]', {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'Arial',
      backgroundColor: '#222222',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.gameModeText.on('pointerdown', () => {
      this.toggleGameMode();
    });
    
    this.gameModeText.on('pointerover', () => {
      this.gameModeText.setBackgroundColor('#333333');
    });
    
    this.gameModeText.on('pointerout', () => {
      this.gameModeText.setBackgroundColor('#222222');
    });
    
    // Create room button
    this.createRoomButton = this.add.text(0, 70, 'Create Room', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#0066cc',
      padding: { x: 25, y: 12 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.createRoomButton.on('pointerdown', () => {
      this.createRoom();
    });
    
    this.createRoomButton.on('pointerover', () => {
      this.createRoomButton.setBackgroundColor('#0088ff');
    });
    
    this.createRoomButton.on('pointerout', () => {
      this.createRoomButton.setBackgroundColor('#0066cc');
    });
    
    this.roomCreationContainer.add([
      panelBg,
      title,
      this.roomNameText,
      this.gameModeText,
      this.createRoomButton
    ]);
  }

  private createRoomListUI() {
    const { width, height } = this.scale;
    
    this.roomListContainer = this.add.container(width / 2 + 220, height / 2 + 150);
    
    // Background panel
    const panelBg = this.add.rectangle(0, 0, 400, 250, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0x444444);
    this.roomListContainer.add(panelBg);
    
    // Title
    const title = this.add.text(0, -100, 'Available Rooms', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);
    
    // Room list
    this.roomListText = this.add.text(0, -20, 'No rooms available', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 350 },
    }).setOrigin(0.5).setDepth(1);
    
    // Refresh button
    this.refreshButton = this.add.text(0, 60, 'Refresh Rooms', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#cc6600',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.refreshButton.on('pointerdown', () => {
      multiplayerClient.requestRoomList();
    });
    
    this.refreshButton.on('pointerover', () => {
      this.refreshButton.setBackgroundColor('#ff8800');
    });
    
    this.refreshButton.on('pointerout', () => {
      this.refreshButton.setBackgroundColor('#cc6600');
    });
    
    this.roomListContainer.add([
      panelBg,
      title,
      this.roomListText,
      this.refreshButton
    ]);
  }

  private createCurrentRoomUI() {
    const { width, height } = this.scale;
    
    this.currentRoomContainer = this.add.container(width / 2, height / 2 + 200);
    
    // Background panel
    const panelBg = this.add.rectangle(0, 0, 450, 350, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0x444444);
    this.currentRoomContainer.add(panelBg);
    
    // Room info
    this.roomInfoText = this.add.text(0, -140, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(1);
    
    // Player list
    this.playerListText = this.add.text(0, -40, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 400 },
    }).setOrigin(0.5).setDepth(1);
    
    // Start game button
    this.startGameButton = this.add.text(-100, 100, 'Start Game', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#006600',
      padding: { x: 25, y: 12 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.startGameButton.on('pointerdown', () => {
      console.log('Start Game button clicked');
      multiplayerClient.startGame();
      
      // Fallback: if no server response in 2 seconds, start locally
      this.time.delayedCall(2000, () => {
        if (this.isTransitioning) return; // Prevent multiple transitions
        console.log('No server response, starting game locally...');
        this.isTransitioning = true;
        this.cleanup();
        this.scene.start('MultiplayerDungeonScene');
        this.scene.stop();
      });
    });
    
    this.startGameButton.on('pointerover', () => {
      this.startGameButton.setBackgroundColor('#008800');
    });
    
    this.startGameButton.on('pointerout', () => {
      this.startGameButton.setBackgroundColor('#006600');
    });
    
    // Leave room button
    this.leaveRoomButton = this.add.text(100, 100, 'Leave Room', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      backgroundColor: '#cc0000',
      padding: { x: 25, y: 12 },
    }).setOrigin(0.5).setDepth(1).setInteractive();
    
    this.leaveRoomButton.on('pointerdown', () => {
      multiplayerClient.leaveRoom();
    });
    
    this.leaveRoomButton.on('pointerover', () => {
      this.leaveRoomButton.setBackgroundColor('#ff0000');
    });
    
    this.leaveRoomButton.on('pointerout', () => {
      this.leaveRoomButton.setBackgroundColor('#cc0000');
    });
    
    this.currentRoomContainer.add([
      panelBg,
      this.roomInfoText,
      this.playerListText,
      this.startGameButton,
      this.leaveRoomButton
    ]);
  }

  // Helper methods for UI functionality
  private startTyping(field: string) {
    console.log('startTyping called for field:', field);
    this.isTyping = true;
    this.currentInputField = field;
    this.inputText = '';
    this.updateInputDisplay();
  }

  private handleInputSubmit() {
    console.log('handleInputSubmit called, field:', this.currentInputField, 'text:', this.inputText);
    
    if (this.currentInputField === 'name') {
      this.playerName = this.inputText;
      console.log('Player name set to:', this.playerName);
      this.playerNameText.setText(`Name: ${this.playerName}`);
      this.playerNameText.setBackgroundColor('#222222');
    } else if (this.currentInputField === 'roomName') {
      this.roomNameText.setText(`Room Name: ${this.inputText}`);
      this.roomNameText.setBackgroundColor('#222222');
    }
    
    this.isTyping = false;
    this.currentInputField = '';
    this.inputText = '';
  }

  private updateInputDisplay() {
    if (this.isTyping) {
      const displayText = `${this.inputText}_`;
      console.log('updateInputDisplay - inputText:', this.inputText, 'displayText:', displayText);
      if (this.currentInputField === 'name') {
        this.playerNameText.setText(`Name: ${displayText}`);
        this.playerNameText.setBackgroundColor('#444444');
      } else if (this.currentInputField === 'roomName') {
        this.roomNameText.setText(`Room Name: ${displayText}`);
        this.roomNameText.setBackgroundColor('#444444');
      }
    }
  }

  private cycleColor() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const colorCodes = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080', '#ffa500'];
    const currentIndex = colors.indexOf(this.selectedColor);
    this.selectedColor = colors[(currentIndex + 1) % colors.length] ?? 'blue';
    const colorCode = colorCodes[(currentIndex + 1) % colorCodes.length];
    
    this.playerColorText.setText(`Color: ${this.selectedColor.charAt(0).toUpperCase()}${this.selectedColor.slice(1)} [Click to change]`);
    this.playerColorText.setColor(colorCode ?? '#ffff00');
  }

  private toggleGameMode() {
    this.selectedGameMode = this.selectedGameMode === 'cooperative' ? 'competitive' : 'cooperative';
    this.gameModeText.setText(`Mode: ${this.selectedGameMode.charAt(0).toUpperCase()}${this.selectedGameMode.slice(1)} [Click to change]`);
    
    // Change color based on mode
    if (this.selectedGameMode === 'cooperative') {
      this.gameModeText.setColor('#00ff00'); // Green for cooperative
    } else {
      this.gameModeText.setColor('#ff6600'); // Orange for competitive
    }
  }

  private createPlayer() {
    console.log('createPlayer called, playerName:', this.playerName, 'inputText:', this.inputText, 'selectedColor:', this.selectedColor);
    
    // Use inputText if playerName is not set (user didn't press Enter)
    const nameToUse = this.playerName.trim() || this.inputText.trim();
    
    if (!nameToUse) {
      console.log('No player name provided');
      this.playerNameText.setText('Name: [Enter a name first!]');
      return;
    }
    
    // If we used inputText, store it in playerName
    if (!this.playerName.trim()) {
      this.playerName = this.inputText;
      this.playerNameText.setText(`Name: ${this.playerName}`);
      this.playerNameText.setBackgroundColor('#222222');
      this.isTyping = false;
      this.currentInputField = '';
      this.inputText = '';
    }
    
    console.log('Creating local player with name:', nameToUse);
    const player = multiplayerState.createLocalPlayer(nameToUse, this.selectedColor);
    console.log('Player created:', player);
    console.log('Local player set:', multiplayerState.localPlayer);
    
    this.updateUI();
    console.log('UI updated');
  }

  private createRoom() {
    if (!multiplayerState.localPlayer) {
      this.createPlayer();
      return;
    }
    
    const roomName = this.roomNameText.text.replace('Room Name: ', '');
    if (roomName === '[Click to enter]' || !roomName.trim()) {
      this.roomNameText.setText('Room Name: [Enter a room name!]');
      return;
    }
    
    multiplayerClient.createRoom(roomName, this.selectedGameMode, 4);
  }

  private updateUI() {
    if (this.isTransitioning) return; // Don't update UI during transition
    
    console.log('updateUI called, localPlayer:', multiplayerState.localPlayer, 'currentRoom:', multiplayerState.currentRoom);
    
    // Hide all containers first
    this.playerSetupContainer.setVisible(false);
    this.roomCreationContainer.setVisible(false);
    this.roomListContainer.setVisible(false);
    this.currentRoomContainer.setVisible(false);
    
    if (!multiplayerState.localPlayer) {
      console.log('Showing player setup');
      // Show player setup
      this.playerSetupContainer.setVisible(true);
    } else if (multiplayerState.currentRoom) {
      console.log('Showing current room');
      // Show current room
      this.currentRoomContainer.setVisible(true);
      this.updateCurrentRoomUI();
    } else {
      console.log('Showing room creation and list');
      // Show room creation and list
      this.roomCreationContainer.setVisible(true);
      this.roomListContainer.setVisible(true);
      this.updateRoomListUI();
    }
  }

  private updateCurrentRoomUI() {
    if (!multiplayerState.currentRoom) return;
    
    const room = multiplayerState.currentRoom;
    this.roomInfoText.setText(`Room: ${room.name}\nMode: ${room.gameMode}\nPlayers: ${String(room.players.length)}/${String(room.maxPlayers)}`);
    
    const playerList = room.players.map(p => 
      `${p.name} (${p.color})${p.id === multiplayerState.localPlayer?.id ? ' (You)' : ''}`
    ).join('\n');
    
    this.playerListText.setText(playerList);
    
    // Only show start game button if host
    this.startGameButton.setVisible(multiplayerState.isHost);
  }

  private updateRoomListUI() {
    const rooms = multiplayerState.availableRooms;
    
    // Clear existing room buttons
    this.roomButtons.forEach(button => button.destroy());
    this.roomButtons = [];
    
    if (rooms.length === 0) {
      this.roomListText.setText('No rooms available\n\nCreate a room to get started!');
    } else {
      this.roomListText.setText('Click a room to join:');
      
      // Create clickable room buttons
      rooms.forEach((room, index) => {
        const roomButton = this.add.text(0, -20 + (index * 30), 
          `${room.name} (${String(room.players.length)}/${String(room.maxPlayers)}) - ${room.gameMode}`, {
          fontSize: '14px',
          color: '#ffff00',
          fontFamily: 'Arial',
          backgroundColor: '#333333',
          padding: { x: 10, y: 5 },
        }).setOrigin(0.5).setDepth(1).setInteractive();
        
        roomButton.on('pointerdown', () => {
          console.log('Joining room:', room.name);
          multiplayerClient.joinRoom(room.id);
        });
        
        roomButton.on('pointerover', () => {
          roomButton.setBackgroundColor('#444444');
        });
        
        roomButton.on('pointerout', () => {
          roomButton.setBackgroundColor('#333333');
        });
        
        this.roomListContainer.add(roomButton);
        this.roomButtons.push(roomButton);
      });
    }
  }


  update() {
    if (this.isTransitioning) {
      return; // Don't update during transition
    }
    
    // Don't continuously update room list - it's handled by MobX reactions
    // The updateRoomListUI() is called when availableRooms changes via MobX reaction
  }

  private cleanup() {
    // Remove all input handlers
    this.input.keyboard?.off('keydown');
    this.input.keyboard?.off('keydown-ESC');
    
    // Clean up MobX reaction
    if (this.stateReactionDisposer) {
      this.stateReactionDisposer();
    }
    
    // Clear all timers
    this.time.removeAllEvents();
    
    // Remove all event listeners from UI elements
    this.playerNameText.removeAllListeners();
    this.playerColorText.removeAllListeners();
    this.createPlayerButton.removeAllListeners();
    this.roomNameText.removeAllListeners();
    this.gameModeText.removeAllListeners();
    this.createRoomButton.removeAllListeners();
    this.refreshButton.removeAllListeners();
    
    // Clean up room buttons
    this.roomButtons.forEach(button => {
      button.removeAllListeners();
    });
    this.startGameButton.removeAllListeners();
    this.leaveRoomButton.removeAllListeners();
    
    console.log('MultiplayerLobbyScene cleaned up');
  }

  destroy() {
    this.cleanup();
  }
}
