import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };

/** Loaded only on the homepage, after hydration, when motion/data preferences allow it. */
export async function createRisingLineScene(host: HTMLElement, signal: AbortSignal, onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.localClippingEnabled = true;
  host.appendChild(renderer.domElement);
  const world = new THREE.Scene();
  const group = new THREE.Group(); world.add(group);
  const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, .1, 100);
  camera.position.set(0, .1, 20); camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  world.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  world.add(new THREE.HemisphereLight(0xe3efff, 0x1b2a34, 2));
  const key = new THREE.DirectionalLight(0xffe2ac, 4); key.position.set(-5, 6, 8); world.add(key);
  const rim = new THREE.DirectionalLight(0xb6ddff, 3); rim.position.set(7, 2, 4); world.add(rim);
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  let disposed = false;
  function contextLost(event: Event) { event.preventDefault(); if (!disposed) onLost(); }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }

  try {
    const response = await fetch("/models/risa-wordmark-v1.glb", { signal });
    if (!response.ok) throw new Error("Logo unavailable");
    const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "");
    if (signal.aborted) {
      gltf.scene.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } });
      throw new DOMException("Aborted", "AbortError");
    }
    gltf.scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const width = bounds.max.x - bounds.min.x;
    const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    const localClip = clip.clone();
    const parts: { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; base: THREE.Vector3; arrow: boolean; start: number }[] = [];
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      geometry.computeBoundingBox();
      const partCenter = geometry.boundingBox!.getCenter(new THREE.Vector3());
      geometry.translate(-partCenter.x, -partCenter.y, -partCenter.z);
      geometries.add(geometry);
      const arrow = /underline|rising/i.test(object.name);
      const material = new THREE.MeshStandardMaterial({ color: arrow ? 0xc5ab76 : 0xb9c7cf, metalness: .78, roughness: .27, transparent: true });
      if (arrow) material.clippingPlanes = [clip];
      materials.add(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = object.name;
      mesh.position.copy(partCenter).sub(center);
      group.add(mesh);
      const start = arrow ? .18 : .34 + clamp((partCenter.x - bounds.min.x) / width) * .16;
      parts.push({ mesh, base: mesh.position.clone(), arrow, start });
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose());
    });
    // The stroke follows the centerline of the same reference artwork as the GLB.
    const s = 12 / 1182;
    const points = [[88,459],[730,459],[878,248],[887,244],[897,255],[1008,421],[1020,426],[1032,418],[1172,215]]
      .map(([x,y]) => new THREE.Vector3((x-667)*s-center.x,(512-y)*s-center.y,.24-center.z));
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i=1;i<points.length;i++) path.add(new THREE.LineCurve3(points[i-1],points[i]));
    const tubeGeometry = new THREE.TubeGeometry(path, 300, .015, 5, false); geometries.add(tubeGeometry);
    const strokeMaterial = new THREE.MeshBasicMaterial({ color: 0xe0c184, transparent: true }); materials.add(strokeMaterial);
    const stroke = new THREE.Mesh(tubeGeometry, strokeMaterial); group.add(stroke);
    const totalIndices = tubeGeometry.index!.count;
    let oldWidth = 0, oldHeight = 0;
    return {
      render(progress: number) {
        if (disposed) return;
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        if (w !== oldWidth || h !== oldHeight) {
          renderer.setSize(w, h, false); oldWidth = w; oldHeight = h;
          const span = width * (w < 700 ? 1.12 : 1.18);
          camera.left = -span/2; camera.right = span/2;
          camera.top = span*h/w/2; camera.bottom = -span*h/w/2;
          camera.updateProjectionMatrix();
        }
        const reveal = ease((progress-.25)/.5);
        group.rotation.set(.18*(1-reveal)+.08*reveal,-.55*(1-reveal)-.12*reveal,-.025*(1-reveal));
        group.scale.setScalar(1.035-.035*reveal);
        group.updateMatrixWorld(true);
        localClip.constant = THREE.MathUtils.lerp(-width/2-.5,width/2+.5,clamp((progress-.10)/.42));
        clip.copy(localClip).applyMatrix4(group.matrixWorld);
        tubeGeometry.setDrawRange(0,Math.floor(totalIndices*clamp(.025+progress/.42)/30)*30);
        strokeMaterial.opacity = 1-ease((progress-.42)/.15);
        stroke.visible = progress < .60;
        for (const part of parts) {
          const r = ease((progress-part.start)/.24);
          part.mesh.material.opacity = r;
          part.mesh.visible = r > .001;
          if (!part.arrow) {
            part.mesh.position.y = part.base.y - .8*(1-r);
            part.mesh.position.z = part.base.z - .5*(1-r);
            part.mesh.scale.y = .35+.65*r;
          }
        }
        renderer.render(world,camera);
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
