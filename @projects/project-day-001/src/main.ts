import * as THREE from "three";
import { ThreeUtils } from "./libs/ThreeUtils";

export class Game {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private humanMesh: THREE.Mesh;

    public init(element: HTMLElement) {
        // シーンを初期化
        this.scene = new THREE.Scene();

        // 地面メッシュを初期化
        {
            const geometry = new THREE.PlaneGeometry(30, 30);
            const material = new THREE.MeshLambertMaterial({ color: 0xfffcf5 });
            const groundMesh = new THREE.Mesh(geometry, material);
            groundMesh.rotateX((Math.PI / 180) * -90);
            groundMesh.receiveShadow = true; // 影を受け付ける

            // シーンに追加
            this.scene.add(groundMesh);
        }

        // 人メッシュを初期化
        {
            const geometry = new THREE.Geometry();
            geometry.merge(
                new THREE.SphereGeometry(0.4, 32, 32),
                ThreeUtils.position(0, 0.8, 0)
            );
            geometry.merge(new THREE.ConeGeometry(0.5, 2, 20));

            const material = new THREE.MeshLambertMaterial({ color: 0xa2c26b });
            this.humanMesh = new THREE.Mesh(geometry, material);
            this.humanMesh.position.set(0, 1, 0);
            this.humanMesh.castShadow = true; // 影を落とす

            // シーンに追加
            this.scene.add(this.humanMesh);
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
        this.camera = new THREE.PerspectiveCamera(
            50,
            element.clientWidth / element.clientHeight,
            0.01,
            1000
        );

        // レンダラーの初期化
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(element.clientWidth, element.clientHeight);
        this.renderer.setClearColor(0xfffcf5); // 背景色
        this.renderer.shadowMap.enabled = true; // レンダラー：シャドウを有効にする

        // DOM に追加
        element.appendChild(this.renderer.domElement);
    }

    public animate() {
        requestAnimationFrame(() => this.animate());

        // this.humanMesh.rotation.x += 0.01;
        // this.humanMesh.rotation.y += 0.005;

        // カメラの位置と向きを設定
        this.camera.position.set(5, 10, 5);
        this.camera.lookAt(this.scene.position);

        // 描画する
        this.renderer.render(this.scene, this.camera);
    }
}

const appElement = document.querySelector<HTMLElement>(`#myApp`);

const game = new Game();
game.init(appElement);
game.animate();
