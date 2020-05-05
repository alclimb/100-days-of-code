import { Matrix4 } from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export module ThreeUtils {
    export function position(x: number, y: number, z: number) {
        const matrix = new Matrix4();
        matrix.setPosition(x, y, z);
        return matrix;
    }

    export function load(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF> {
        return new Promise((resolve, reject) => {
            new GLTFLoader().load(url, resolve, onProgress, reject);
        });
    }
}
