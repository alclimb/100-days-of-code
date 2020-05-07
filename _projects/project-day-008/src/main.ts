import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect";
import { MeshText2D, textAlign } from "three-text2d";

interface Obj {
    update: (delta: number) => void;
}

export class Game {
    /** THREE: カメラ */
    private camera: THREE.PerspectiveCamera;

    /** THREE: シーン */
    private scene: THREE.Scene;

    /** THREE: レンダラー */
    private renderer: THREE.WebGLRenderer;

    /** THREE: 操作コントローラー */
    private orbitControls: OrbitControls;

    /** THREE: Asciiエフェクト */
    private asciiEffect: AsciiEffect;

    /** objリスト */
    private objs: Obj[] = [];

    public constructor(element: HTMLElement) {
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        // シーンを初期化
        this.scene = new THREE.Scene();

        // 3Dテキストを追加
        {
            const text = new MeshText2D(`#100DaysOfCode\nDAY 8`, {
                align: textAlign.bottom,
                font: '30px Arial',
                fillStyle: '#ffffff',
                antialias: true,
                shadowBlur: 3,
                shadowOffsetX: 2,
                shadowOffsetY: 2
            });
            text.position.set(0.0, 0.0, 0.0);
            text.scale.set(0.01, 0.01, 0.01);
            this.scene.add(text);
        }

        // カメラを初期化
        {
            this.camera = new THREE.PerspectiveCamera(
                50,
                width / height,
                0.01,
                1000
            );
            this.camera.position.set(1, 1, 1);
            this.camera.lookAt(this.scene.position);
        }

        // レンダラーの初期化
        {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setClearColor(0x000000); // 背景色
        }

        // エフェクト設定
        {
            const charSet = ` abcdefghijklmnopqrstuvwxyz`;
            this.asciiEffect = new AsciiEffect(this.renderer, charSet, { invert: true, scale: 1.0 });
            this.asciiEffect.setSize(width, height);
            this.asciiEffect.domElement.style.color = `white`;
            this.asciiEffect.domElement.style.backgroundColor = `black`;
        }

        // カメラコントローラー設定
        {
            this.orbitControls = new OrbitControls(
                this.camera,
                this.asciiEffect.domElement
            );
            this.orbitControls.maxPolarAngle = Math.PI * 0.5;
            this.orbitControls.minDistance = 1;
            this.orbitControls.maxDistance = 100;
            this.orbitControls.autoRotate = true; // カメラの自動回転設定
            this.orbitControls.autoRotateSpeed = 8.0; // カメラの自動回転速度
        }

        // Windowサイズ変更イベントハンドラ
        const onWindowResize = () => {
            const width = element.offsetWidth;
            const height = element.offsetHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
            this.asciiEffect.setSize(width, height);
        }

        // DOMに追加
        element.appendChild(this.asciiEffect.domElement);

        // DOMイベントの登録
        window.addEventListener(`resize`, onWindowResize, false);
    }

    public animate() {
        let lastTime = 0;

        // アニメーションループを開始
        this.renderer.setAnimationLoop((time: number) => {
            // deltaを算出
            const delta = (time - lastTime) / 1000;

            // objの更新
            this.objs.forEach(obj => {
                obj.update(delta);
            });

            // カメラコントローラーを更新
            this.orbitControls.update();

            // 描画する
            this.asciiEffect.render(this.scene, this.camera);

            lastTime = time;
        });
    }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

const game = new Game(appElement);
game.animate();
