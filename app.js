// --- INITIALIZATION ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(10, 20, 10);
scene.add(light);

const grid = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 15, 20);

let mode = 'view';
let activeHandle = null;
const handles = [];

// Plane bantu untuk raycasting lantai tetap di Y = 0
const planeXZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// --- UTILS ---
function getIntersectionPoint() {
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeXZ, intersectPoint);
    return intersectPoint;
}

window.startMode = (m) => {
    mode = m;
    document.getElementById('hint').innerHTML = `Mode: <b>${m.toUpperCase()}</b><br>Klik lantai untuk menempatkan objek.`;
};

// --- INTERACTION ---
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    updateMouse(e);
    const floorPt = getIntersectionPoint();

    if (mode === 'poly') {
        createPolygon(floorPt);
        mode = 'view';
    } else if (mode === 'circle') {
        createCircle(floorPt);
        mode = 'view';
    } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(handles);
        if (intersects.length > 0) {
            activeHandle = intersects[0].object;
            controls.enabled = false;
        }
    }
});

window.addEventListener('mousemove', (e) => {
    updateMouse(e);
    if (!activeHandle) return;
    
    const floorPt = getIntersectionPoint();
    activeHandle.position.copy(floorPt);
    activeHandle.userData.update(); 
});

window.addEventListener('mouseup', () => {
    activeHandle = null;
    controls.enabled = true;
});

function updateMouse(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

// --- SHAPE LOGIC ---

function createPolygon(center) {
    // Definisi titik sudut di bidang XZ
    const points = [
        new THREE.Vector3(center.x - 3, 0.05, center.z - 3),
        new THREE.Vector3(center.x + 3, 0.05, center.z - 3),
        new THREE.Vector3(center.x + 3, 0.05, center.z + 3),
        new THREE.Vector3(center.x - 3, 0.05, center.z + 3)
    ];

    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3498db, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.7 
    });

    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    scene.add(mesh);

    points.forEach((pt, i) => {
        const handle = new THREE.Mesh(
            new THREE.SphereGeometry(0.25), 
            new THREE.MeshBasicMaterial({ color: 0xff4757 })
        );
        handle.position.copy(pt);
        scene.add(handle);
        handles.push(handle);

        handle.userData.update = () => {
            pt.copy(handle.position);
            refreshPolygon(mesh, points);
        };
    });

    refreshPolygon(mesh, points);
}

function refreshPolygon(mesh, points) {
    // Membuat segitiga-segitiga untuk mengisi poligon persegi (Triangulasi manual sederhana)
    // Urutan vertex: 0-1-2 dan 0-2-3
    const vertices = new Float32Array([
        points[0].x, points[0].y, points[0].z,
        points[1].x, points[1].y, points[1].z,
        points[2].x, points[2].y, points[2].z,

        points[0].x, points[0].y, points[0].z,
        points[2].x, points[2].y, points[2].z,
        points[3].x, points[3].y, points[3].z,
    ]);

    mesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    mesh.geometry.computeVertexNormals();
}

function createCircle(center) {
    let radius = 3;
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x2ecc71, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.7 
    });

    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), material);
    mesh.rotation.x = -Math.PI / 2; // Rebahkan rata lantai
    mesh.position.set(center.x, 0.02, center.z);
    scene.add(mesh);

    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.25), 
        new THREE.MeshBasicMaterial({ color: 0xff4757 })
    );
    handle.position.set(center.x + radius, 0.02, center.z);
    scene.add(handle);
    handles.push(handle);

    handle.userData.update = () => {
        const dist = handle.position.distanceTo(mesh.position);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.CircleGeometry(dist, 64);
        handle.position.y = 0.02; 
    };
}

window.resetAll = () => { location.reload(); };

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
