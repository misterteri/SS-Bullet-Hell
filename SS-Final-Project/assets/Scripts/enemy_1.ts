const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {
  @property({ type: cc.Prefab })
  private enemyPrefab: cc.Prefab = null;

  @property({ type: cc.Prefab })
  private bulletPrefab: cc.Prefab = null;

  @property({ type: cc.Node })
  private playerNode: cc.Node = null;

  private enemyPool: cc.NodePool = null;
  private isAlive: boolean = false;
  private speed: number = 200;
  private shootInterval: number = 1.5;
  private respawnScheduler: number = null;
  private shootScheduler: number = null;
  private moveScheduler: number = null;
  private previousPlayerPosition: cc.Vec3 = null;
  private shootScheduleIdCounter: number = 0;
  private enemyHP: number = 9; // Add enemy HP property

  onLoad() {

    // cc.director.getPhysicsManager().enabled = true;
    // cc.director.getCollisionManager().enabled = true;
    this.isAlive = false;
    this.speed = 500; // Adjust the speed of the enemy's movement
    this.shootInterval = 1; // Adjust the time interval between shots

    this.enemyPool = new cc.NodePool();
    const initialEnemyCount = 10;
    for (let i = 0; i < initialEnemyCount; i++) {
      const enemy = cc.instantiate(this.enemyPrefab);
      this.enemyPool.put(enemy);
    }
  }

  start() {
    this.init();
  }

  init(): void {
    this.setInitialPosition();
    this.spawn();
    this.showPlayer();
  }

  private setInitialPosition(): void {
    // Set the initial position of the enemy
    const posX = 0; // Adjust the X position according to your game's requirements
    const posY = 0; // Adjust the Y position according to your game's requirements

    this.node.setPosition(cc.v2(posX, posY));
  }

  private showPlayer(): void {
    if (this.playerNode && !this.playerNode.parent) {
      // Save the previous player position
      if (!this.previousPlayerPosition) {
        this.previousPlayerPosition = this.playerNode.position;
      }

      // Set the position of the player node
      const playerPosition = cc.v2(597.646, 36.343); // Adjust the player's position
      this.playerNode.setPosition(playerPosition);

      // Add the player node to the parent node or appropriate container
      this.node.parent.addChild(this.playerNode);
    } else {
      console.log("Player node not assigned or already added!");
      this.previousPlayerPosition = this.playerNode.position;
    }
  }

  spawn(): void {
    this.isAlive = true;
    let enemyCount = 1;
    let delay = 1;
    let totalSpawned = 0;
    const maxEnemies = 10;

    const spawnEnemy = () => {
      this.scheduleOnce(() => {
        if (totalSpawned < maxEnemies) {
          this.spawnMultiple(enemyCount); // Spawn 'enemyCount' enemies
          enemyCount++;
          totalSpawned++;
          // console.log(enemyCount - 1);
        } else {
          this.spawnMultiple(enemyCount);
        }
        delay = 5;
        spawnEnemy();
      }, delay);
    };

    spawnEnemy();
  }

  spawnMultiple(count: number): void {
    const minSpacing = 50; // Minimum spacing between enemies
    const maxSpacing = 510; // Maximum spacing between enemies

    const minSpacingX = 600; // Minimum spacing between enemies
    const maxSpacingX = 900; // Maximum spacing between enemies

    for (let i = 0; i < count; i++) {
      const spacing = Math.random() * (maxSpacing - minSpacing) + minSpacing;
      const spacingX =
        Math.random() * (maxSpacingX - minSpacingX) + minSpacingX;

      let enemy: cc.Node = null;
      if (this.enemyPool.size() > 0) {
        enemy = this.enemyPool.get();
        enemy.setPosition(cc.v2(spacingX, spacing));
        this.scheduleShoot(enemy);
      } else {
        enemy = cc.instantiate(this.enemyPrefab);
        enemy.setPosition(cc.v2(spacingX, spacing));
        this.scheduleShoot(enemy);
      }

      this.node.addChild(enemy);
      this.moveEnemy(enemy);
      // this.scheduleShoot(enemy);
    }
  }

  moveEnemy(enemy: cc.Node): void {
    // Delay before moving enemy to the left
    const delayAction = cc.delayTime(1); // Adjust the delay duration

    var time = Math.random() * (10 - 4) + 4   
    // Move enemy horizontally to the left
    const moveAction = cc.moveBy(time, cc.v2(-1000, 0)); // Adjust the duration and distance

    const destroyAction = cc.callFunc(() => {
      if (enemy.position.x <= -50) {
        enemy.removeFromParent();
        this.enemyPool.put(enemy);
        // enemy.destroy();
      }
    });

    const sequence = cc.sequence(delayAction, moveAction, destroyAction);
    enemy.runAction(sequence);
  }

  scheduleShoot(enemy): void {
    // Schedule bullet shooting with a delay equal to shootInterval
    this.shootScheduler = ++this.shootScheduleIdCounter;
    cc.director
      .getScheduler()
      .schedule(
        () => {
          this.shootTowardsLeft(enemy);
        },
        this,
        this.shootInterval,
        0,
        //cc.macro.REPEAT_FOREVER,
        0,
        false
      );
  }

  // shootTowardsLeft(enemy): void {
  //   const bullet = cc.instantiate(this.bulletPrefab);
  //   bullet.setPosition(cc.v2(enemy.position.x, enemy.position.y));

  //   // Add collision component to the bullet node
  //   // const collider = bullet.addComponent(cc.BoxCollider);
  //   // collider.size = bullet.getContentSize();

  //   // Set collision handler function
  //   // collider.on("collision-enter", this.handleCollision, this);

  //   const bulletSpeed = 500;
  //   const bulletEndPosition = cc.v2(-100, bullet.position.y);
  //   const bulletEndPosition2 = cc.v3(-100, bullet.position.y);

  //   const distance = bullet.position.sub(bulletEndPosition2).mag();
  //   const duration = distance / bulletSpeed;
  //   const moveAction = cc.moveTo(duration, bulletEndPosition);
  //   const removeAction = cc.removeSelf(true);

  //   bullet.runAction(cc.sequence(moveAction, removeAction));

  //   this.node.parent.addChild(bullet);
  // }

  shootTowardsLeft(enemy): void {
    if (enemy && enemy.isValid) {
      const bullet = cc.instantiate(this.bulletPrefab);
      bullet.setPosition(cc.v2(enemy.position.x, enemy.position.y));
  
      const bulletSpeed = 500;
      const bulletEndPosition = cc.v2(-100, bullet.position.y);
      const bulletEndPosition2 = cc.v3(-100, bullet.position.y);
  
      const distance = bullet.position.sub(bulletEndPosition2).mag();
      const duration = distance / bulletSpeed;
      const moveAction = cc.moveTo(duration, bulletEndPosition);
      const removeAction = cc.removeSelf(true);
  
      bullet.runAction(cc.sequence(moveAction, removeAction));
  
      this.node.parent.addChild(bullet);
    } else {
      console.log('Invalid enemy node');
    }
  }
  



}
