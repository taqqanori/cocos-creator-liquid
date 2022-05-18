import {
  _decorator,
  Component,
  PhysicsSystem2D,
  Sprite,
  SpriteFrame,
  Node,
  math,
} from "cc";
const { ccclass, property } = _decorator;

// followings and import-map.json are very dirty hack to refer hidden types such as b2ParticleSystem.
import * as ccb2 from "@cocos/box2d/src/box2d";
// @ts-ignore
ccb2 = ccb2.default;

/**
 * Predefined variables
 * Name = Liquid
 * DateTime = Mon May 16 2022 14:45:21 GMT+0900 (日本標準時)
 * Author = taqanori
 * FileBasename = Liquid.ts
 * FileBasenameNoExtension = Liquid
 * URL = db://assets/Liquid.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass("Liquid")
export class Liquid extends Component {
  particleSystem: ccb2.b2ParticleSystem;
  particleGroup: ccb2.b2ParticleGroup;

  @property(SpriteFrame)
  particleSpriteFrame: SpriteFrame;

  start() {
    const world = PhysicsSystem2D.instance.physicsWorld.impl as ccb2.b2World;
    const particleSystemDef = new ccb2.b2ParticleSystemDef();
    particleSystemDef.destroyByAge = false;
    this.particleSystem = world.CreateParticleSystem(particleSystemDef);
    const groupDef = new ccb2.b2ParticleGroupDef();
    const shape = new ccb2.b2PolygonShape();
    shape.SetAsBox(100, 100);
    groupDef.shape = shape;
    // groupDef.color.Set(100, 150, 255, 255);
    groupDef.flags = ccb2.b2ParticleFlag.b2_waterParticle;
    groupDef.position.Set(100, 100);
    this.particleGroup = this.particleSystem.CreateParticleGroup(groupDef);

    this.forEachParticle((i) => {
      const node = new Node();
      const s = node.addComponent(Sprite);
      s.spriteFrame = this.particleSpriteFrame;
      this.node.addChild(node);
      this.particleSystem.GetUserDataBuffer()[i] = node;
    });

    console.log(world);
    const stack = world.m_contactManager.m_broadPhase.m_tree.m_stack;
    const origPop = stack.Pop;
    stack.Pop = () => {
      try {
        origPop.bind(stack)();
      } catch (e) {
        return null;
      }
    };
  }

  update(deltaTime: number) {
    this.forEachParticle((i) => {
      const node: Node = this.particleSystem.GetUserDataBuffer<Node>()[i];
      const position = this.particleSystem.GetPositionBuffer()[i];
      node.worldPosition = new math.Vec3(position.x, position.y, 0);
    });
  }

  private forEachParticle(f: (number) => void): void {
    if (!this.particleGroup) {
      return;
    }
    for (
      let i = this.particleGroup.GetBufferIndex();
      i < this.particleGroup.GetParticleCount();
      i++
    ) {
      f(i);
    }
  }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.4/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.4/manual/en/scripting/decorator.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.4/manual/en/scripting/life-cycle-callbacks.html
 */
