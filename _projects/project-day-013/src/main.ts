import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshText2D, textAlign } from "three-text2d";

export class Application {
    /** THREE: カメラ */
    private camera: THREE.PerspectiveCamera;

    /** THREE: シーン */
    private scene: THREE.Scene;

    /** THREE: レンダラー */
    private renderer: THREE.WebGLRenderer;

    /** THREE: 操作コントローラー */
    private orbitControls: OrbitControls;

    /** THREE: テキストMesh */
    private titleTextMesh: MeshText2D;

    /** THREE: 点情報 */
    private points: THREE.Points;

    public constructor(element: HTMLElement) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        // シーンを初期化
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

        // レンダラーの初期化
        {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.shadowMap.enabled = true; // レンダラー：シャドウを有効にする
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

        // カメラコントローラー設定
        {
            this.orbitControls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            this.orbitControls.target = new THREE.Vector3(0, 0, 0);
            this.orbitControls.maxPolarAngle = Math.PI * 0.5;
            this.orbitControls.minDistance = 1;
            this.orbitControls.maxDistance = 5000;
            this.orbitControls.autoRotate = false; // カメラの自動回転設定
            this.orbitControls.autoRotateSpeed = 1.0; // カメラの自動回転速度
        }

        // 3Dテキストを追加
        {
            this.titleTextMesh = new MeshText2D(`100 DAYS OF CODE\nDAY 13`, {
                align: textAlign.bottom,
                font: `120px Arial`,
                antialias: true,
                shadowColor: `#909090`,
                shadowBlur: 4,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                lineHeight: 1.0,
            });
            this.titleTextMesh.position.set(0, 0, 0);
            this.titleTextMesh.scale.set(0.007, 0.007, 0.007);
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

            const material = new THREE.PointsMaterial({ size: 5, vertexColors: true });

            this.points = new THREE.Points(geometry, material);

            // シーンに追加
            this.scene.add(this.points);
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

        // DOMイベントの登録
        window.addEventListener(`resize`, onWindowResize, false);
    }

    public animate() {
        let lastTime = 0;

        // アニメーションループを開始
        this.renderer.setAnimationLoop((time: number) => {
            // deltaを算出
            const delta = (time - lastTime) / 1000;

            // カメラコントローラーを更新
            this.orbitControls.update();

            this.points.rotation.x = time * 0.001 * 0.25;
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
