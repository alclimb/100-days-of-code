import * as CANNON from "cannon";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import { ThreeUtils } from "./libs/ThreeUtils";

const FIXED_TIME_STEP = 1.0 / 60.0; // seconds
const MAX_SUB_STEPS = 3;

interface Obj {
    body: CANNON.Body;
    mesh: THREE.Mesh;
}

export module GameUtils {
    export function addGround(world: CANNON.World, scene: THREE.Scene, position = new THREE.Vector3(), width = 100, height = 100): Obj {
        let body: CANNON.Body;
        let mesh: THREE.Mesh;

        // cannon.js
        {
            // Create a plan
            body = new CANNON.Body({
                mass: 0, // mass == 0 makes the body static
                position: new CANNON.Vec3(position.x, position.y, position.z), // m
                shape: new CANNON.Plane(),
            });
            // body.torque.x = -0.5;
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), (Math.PI / 180) * -90);

            // 追加
            world.addBody(body);
        }

        // three.js
        {
            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshLambertMaterial({ color: 0x080808 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotateX((Math.PI / 180) * -90);
            mesh.receiveShadow = true; // 影を受け付ける

            // シーンに追加
            scene.add(mesh);
        }

        return { body, mesh };
    }

    export function addHuman(world: CANNON.World, scene: THREE.Scene, position = new THREE.Vector3()): Obj {
        let body: CANNON.Body;
        let mesh: THREE.Mesh;

        // cannon.js
        {
            // Create a sphere
            const size = 0.5; // m
            body = new CANNON.Body({
                mass: 5, // kg
                position: new CANNON.Vec3(position.x, position.y, position.z), // m
                shape: new CANNON.Box(new CANNON.Vec3(size, size, size)),
            });
            world.addBody(body);
        }

        // three.js
        {
            // 形状
            const geometry = new THREE.Geometry();
            geometry.merge(
                new THREE.SphereGeometry(0.4, 32, 32),
                ThreeUtils.position(0, 1.8, 0));
            geometry.merge(
                new THREE.ConeGeometry(0.5, 2, 20),
                ThreeUtils.position(0, 1.0, 0));

            // マテリアル
            const material = new THREE.MeshLambertMaterial({ color: 0xa2c26b });

            // メッシュ情報
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z);
            mesh.castShadow = true; // 影を落とす

            // シーンに追加
            scene.add(mesh);
        }

        return { body, mesh };
    }
}

export class Game {
    private world: CANNON.World;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private orbitControls: OrbitControls;
    private effectComposer: EffectComposer;
    private objs: Obj[] = [];

    private bloomParams = {
        /** トーンマッピング: 露光量 */
        exposure: 1.1,

        /** 発光エフェクト: 強さ */
        bloomStrength: 2.0,

        /** 発光エフェクト: 半径 */
        bloomRadius: 1.0,

        /** 発光エフェクト: 閾値 */
        bloomThreshold: 0.0,
    };

    public constructor(element: HTMLElement) {
        // 物理演算ワールドを初期化
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // m/s²

        // シーンを初期化
        this.scene = new THREE.Scene();

        // 地面objを生成
        this.objs.push(GameUtils.addGround(this.world, this.scene, new THREE.Vector3(0, -2, 0)));

        // 人objを生成
        for (let i = 0; i < 20; i++) {
            this.objs.push(...[
                GameUtils.addHuman(this.world, this.scene, new THREE.Vector3(0, i, 0)),
                GameUtils.addHuman(this.world, this.scene, new THREE.Vector3(0, i + 1, -2)),
                GameUtils.addHuman(this.world, this.scene, new THREE.Vector3(-2, i + 2, 0)),
            ]);
        }

        // ライト：平行光
        {
            const directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(7, 10, -2);
            directionalLight.color.set(0xffffff);
            directionalLight.castShadow = true; // ライトの影を有効
            directionalLight.intensity = 0.3;
            directionalLight.shadow.radius = 3.0;

            // シーンに追加
            this.scene.add(directionalLight);
        }

        // ライト：環境光
        {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);

            // シーンに追加
            this.scene.add(ambientLight);
        }

        // 座標軸を表示
        {
            const axes = new THREE.AxesHelper(25);

            // シーンに追加
            this.scene.add(axes);
        }

        // カメラを初期化
        {
            this.camera = new THREE.PerspectiveCamera(
                50,
                element.clientWidth / element.clientHeight,
                0.01,
                1000
            );
            this.camera.position.set(5, 10, 5);
            this.camera.lookAt(this.scene.position);
        }

        // レンダラーの初期化
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(element.clientWidth, element.clientHeight);
        this.renderer.setClearColor(0x000000); // 背景色
        this.renderer.shadowMap.enabled = true; // レンダラー：シャドウを有効にする
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = Math.pow(this.bloomParams.exposure, 4.0);

        // エフェクト設定
        {
            // 通常レンダリング
            const renderPass = new RenderPass(this.scene, this.camera);

            // 発光エフェクト
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(element.clientWidth, element.clientHeight),
                this.bloomParams.bloomStrength,
                this.bloomParams.bloomRadius,
                this.bloomParams.bloomThreshold,
            );

            this.effectComposer = new EffectComposer(this.renderer);
            this.effectComposer.addPass(renderPass);
            this.effectComposer.addPass(bloomPass);
            this.effectComposer.setSize(element.clientWidth, element.clientHeight);
        }

        // カメラコントローラー設定
        this.orbitControls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.orbitControls.maxPolarAngle = Math.PI * 0.5;
        this.orbitControls.minDistance = 1;
        this.orbitControls.maxDistance = 100;
        this.orbitControls.autoRotate = false; // カメラの自動回転設定
        this.orbitControls.autoRotateSpeed = 1.0; // カメラの自動回転速度

        // DOM に追加
        element.appendChild(this.renderer.domElement);
    }

    private lastTime = 0;

    public animate(time: number = 0) {
        requestAnimationFrame(time => this.animate(time));

        // 物理演算
        {
            if (this.lastTime !== undefined) {
                var dt = (time - this.lastTime) / 1000;
                this.world.step(FIXED_TIME_STEP, dt, MAX_SUB_STEPS);
            }

            this.lastTime = time;
        }

        // 演算結果を表示に更新
        this.objs.forEach(obj => {
            // 位置情報を更新
            obj.mesh.position.set(
                obj.body.position.x,
                obj.body.position.y,
                obj.body.position.z);

            // 向き情報を更新
            obj.mesh.rotation.setFromQuaternion(new THREE.Quaternion(
                obj.body.quaternion.x,
                obj.body.quaternion.y,
                obj.body.quaternion.z,
                obj.body.quaternion.w,
            ));
        });

        // カメラコントローラーを更新
        this.orbitControls.update();

        // 描画する
        this.effectComposer.render(time);
    }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

const game = new Game(appElement);
game.animate();
