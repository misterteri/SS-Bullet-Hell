const { ccclass, property } = cc._decorator;

function randomRangeInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@ccclass
export default class EnemyShooter1 extends cc.Component {
  @property({ type: cc.Prefab })
  private bulletPrefab: cc.Prefab = null;

  private enemyHP: number = 8; // HP property for the enemy

  private enemyShootInterval: number = 1.5;
  private minBulletCount: number = 1; // Minimum number of bullets to shoot
  private maxBulletCount: number = 3; // Maximum number of bullets to shoot
  private stageManager:any = null;

  onLoad() {
    this.scheduleShoot();
    this.stageManager = cc.find("StageManager").getComponent("StageManager")
  }

  scheduleShoot(): void {
    this.schedule(() => {
      this.shoot();
    }, this.enemyShootInterval);
  }

  bullet = null
  
  shoot(): void {
    const bulletCount = randomRangeInt(this.minBulletCount, this.maxBulletCount);
    
    for (let i = 0; i < bulletCount; i++) {
      if(this.stageManager.bulletPool.size() > 0){
        this.bullet = this.stageManager.bulletPool.get();
        //console.log(this.stageManager.bulletPool.size())
      }
      else{
        this.bullet = cc.instantiate(this.bulletPrefab);
        //console.log("new")
      }
      this.bullet.setPosition(this.node.position);

      const bulletSpeed = 1000;

      // Generate a random direction for the bullet
      const angle = Math.random() * Math.PI * 2;
      const bulletDirection = cc.v2(Math.cos(angle), Math.sin(angle));

      // Calculate the end position of the bullet based on its direction and speed
      const bulletEndPosition = bulletDirection.mul(bulletSpeed);
      const bulletEndPosition2 = cc.v3(-1000, this.bullet.position.y);

      const distance = this.bullet.position.sub(bulletEndPosition2).mag();
      const duration = (distance + 500) / 500;
      const moveAction = cc.moveTo(duration, bulletEndPosition);
      const removeAction = cc.callFunc(() => {
        //this.node.parent.removeChild(bullet);
        this.stageManager.bulletPool.put(this.bullet);
        // this.bullet.destroy()
      });

      this.bullet.runAction(cc.sequence(moveAction, removeAction));

      const angleRadians = Math.atan2(bulletDirection.y, bulletDirection.x);
      const angleDegrees = cc.misc.radiansToDegrees(angleRadians);

      this.bullet.angle = -angleDegrees; // Reverse the angle for proper rotation

      this.node.parent.addChild(this.bullet);
    }
  }

  first = false;
  onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider): void {
    const otherGroup = otherCollider.node.group;
    if (otherGroup === 'B_player' && !this.first) {
      this.first = true
      // Decrease enemy HP when collided with the player
      var attack = 0;
      attack = otherCollider.getComponent("Bullet").attack;
      this.enemyHP -= attack;
      this.scheduleOnce(function () {
        this.first = false
      }, 0.05)
      //if (this.enemyHP > 0 || this.enemyHP < 29) {console.log(this.enemyHP);}
      if (this.enemyHP <= 0) {
        this.scheduleOnce(function () {
          this.enemyHP = 8
        }, 0.1)
        // Destroy the enemy when HP reaches 0 or below
        var spawner = cc.find("New Node")
        spawner.getComponent("enemy_1").pooling(this.node, this.enemyHP, 8)
        //this.node.destroy();
        //console.log('Enemy destroyed');
        this.stageManager.score += 500;
        var rand = Math.random()
        if(rand < 0.1){
          console.log("powerup")
          this.stageManager.giveItem()
        }
      }
    }
  }
}
