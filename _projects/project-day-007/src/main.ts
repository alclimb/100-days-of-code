import * as THREE from "three";
import { TubePainter } from "three/examples/jsm/misc/TubePainter";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

// TubePainter クラスの型情報が足りないので付け足し拡張
declare module "three/examples/jsm/misc/TubePainter" {
    interface TubePainter {
        setSize(size: number): void;
        moveTo(pos: THREE.Vector3): void;
        lineTo(pos: THREE.Vector3): void;
        update(): void;
    }
}

export class Game {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private controller: THREE.Group;
    private tubePainter: TubePainter;

    public constructor(element: HTMLElement) {
        // シーンのセットアップ
        this.scene = new THREE.Scene();

        // 空間お絵描き機能のセットアップ
        {
            this.tubePainter = new TubePainter();
            this.tubePainter.setSize(0.4);
            (this.tubePainter.mesh.material as THREE.Material).side = THREE.DoubleSide;

            // シーンに追加
            this.scene.add(this.tubePainter.mesh);
        }

        // 座標軸のセットアップ
        {
            const axes = new THREE.AxesHelper(25);

            // シーンに追加
            this.scene.add(axes);
        }

        // 光源のセットアップ
        {
            const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
            light.position.set(0, 1, 0);

            // シーンに追加
            this.scene.add(light);
        }

        // カメラのセットアップ
        {
            this.camera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.01,
                1000
            );
            this.camera.position.set(2, 2, 2);
            this.camera.lookAt(this.scene.position);
        }

        // レンダラーのセットアップ
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;

        // 
        // MEMO: 背景色を指定すると、うまく動作しないよ
        // 
        // this.renderer.setClearColor(0x707070); // 背景色

        // コントローラーのセットアップ
        {
            this.controller = this.renderer.xr.getController(0);
            this.controller.addEventListener(`selectstart`, () => {
                this.controller.userData.isSelecting = true;
                this.controller.userData.skipFrames = 2;
            });
            this.controller.addEventListener(`selectend`, () => {
                this.controller.userData.isSelecting = false;
            });
            this.controller.userData.skipFrames = 0;

            // シーンに追加
            this.scene.add(this.controller);
        }

        // DOM に追加
        window.addEventListener(`resize`, () => this.onWindowResize(), false);
        element.appendChild(this.renderer.domElement);
        element.appendChild(ARButton.createButton(this.renderer));
    }

    public onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public handleController() {
        // 描画位置をカメラ視点より奥の位置に指定
        const pos = new THREE.Vector3(0, 0, -0.2)
            .applyMatrix4(this.controller.matrixWorld);

        if (this.controller.userData.isSelecting === true) {
            if (0 <= this.controller.userData.skipFrames) {
                this.controller.userData.skipFrames--;
                this.tubePainter.moveTo(pos);
            }
            else {
                this.tubePainter.lineTo(pos);
                this.tubePainter.update();
            }
        }
    }

    public animate() {
        const render = () => {
            this.handleController();
            this.renderer.render(this.scene, this.camera);
        }

        this.renderer.setAnimationLoop(render);
    }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

const game = new Game(appElement);
game.animate();
