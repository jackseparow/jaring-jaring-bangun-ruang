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

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 20, 20);

const shapes = [];
let selectedObject = null;
let draggingObject = null;
const planeXZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- LOGIKA SPAWN ---
window.spawn = (type) => {
    let geometry;
    const defaultSize = 4;
    
    if (type === 'square') {
        geometry = new THREE.PlaneGeometry(defaultSize, defaultSize);
    } else if (type === 'triangle') {
        const s = new THREE.Shape();
        s.moveTo(0, defaultSize/2);
        s.lineTo(defaultSize/2, -defaultSize/2);
        s.lineTo(-defaultSize/2, -defaultSize/2);
        geometry = new THREE.ShapeGeometry(s);
    } else if (type === 'circle') {
        geometry = new THREE.CircleGeometry(defaultSize/2, 32);
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: Math.random() * 0xffffff, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.1, 0);
    mesh.userData = { type, baseSize: defaultSize };
    
    scene.add(mesh);
    shapes.push(mesh);
    select(mesh);
};

// --- INTERAKSI ---
function select(obj) {
    if (selectedObject) {
        selectedObject.material.emissive.setHex(0x000000);
    }
    selectedObject = obj;
    if (obj) {
        obj.material.emissive.setHex(0x333333); // Highlight terpilih
        document.getElementById('colorInput').value = "#" + obj.material.color.getHexString();
    }
}

window.updateSelectedStyle = () => {
    if (!selectedObject) return;
    
    // Update Warna
    selectedObject.material.color.set(document.getElementById('colorInput').value);
    
    // Update Ukuran
    const newSize = parseFloat(document.getElementById('sizeInput').value);
    const scale = newSize / selectedObject.userData.baseSize;
    selectedObject.scale.set(scale, scale, 1);
};

window.rotateSelected = () => {
    if (!selectedObject) return;
    selectedObject.rotation.z += Math.PI / 4; // Putar 45 derajat
};

// Handle Keypress R
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') rotateSelected();
});

window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes);

    if (intersects.length > 0) {
        select(intersects[0].object);
        draggingObject = intersects[0].object;
        controls.enabled = false;
    } else {
        select(null);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!draggingObject) return;
    updateMouse(e);
    
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeXZ, intersectPoint);
    
    // Snapping 0.5 unit
    const snap = 0.5;
    draggingObject.position.x = Math.round(intersectPoint.x / snap) * snap;
    draggingObject.position.z = Math.round(intersectPoint.z / snap) * snap;
});

window.addEventListener('mouseup', () => {
    draggingObject = null;
    controls.enabled = true;
});

function updateMouse(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

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
