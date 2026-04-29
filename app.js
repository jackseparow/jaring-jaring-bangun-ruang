// --- KONFIGURASI SCENE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a1a1a);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Cahaya
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, 20, 10);
scene.add(light);

// Lantai Kotak-kotak (Grid)
const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 15, 15);

const shapes = [];
let draggingObject = null;
const planeXZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- LOGIKA SPAWN ---
window.spawnShape = (type) => {
    let geometry;
    let color;

    if (type === 'square') {
        geometry = new THREE.PlaneGeometry(4, 4);
        color = 0x3498db;
    } else if (type === 'triangle') {
        const shape = new THREE.Shape();
        shape.moveTo(0, 2);
        shape.lineTo(2, -2);
        shape.lineTo(-2, -2);
        geometry = new THREE.ShapeGeometry(shape);
        color = 0xe67e22;
    } else if (type === 'circle') {
        geometry = new THREE.CircleGeometry(2, 32);
        color = 0x2ecc71;
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: color, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rebahkan di lantai
    mesh.position.y = 0.05; // Sedikit di atas grid agar tidak berkedip
    
    scene.add(mesh);
    shapes.push(mesh);
};

// --- LOGIKA INTERAKSI (DRAG & SNAP) ---
function getIntersectionPoint() {
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeXZ, intersectPoint);
    return intersectPoint;
}

window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes);

    if (intersects.length > 0) {
        draggingObject = intersects[0].object;
        controls.enabled = false; // Matikan kamera saat geser objek
    }
});

window.addEventListener('mousemove', (e) => {
    if (!draggingObject) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const floorPt = getIntersectionPoint();
    
    // Snapping Sederhana (Kelipatan 0.5 unit)
    const snap = 0.5;
    draggingObject.position.x = Math.round(floorPt.x / snap) * snap;
    draggingObject.position.z = Math.round(floorPt.z / snap) * snap;

    // Logika Snapping antar Sisi (Jika dekat dengan objek lain, rekatkan)
    shapes.forEach(other => {
        if (other === draggingObject) return;
        const distance = draggingObject.position.distanceTo(other.position);
        if (distance < 4.2 && distance > 3.8) { // Ukuran standar 4 unit
             // Otomatis menempel pas di sisi
             if (Math.abs(draggingObject.position.x - other.position.x) < 1) {
                 draggingObject.position.x = other.position.x;
             }
             if (Math.abs(draggingObject.position.z - other.position.z) < 1) {
                 draggingObject.position.z = other.position.z;
             }
        }
    });
});

window.addEventListener('mouseup', () => {
    draggingObject = null;
    controls.enabled = true;
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
