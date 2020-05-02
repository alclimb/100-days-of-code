import { Matrix4 } from "three";

export module ThreeUtils {
    export function position(x: number, y: number, z: number) {
        const matrix = new Matrix4();
        matrix.setPosition(x, y, z);
        return matrix;
    }
}
