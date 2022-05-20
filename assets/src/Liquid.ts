import {
  _decorator,
  Component,
  PhysicsSystem2D,
  Sprite,
  SpriteFrame,
  Node,
  math,
  UITransformComponent,
  PHYSICS_2D_PTM_RATIO,
} from "cc";
const { ccclass, property } = _decorator;

// followings and import-map.json are very dirty hack to refer hidden types such as b2ParticleSystem.
import * as b2 from "@cocos/box2d/src/box2d";
// @ts-ignore
b2 = b2.default;

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
  particleSystem: b2.b2ParticleSystem;
  particleGroup: b2.b2ParticleGroup;

  @property(SpriteFrame)
  particleSpriteFrame: SpriteFrame;
  @property(Number)
  particleRadius: number;

  start() {
    // a hack to avoid strange runtime error raised when there are no RigidBody2D in world.
    this.fixGrowableStack();

    // cast just once for type safety
    const world = PhysicsSystem2D.instance.physicsWorld.impl as b2.b2World;

    // create particle system from definition
    const particleSystemDef = new b2.b2ParticleSystemDef();
    particleSystemDef.radius = this.particleRadius / PHYSICS_2D_PTM_RATIO;
    this.particleSystem = world.CreateParticleSystem(particleSystemDef);

    // create particle group from definition
    const groupDef = new b2.b2ParticleGroupDef();
    const shape = new b2.b2PolygonShape();
    shape.SetAsBox(
      this.uiTransform.width / 2 / PHYSICS_2D_PTM_RATIO,
      this.uiTransform.height / 2 / PHYSICS_2D_PTM_RATIO
    );
    groupDef.shape = shape;
    groupDef.flags = b2.b2ParticleFlag.b2_waterParticle;
    const center = this.uiTransform.convertToWorldSpaceAR(
      new math.Vec3(0, 0, 0)
    );
    groupDef.position.Set(
      center.x / PHYSICS_2D_PTM_RATIO,
      center.y / PHYSICS_2D_PTM_RATIO
    );
    this.particleGroup = this.particleSystem.CreateParticleGroup(groupDef);

    // create sprites for each particles
    this.forEachParticle((i) => {
      const node = new Node();
      node.layer = this.node.layer;
      const s = node.addComponent(Sprite);
      s.spriteFrame = this.particleSpriteFrame;
      this.node.addChild(node);
      this.particleSystem.GetUserDataBuffer()[i] = node;
    });
  }

  update(deltaTime: number) {
    // update particle locations
    this.forEachParticle((i) => {
      const node: Node = this.particleSystem.GetUserDataBuffer<Node>()[i];
      const position = this.particleSystem.GetPositionBuffer()[i];
      node.position = this.uiTransform.convertToNodeSpaceAR(
        new math.Vec3(
          position.x * PHYSICS_2D_PTM_RATIO,
          position.y * PHYSICS_2D_PTM_RATIO
        )
      );
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

  private get uiTransform(): UITransformComponent {
    return this.node.getComponent(UITransformComponent);
  }

  /**
   * Following fix for b2GrowableStack seems very inconsistent with LiquidFun of C++ version for me...
   * https://github.com/cocos-creator/cocos-box2d.ts/commit/8297c387d35a7b8b7548519aa2bfd43496bb1553#diff-aa9edc49bf7ff526226c2357e864c0006ab06b7ec4358a58a7af2f5ed5c1ad2cR50
   *
   * C++ version (allows b2NullNode(-1) in stack)
   * https://github.com/google/liquidfun/blob/master/liquidfun/Box2D/Box2D/Common/b2GrowableStack.h
   * https://github.com/google/liquidfun/blob/7f20402173fd143a3988c921bc384459c6a858f2/liquidfun/Box2D/Box2D/Collision/b2DynamicTree.h#L177
   *
   * cocos version (assumes null in place of b2NullNode in stack at caller side, but raises exception for null at callee side)
   * https://github.com/cocos-creator/cocos-box2d.ts/blob/8c3e947d96833f17e9041341b5ce573606fb6c3e/src/common/b2_growable_stack.ts#L50
   * https://github.com/cocos-creator/cocos-box2d.ts/blob/8c3e947d96833f17e9041341b5ce573606fb6c3e/src/collision/b2_dynamic_tree.ts#L99
   */
  private fixGrowableStack(): void {
    const world = PhysicsSystem2D.instance.physicsWorld.impl as b2.b2World;
    const stack = world?.m_contactManager?.m_broadPhase?.m_tree?.m_stack;
    if (!stack) {
      return;
    }
    const origPop = stack.Pop;
    stack.Pop = () => {
      try {
        return origPop.bind(stack)();
      } catch (e) {
        return null;
      }
    };
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
