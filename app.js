// --- KONFIGURASI DASAR ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0e14);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dLight = new THREE.DirectionalLight(0xffffff, 0.4);
dLight.position.set(10, 20, 10);
scene.add(dLight);

// Grid
const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 15, 20);

const shapes = [];
let selectedObj = null;
let draggingObj = null;
const planeXZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- FUNGSI UTAMA ---

window.spawn = (type) => {
    let geometry;
    const baseSize = 4;

    if (type === 'square') {
        geometry = new THREE.PlaneGeometry(baseSize, baseSize);
    } else if (type === 'triangle') {
        const shape = new THREE.Shape();
        shape.moveTo(0, baseSize / 2);
        shape.lineTo(baseSize / 2, -baseSize / 2);
        shape.lineTo(-baseSize / 2, -baseSize / 2);
        shape.closePath();
        geometry = new THREE.ShapeGeometry(shape);
    } else if (type === 'circle') {
        geometry = new THREE.CircleGeometry(baseSize / 2, 32);
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3498db, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        emissive: 0x000000
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.1, 0);
    mesh.userData = { type: type, baseSize: baseSize };

    scene.add(mesh);
    shapes.push(mesh);
    selectObject(mesh);
};

function selectObject(obj) {
    if (selectedObj) {
        selectedObj.material.emissive.setHex(0x000000);
        selectedObj.material.opacity = 0.8;
    }
    
    selectedObj = obj;
    
    if (obj) {
        obj.material.emissive.setHex(0x444444); // Beri efek glow saat terpilih
        obj.material.opacity = 1.0;
        
        // Sinkronkan UI
        document.getElementById('colorInput').value = "#" + obj.material.color.getHexString();
        document.getElementById('sizeInput').value = obj.scale.x * obj.userData.baseSize;
    }
}

window.updateSelected = () => {
    if (!selectedObj) return;
    selectedObj.material.color.set(document.getElementById('colorInput').value);
    
    const newSize = parseFloat(document.getElementById('sizeInput').value);
    const scale = newSize / selectedObj.userData.baseSize;
    selectedObj.scale.set(scale, scale, 1);
};

window.rotateSelected = () => {
    if (!selectedObj) return;
    selectedObj.rotation.z += Math.PI / 4; // Putar 45 derajat
};

// --- EVENTS ---

window.addEventListener('mousedown', (e) => {
    // Abaikan jika klik pada panel UI
    if (e.target.closest('#ui-panel')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(shapes);

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        selectObject(hit);
        draggingObj = hit;
        controls.enabled = false; // Kunci kamera saat memindah objek
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
    raycaster.ray.intersectPlane(planeXZ, intersectPoint);

    // Snapping 0.5 agar mudah menempel
    const snap = 0.5;
    draggingObj.position.x = Math.round(intersectPoint.x / snap) * snap;
    draggingObj.position.z = Math.round(intersectPoint.z / snap) * snap;
});

window.addEventListener('mouseup', () => {
    draggingObj = null;
    controls.enabled = true;
});

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') window.rotateSelected();
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
