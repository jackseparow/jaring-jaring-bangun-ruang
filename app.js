// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x111111);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Cahaya (Penting agar warna muncul)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Grid Dasar
const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
scene.add(grid);

camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

const shapes = [];
let selectedObj = null;
let draggingObj = null;
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- FUNGSI SPAWN ---
window.spawn = (type) => {
    let geometry;
    const size = 4; // Ukuran dasar

    if (type === 'square') {
        geometry = new THREE.PlaneGeometry(size, size);
    } else if (type === 'triangle') {
        const s = new THREE.Shape();
        s.moveTo(0, size/2);
        s.lineTo(size/2, -size/2);
        s.lineTo(-size/2, -size/2);
        s.closePath();
        geometry = new THREE.ShapeGeometry(s);
    } else if (type === 'circle') {
        geometry = new THREE.CircleGeometry(size/2, 32);
    }

    const material = new THREE.MeshLambertMaterial({ 
        color: 0x3498db, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Rebahkan objek ke lantai
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.05, 0); // Sedikit di atas grid
    
    mesh.userData = { type: type, baseSize: size };
    
    scene.add(mesh);
    shapes.push(mesh);
    selectObject(mesh);
};

// --- LOGIKA INTERAKSI ---
function selectObject(obj) {
    // Reset objek sebelumnya
    if (selectedObj) {
        selectedObj.material.emissive.setHex(0x000000);
    }
    
    selectedObj = obj;
    
    if (obj) {
        obj.material.emissive.setHex(0x222222); // Efek highlight
        // Update UI Panel
        document.getElementById('colorInput').value = "#" + obj.material.color.getHexString();
        // Hitung skala saat ini untuk slider
        const currentScale = obj.scale.x * obj.userData.baseSize;
        document.getElementById('sizeInput').value = currentScale;
    }
}

window.updateSelected = () => {
    if (!selectedObj) return;
    
    // Update Warna
    selectedObj.material.color.set(document.getElementById('colorInput').value);
    
    // Update Ukuran
    const newSize = parseFloat(document.getElementById('sizeInput').value);
    const scaleFactor = newSize / selectedObj.userData.baseSize;
    selectedObj.scale.set(scaleFactor, scaleFactor, 1);
};

window.rotateSelected = () => {
    if (!selectedObj) return;
    selectedObj.rotation.z += Math.PI / 4; // Putar 45 derajat
};

// Hotkey R untuk Putar
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') window.rotateSelected();
});

// Deteksi Klik dan Drag
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Hanya klik kiri
    
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        selectObject(hit);
        draggingObj = hit;
        controls.enabled = false; // Matikan orbit saat geser
    } else {
        selectObject(null);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!draggingObj) return;
    
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersectPoint);
    
    // Snapping 0.5 unit agar mudah dihimpitkan
    const snap = 0.5;
    draggingObj.position.x = Math.round(intersectPoint.x / snap) * snap;
    draggingObj.position.z = Math.round(intersectPoint.z / snap) * snap;
});

window.addEventListener('mouseup', () => {
    draggingObj = null;
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
