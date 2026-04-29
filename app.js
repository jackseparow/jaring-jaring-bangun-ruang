const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
camera.position.set(0, 12, 12);

let mode = 'view'; // view, poly, circle
let activeShape = null;
let activeHandle = null;
const shapes = [];
const handles = []; // Titik kontrol visual

// --- UTILS ---
function getMouseFloor() {
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    return target;
}

window.startMode = (m) => {
    mode = m;
    activeShape = null;
    document.getElementById('hint').innerHTML = `Mode: <b>${m.toUpperCase()}</b><br>Klik lantai untuk memulai.`;
};

// --- CORE LOGIC ---
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    const floorPt = getMouseFloor();

    if (mode === 'poly') {
        createPoly(floorPt);
    } else if (mode === 'circle') {
        createCircle(floorPt);
    } else {
        // Cek Klik Handle untuk Edit
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(handles);
        if (intersects.length > 0) {
            activeHandle = intersects[0].object;
            controls.enabled = false;
        }
    }
});

window.addEventListener('mousemove', (e) => {
    if (!activeHandle) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    const floorPt = getMouseFloor();
    activeHandle.position.copy(floorPt);
    activeHandle.userData.updateAction();
});

window.addEventListener('mouseup', () => {
    activeHandle = null;
    controls.enabled = true;
});

// --- PEMBUATAN BANGUN ---
function createPoly(center) {
    const pts = [
        new THREE.Vector3(center.x - 1, 0, center.z - 1),
        new THREE.Vector3(center.x + 1, 0, center.z - 1),
        new THREE.Vector3(center.x + 1, 0, center.z + 1),
        new THREE.Vector3(center.x - 1, 0, center.z + 1)
    ];

    const shape = new THREE.Shape();
    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x3498db, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    mesh.rotation.x = -Math.PI/2; // Dibaringkan agar sesuai ShapeGeometry 2D
    scene.add(mesh);

    // Buat Handles
    pts.forEach((pt, i) => {
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
        handle.position.copy(pt);
        scene.add(handle);
        handles.push(handle);

        handle.userData.updateAction = () => {
            pts[i].copy(handle.position);
            updatePolyMesh(mesh, pts);
        };
    });

    updatePolyMesh(mesh, pts);
    mode = 'view';
}

function updatePolyMesh(mesh, pts) {
    const shape = new THREE.Shape();
    // Konversi posisi dunia ke lokal mesh yang sudah diputar
    shape.moveTo(pts[0].x, -pts[0].z);
    for(let i=1; i<pts.length; i++) shape.lineTo(pts[i].x, -pts[i].z);
    
    mesh.geometry.dispose();
    mesh.geometry = new THREE.ShapeGeometry(shape);
}

function createCircle(center) {
    const centerPoint = center.clone();
    let radius = 2;

    const geo = new THREE.CircleGeometry(radius, 32);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2ecc71, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    mesh.rotation.x = -Math.PI/2;
    mesh.position.copy(centerPoint);
    scene.add(mesh);

    // Handle Jari-jari
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
    handle.position.set(centerPoint.x + radius, 0, centerPoint.z);
    scene.add(handle);
    handles.push(handle);

    handle.userData.updateAction = () => {
        const d = handle.position.distanceTo(centerPoint);
        mesh.scale.set(d/radius, d/radius, 1);
    };

    mode = 'view';
}

window.resetAll = () => {
    location.reload(); // Cara paling bersih untuk reset total sistem partikel/mesh
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
