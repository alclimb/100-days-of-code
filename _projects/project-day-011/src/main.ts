import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshText2D, textAlign } from "three-text2d";
import * as chroma from "chroma-js";

const config = {
    floor: {
        color: chroma.rgb(217, 191, 113),
    },
    ball: {
        color: chroma.hex(`#FFFFFF`),
    },
};

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

    /** THREE: ボーン実験用のMesh */
    private armMesh: THREE.Mesh;

    private skeletonHelper: THREE.SkeletonHelper;

    public constructor(element: HTMLElement) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        // シーンを初期化
        this.scene = new THREE.Scene();

        // カメラを初期化
        {
            this.camera = new THREE.PerspectiveCamera(
                50,
                width / height,
                0.01,
                1000
            );
            this.camera.position.set(0, 5, 15);
            this.camera.lookAt(this.scene.position);
        }

        // レンダラーの初期化
        {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.shadowMap.enabled = true; // レンダラー：シャドウを有効にする
            // this.renderer.toneMapping = THREE.ReinhardToneMapping;
            // this.renderer.toneMappingExposure = Math.pow(1.0, 4.0);
        }

        // カメラコントローラー設定
        {
            this.orbitControls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            this.orbitControls.target = new THREE.Vector3(0, 5, 0);
            this.orbitControls.maxPolarAngle = Math.PI * 0.5;
            this.orbitControls.minDistance = 1;
            this.orbitControls.maxDistance = 100;
            this.orbitControls.autoRotate = false; // カメラの自動回転設定
            this.orbitControls.autoRotateSpeed = 1.0; // カメラの自動回転速度
        }

        // ライト：環境光
        {
            const ambientLight = new THREE.AmbientLight(0xffffff);
            ambientLight.intensity = 0.4;

            // シーンに追加
            this.scene.add(ambientLight);
        }

        // ライト：点光源
        {
            const light = new THREE.PointLight(0xFFFFFF);
            light.position.set(-3.4, 20, 5.2);
            light.castShadow = true; // ライトの影を有効
            light.intensity = 0.60;
            light.shadow.radius = 4;
            light.decay = 1;

            // シーンに追加
            this.scene.add(light);
        }

        // フロア
        {
            const geometry = new THREE.BoxGeometry(40.0, 40.0, 40.0);
            const material = new THREE.MeshStandardMaterial({ color: config.floor.color.hex(), roughness: 0.42, side: THREE.BackSide });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 20, 0);
            mesh.receiveShadow = true; // 影を受け付ける

            // シーンに追加
            this.scene.add(mesh);
        }

        // ボール
        {
            const geometry = new THREE.SphereGeometry(1, 30, 30);
            const material = new THREE.MeshStandardMaterial({ color: config.ball.color.hex(), roughness: 1.0 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(5, 1, -5);
            mesh.castShadow = true; // 影を有効

            // シーンに追加
            this.scene.add(mesh);
        }

        {
            const geometry = new THREE.CylinderGeometry(4, 4, 40, 3, 4, true);

            // 骨格を設定
            geometry.bones = [
                {
                    name: "bone0",
                    parent: -1,
                    pos: [0, -20, 0],
                    rotq: [0, 0, 0, 1],
                    scl: [1, 1, 1],
                },
                {
                    name: "bone1",
                    parent: 0,
                    pos: [0, 10, 0],
                    rotq: [0, 0, 0, 1],
                    scl: [1, 1, 1],
                },
                {
                    name: "bone2",
                    parent: 1,
                    pos: [0, 10, 0],
                    rotq: [0, 0, 0, 1],
                    scl: [1, 1, 1],
                },
                {
                    name: "bone3",
                    parent: 2,
                    pos: [0, 10, 0],
                    rotq: [0, 0, 0, 1],
                    scl: [1, 1, 1],
                },
                {
                    name: "bone4",
                    parent: 3,
                    pos: [0, 10, 0],
                    rotq: [0, 0, 0, 1],
                    scl: [1, 1, 1],
                },
            ];

            geometry.skinIndices = [
                new THREE.Vector4(4, 3, -1, -1), new THREE.Vector4(4, 3, -1, -1), new THREE.Vector4(4, 3, -1, -1),
                new THREE.Vector4(3, 4, 2, -1), new THREE.Vector4(3, 4, 2, -1), new THREE.Vector4(3, 4, 2, -1),
                new THREE.Vector4(2, 3, 1, -1), new THREE.Vector4(2, 3, 1, -1), new THREE.Vector4(2, 3, 1, -1),
                new THREE.Vector4(1, 2, 0, -1), new THREE.Vector4(1, 2, 0, -1), new THREE.Vector4(1, 2, 0, -1),
                new THREE.Vector4(0, 1, -1, -1), new THREE.Vector4(0, 1, -1, -1), new THREE.Vector4(0, 1, -1, -1),
            ];

            geometry.skinWeights = [
                new THREE.Vector4(.8, .2, 0, 0), new THREE.Vector4(.8, .2, 0, 0), new THREE.Vector4(.8, .2, 0, 0),
                new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0),
                new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0),
                new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0), new THREE.Vector4(.6, .2, .2, 0),
                new THREE.Vector4(.8, .2, 0, 0), new THREE.Vector4(.8, .2, 0, 0), new THREE.Vector4(.8, .2, 0, 0),
            ];

            const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, wireframe: true, skinning: true });
            this.armMesh = new THREE.Mesh(geometry, material);
            this.armMesh.position.set(0, 5, 0);
            this.armMesh.scale.set(0.25, 0.25, 0.25);
            this.armMesh.castShadow = true; // 影を有効

            this.skeletonHelper = new THREE.SkeletonHelper(this.armMesh);

            // シーンに追加
            this.scene.add(this.armMesh, this.skeletonHelper);
        }

        // 3Dテキストを追加
        {
            this.titleTextMesh = new MeshText2D(`100 DAYS OF CODE\nDAY 11`, {
                align: textAlign.bottom,
                font: `120px Arial`,
                antialias: true,
                shadowColor: `#909090`,
                shadowBlur: 4,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                lineHeight: 1.0,
            });
            this.titleTextMesh.position.set(-3, 10, -5);
            this.titleTextMesh.scale.set(0.007, 0.007, 0.007);
            this.titleTextMesh.castShadow = true;

            // シーンに追加
            this.scene.add(this.titleTextMesh);
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
        // アニメーションループを開始
        this.renderer.setAnimationLoop((time: number) => {
            // カメラコントローラーを更新
            this.orbitControls.update();

            // this.armMesh.skeleton.bones[1].rotation.z = Math.sin(time * 0.001) * .5;
            // this.armMesh.skeleton.bones[2].rotation.y = Math.sin(time * 0.002) * 1;
            // this.armMesh.skeleton.bones[3].rotation.x = Math.sin(time * 0.003) * .5;

            // this.skeletonHelper.update();

            // 描画する
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

const app = new Application(appElement);
app.animate();
