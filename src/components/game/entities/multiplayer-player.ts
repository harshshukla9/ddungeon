import Phaser from 'phaser';
import { multiplayerClient } from '~/lib/multiplayer';
import type { Player as NetworkPlayer } from '~/lib/multiplayer/types';
import type { DungeonGameScene } from '../scenes';

export class MultiplayerPlayer {
  public scene: Phaser.Scene;
  public sprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  public networkPlayer: NetworkPlayer;
  public isLocal: boolean;
  public lastUpdateTime: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public interpolationSpeed: number = 0.1;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: {
    space: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, networkPlayer: NetworkPlayer, isLocal: boolean = false) {
    this.scene = scene;
    this.networkPlayer = networkPlayer;
    this.isLocal = isLocal;

    this.createAnimations();
    this.createSprite();
    this.setupPhysics();
    
    if (this.isLocal) {
      this.setupInput();
    }
  }

  private createAnimations(): void {
    const anims = this.scene.anims;

    // Idle Animation
    anims.create({
      key: `idle-${this.networkPlayer.id}`,
      frames: anims.generateFrameNumbers('Soldier-Idle', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });

    // Walk Animation
    anims.create({
      key: `walk-${this.networkPlayer.id}`,
      frames: anims.generateFrameNumbers('Soldier-Walk', { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    // Attack Animation
    anims.create({
      key: `attack-${this.networkPlayer.id}`,
      frames: anims.generateFrameNumbers('Soldier-Attack', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: 0,
    });

    // Hurt Animation
    anims.create({
      key: `hurt-${this.networkPlayer.id}`,
      frames: anims.generateFrameNumbers('Soldier-Hurt', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });

    // Death Animation
    anims.create({
      key: `death-${this.networkPlayer.id}`,
      frames: anims.generateFrameNumbers('Soldier-Death', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: 0,
    });
  }

  private createSprite(): void {
    this.sprite = this.scene.physics.add.sprite(
      this.networkPlayer.x,
      this.networkPlayer.y,
      'Soldier-Idle',
      0
    ).setScale(3);

    // Set player color tint
    const colorMap: Record<string, number> = {
      'red': 0xff0000,
      'blue': 0x0000ff,
      'green': 0x00ff00,
      'yellow': 0xffff00,
      'purple': 0xff00ff,
      'orange': 0xffa500,
    };
    
    if (colorMap[this.networkPlayer.color]) {
      this.sprite.setTint(colorMap[this.networkPlayer.color]);
    }

    this.targetX = this.networkPlayer.x;
    this.targetY = this.networkPlayer.y;
  }

  private setupPhysics(): void {
    this.sprite.body.setSize(12, 12);
  }

  private setupInput(): void {
    this.keys = this.scene.input.keyboard?.createCursorKeys();
    this.wasd = this.scene.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as {
      w: Phaser.Input.Keyboard.Key;
      s: Phaser.Input.Keyboard.Key;
      a: Phaser.Input.Keyboard.Key;
      d: Phaser.Input.Keyboard.Key;
    };

    this.spaceKey = this.scene.input.keyboard?.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as {
      space: Phaser.Input.Keyboard.Key;
    };
  }

  public update(scene: DungeonGameScene): void {
    if (this.isLocal) {
      this.handleLocalInput(scene);
    } else {
      this.handleNetworkUpdate();
    }

    this.updateAnimation();
    this.updateHealthDisplay();
  }

  private handleLocalInput(scene: DungeonGameScene): void {
    if (!this.keys || !this.wasd || !this.spaceKey || !this.sprite.body) return;

    const speed = 300;
    let direction: NetworkPlayer['direction'] = 'idle';
    let moving = false;

    // Handle movement
    this.sprite.body.setVelocity(0);

    if (this.keys.left.isDown || this.wasd.a.isDown) {
      this.sprite.body.setVelocityX(-speed);
      this.sprite.setFlipX(true);
      direction = 'left';
      moving = true;
    } else if (this.keys.right.isDown || this.wasd.d.isDown) {
      this.sprite.body.setVelocityX(speed);
      this.sprite.setFlipX(false);
      direction = 'right';
      moving = true;
    }

    if (this.keys.up.isDown || this.wasd.w.isDown) {
      this.sprite.body.setVelocityY(-speed);
      direction = 'up';
      moving = true;
    } else if (this.keys.down.isDown || this.wasd.s.isDown) {
      this.sprite.body.setVelocityY(speed);
      direction = 'down';
      moving = true;
    }

    // Normalize velocity for diagonal movement
    this.sprite.body.velocity.normalize().scale(speed);

    // Handle attack
    if (this.spaceKey.space.isDown) {
      this.attack(scene);
    }

    // Update network player data
    this.networkPlayer.x = this.sprite.x;
    this.networkPlayer.y = this.sprite.y;
    this.networkPlayer.direction = direction;

    // Send position update to server
    multiplayerClient.updatePlayerPosition(this.sprite.x, this.sprite.y, direction);
  }

  private handleNetworkUpdate(): void {
    // Interpolate position for smooth movement
    const dx = this.networkPlayer.x - this.sprite.x;
    const dy = this.networkPlayer.y - this.sprite.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.sprite.x += dx * this.interpolationSpeed;
      this.sprite.y += dy * this.interpolationSpeed;
    } else {
      this.sprite.x = this.networkPlayer.x;
      this.sprite.y = this.networkPlayer.y;
    }

    // Update sprite flip based on direction
    if (this.networkPlayer.direction === 'left') {
      this.sprite.setFlipX(true);
    } else if (this.networkPlayer.direction === 'right') {
      this.sprite.setFlipX(false);
    }
  }

  private updateAnimation(): void {
    const animKey = (anim: string) => `${anim}-${this.networkPlayer.id}`;

    if (this.networkPlayer.isDying) {
      this.sprite.anims.play(animKey('death'), true);
      return;
    }

    if (this.networkPlayer.isAttacking) {
      this.sprite.anims.play(animKey('attack'), true);
      return;
    }

    if (this.networkPlayer.isHurting) {
      this.sprite.anims.play(animKey('hurt'), true);
      return;
    }

    if (this.networkPlayer.direction !== 'idle') {
      this.sprite.anims.play(animKey('walk'), true);
    } else {
      this.sprite.anims.play(animKey('idle'), true);
    }
  }

  private updateHealthDisplay(): void {
    // Update health bar or other UI elements here
    // This could be handled by the scene or UI components
  }

  public attack(scene: DungeonGameScene): void {
    if (this.networkPlayer.isAttacking) return;

    this.networkPlayer.isAttacking = true;
    multiplayerClient.updatePlayerState({ isAttacking: true });

    // Send attack event
    multiplayerClient.sendGameEvent({
      type: 'player_attack',
      playerId: this.networkPlayer.id,
      data: { x: this.sprite.x, y: this.sprite.y },
    });

    // Damage nearby enemies (similar to single-player logic)
    if (scene.enemies) {
      for (const enemy of scene.enemies) {
        if (!enemy.sprite) continue;
        const distance = Phaser.Math.Distance.Between(
          this.sprite.x,
          this.sprite.y,
          enemy.sprite.x,
          enemy.sprite.y
        );
        if (distance < 50) {
          // Play attack sound
          const attackSound = this.scene.sound.add('playerAttackSound');
          attackSound.play();
          
          // Damage enemy after a short delay (to match animation timing)
          this.scene.time.delayedCall(500, () => {
            enemy.onHitByPlayer(this.scene);
          });
        }
      }
    }

    // Reset attack state after animation
    this.scene.time.delayedCall(1000, () => {
      this.networkPlayer.isAttacking = false;
      multiplayerClient.updatePlayerState({ isAttacking: false });
    });
  }

  public takeDamage(damage: number): void {
    this.networkPlayer.health = Math.max(0, this.networkPlayer.health - damage);
    this.networkPlayer.isHurting = true;

    multiplayerClient.updatePlayerState({ 
      health: this.networkPlayer.health,
      isHurting: true 
    });

    // Send damage event
    multiplayerClient.sendGameEvent({
      type: 'player_hurt',
      playerId: this.networkPlayer.id,
      data: { damage, health: this.networkPlayer.health },
    });

    // Reset hurt state
    this.scene.time.delayedCall(1000, () => {
      this.networkPlayer.isHurting = false;
      multiplayerClient.updatePlayerState({ isHurting: false });
    });

    // Check for death
    if (this.networkPlayer.health <= 0) {
      this.die();
    }
  }

  public die(): void {
    this.networkPlayer.isDying = true;
    this.networkPlayer.health = 0;

    multiplayerClient.updatePlayerState({ 
      isDying: true,
      health: 0 
    });

    // Send death event
    multiplayerClient.sendGameEvent({
      type: 'player_die',
      playerId: this.networkPlayer.id,
      data: { x: this.sprite.x, y: this.sprite.y },
    });
  }

  public addScore(points: number): void {
    this.networkPlayer.score += points;
    multiplayerClient.updatePlayerState({ score: this.networkPlayer.score });

    // Send score event
    multiplayerClient.sendGameEvent({
      type: 'coin_pickup',
      playerId: this.networkPlayer.id,
      data: { points, totalScore: this.networkPlayer.score },
    });
  }

  public heal(amount: number): void {
    this.networkPlayer.health = Math.min(100, this.networkPlayer.health + amount);
    multiplayerClient.updatePlayerState({ health: this.networkPlayer.health });
  }

  public onHitByEnemy(scene: any, dps: number): void {
    if (!this.isLocal) return; // Only local player can be hit
    
    // Update network player health
    this.networkPlayer.health = Math.max(0, this.networkPlayer.health - dps);
    
    // Play hurt animation
    this.sprite.anims.play(`hurt-${this.networkPlayer.id}`, true);
    
    // If dead, handle death
    if (this.networkPlayer.health <= 0) {
      this.sprite.anims.play(`death-${this.networkPlayer.id}`, true);
      // TODO: Handle multiplayer death logic (respawn, game over, etc.)
    }
    
    // Send health update to server
    multiplayerClient.updatePlayerState({ health: this.networkPlayer.health });
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
