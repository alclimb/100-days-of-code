import * as THREE from "three";
import { TubePainter } from "three/examples/jsm/misc/TubePainter";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { MeshText2D, textAlign } from "three-text2d";

// TubePainter クラスの型情報が足りないので付け足し拡張
declare module "three/examples/jsm/misc/TubePainter" {
    interface TubePainter {
        setSize(size: number): void;
        moveTo(pos: THREE.Vector3): void;
        lineTo(pos: THREE.Vector3): void;
        update(): void;
    }
}

export class Application {
    /** THREE: カメラ */
    private camera: THREE.PerspectiveCamera;

    /** THREE: シーン */
    private scene: THREE.Scene;

    /** THREE: レンダラー */
    private renderer: THREE.WebGLRenderer;

    /** THREE: コントローラー */
    private controller: THREE.Group;

    /** THREE: テキストMesh */
    private titleTextMesh: MeshText2D;

    /** THREE: 点情報 */
    private points: THREE.Points;

    /** THREE: 空間お絵描き用 */
    private tubePainter: TubePainter;

    public constructor(element: HTMLElement) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        // シーンを初期化
        this.scene = new THREE.Scene();
        //this.scene.background = new THREE.Color(0x050505);
        //this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

        // レンダラーの初期化
        {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.xr.enabled = true;
        }

        // カメラを初期化
        {
            this.camera = new THREE.PerspectiveCamera(
                27,
                width / height,
                0.01,
                3500
            );
            this.camera.position.set(0, 0, 50);
            this.camera.lookAt(this.scene.position);
        }

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

        // 3Dテキストを追加
        {
            this.titleTextMesh = new MeshText2D(`100 DAYS OF CODE\nDAY 14`, {
                align: textAlign.bottom,
                font: `120px Arial`,
                antialias: true,
                shadowColor: `#909090`,
                shadowBlur: 4,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                lineHeight: 1.0,
            });
            this.titleTextMesh.position.set(0, 0, -1);
            this.titleTextMesh.scale.set(0.0007, 0.0007, 0.0007);
            this.titleTextMesh.castShadow = true;

            // シーンに追加
            this.scene.add(this.titleTextMesh);
        }

        // 点群を追加
        {
            const PARTICLES = 500000;
            const N1 = 1000;
            const N2 = N1 / 2;

            const positions: number[] = [];
            const colors: number[] = [];

            for (let i = 0; i < PARTICLES; i++) {
                const pos = {
                    x: Math.random() * N1 - N2,
                    y: Math.random() * N1 - N2,
                    z: Math.random() * N1 - N2,
                };

                // positions
                positions.push(pos.x, pos.y, pos.z);

                // colors
                colors.push(
                    (pos.x / N1) + 0.5,
                    (pos.y / N1) + 0.5,
                    (pos.z / N1) + 0.5,
                );
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(`position`, new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute(`color`, new THREE.Float32BufferAttribute(colors, 3));
            geometry.computeBoundingSphere();

            //

            const material = new THREE.PointsMaterial({ size: 3, vertexColors: true });

            this.points = new THREE.Points(geometry, material);

            // シーンに追加
            this.scene.add(this.points);
        }

        // 空間お絵描き機能のセットアップ
        {
            this.tubePainter = new TubePainter();
            this.tubePainter.setSize(0.4);
            (this.tubePainter.mesh.material as THREE.Material).side = THREE.DoubleSide;

            // シーンに追加
            this.scene.add(this.tubePainter.mesh);
        }

        // Windowサイズ変更イベントハンドラ
        const onWindowResize = () => {
            const width = element.offsetWidth;
            const height = element.offsetHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
        }

        // DOMに追加
        element.appendChild(this.renderer.domElement);
        element.appendChild(ARButton.createButton(this.renderer));

        // DOMイベントの登録
        window.addEventListener(`resize`, onWindowResize, false);
    }

    public animate() {
        let lastTime = 0;

        // アニメーションループを開始
        this.renderer.setAnimationLoop((time: number) => {
            // deltaを算出
            const delta = (time - lastTime) / 1000;

            // コントローラーを更新
            if (this.controller.userData.isSelecting === true) {
                // 描画位置をカメラ視点より奥の位置に指定
                const pos = new THREE.Vector3(0, 0, -0.2)
                    .applyMatrix4(this.controller.matrixWorld);

                if (0 <= this.controller.userData.skipFrames) {
                    this.controller.userData.skipFrames--;
                    this.tubePainter.moveTo(pos);
                }
                else {
                    this.tubePainter.lineTo(pos);
                    this.tubePainter.update();
                }
            }

            //this.points.rotation.x = time * 0.001 * 0.25;
            this.points.rotation.y = time * 0.001 * 0.5;

            // 描画する
            this.renderer.render(this.scene, this.camera);

            lastTime = time;
        });
    }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

const app = new Application(appElement);
app.animate();
