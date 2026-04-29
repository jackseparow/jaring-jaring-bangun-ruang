// --- KONFIGURASI DASAR ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Pencahayaan
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(5, 10, 7);
scene.add(sun);

// Grid Pembantu
scene.add(new THREE.GridHelper(30, 30, 0x444444, 0x222222));
camera.position.set(0, 15, 15);

let mode = 'view';
let activeHandle = null;
const handles = [];

// --- UTILS ---
function getFloorPoint() {
    raycaster.setFromCamera(mouse, camera);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersectionPoint);
    return intersectionPoint;
}

window.startMode = (m) => {
    mode = m;
    document.getElementById('hint').innerHTML = `Mode: <b>${m.toUpperCase()}</b><br>Klik di lantai untuk membuat objek.`;
};

// --- LOGIKA UTAMA ---
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const floorPt = getFloorPoint();

    if (mode === 'poly') {
        createPolygon(floorPt);
        mode = 'view';
    } else if (mode === 'circle') {
        createCircle(floorPt);
        mode = 'view';
    } else {
        // Mode View: Cek apakah klik mengenai Handle (Titik Merah)
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(handles);
        if (intersects.length > 0) {
            activeHandle = intersects[0].object;
            controls.enabled = false; // Matikan rotasi kamera saat tarik titik
        }
    }
});

window.addEventListener('mousemove', (e) => {
    if (!activeHandle) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    const floorPt = getFloorPoint();
    activeHandle.position.copy(floorPt);
    activeHandle.userData.update(); // Jalankan fungsi update objek
});

window.addEventListener('mouseup', () => {
    activeHandle = null;
    controls.enabled = true;
    document.getElementById('hint').innerHTML = `Mode: <b>VIEW</b><br>Tarik titik merah untuk ubah bentuk.`;
});

// --- FUNGSI BANGUN DATAR ---

function createPolygon(center) {
    const pts = [
        new THREE.Vector3(center.x - 2, 0, center.z - 2),
        new THREE.Vector3(center.x + 2, 0, center.z - 2),
        new THREE.Vector3(center.x + 2, 0, center.z + 2),
        new THREE.Vector3(center.x - 2, 0, center.z + 2)
    ];

    const mesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({ color: 0x3498db, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    scene.add(mesh);

    // Buat Titik Kontrol (Handles)
    pts.forEach((pt, i) => {
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
        handle.position.copy(pt);
        scene.add(handle);
        handles.push(handle);

        handle.userData.update = () => {
            pts[i].copy(handle.position);
            updatePolygonGeometry(mesh, pts);
        };
    });

    updatePolygonGeometry(mesh, pts);
}

function updatePolygonGeometry(mesh, pts) {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0].x, -pts[0].z); // Inversi Z karena ShapeGeometry bekerja di bidang XY
    for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i].x, -pts[i].z);
    }
    shape.closePath();

    mesh.geometry.dispose();
    mesh.geometry = new THREE.ShapeGeometry(shape);
    mesh.rotation.x = -Math.PI / 2; // Rebahkan ke lantai
}

function createCircle(center) {
    let radius = 2;
    const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 32),
        new THREE.MeshStandardMaterial({ color: 0x2ecc71, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    mesh.position.copy(center);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xff4757 }));
    handle.position.set(center.x + radius, 0, center.z);
    scene.add(handle);
    handles.push(handle);

    handle.userData.update = () => {
        const newRadius = handle.position.distanceTo(mesh.position);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.CircleGeometry(newRadius, 32);
        // Pastikan handle tetap di garis horizontal relatif terhadap pusat untuk kemudahan tarik
        handle.position.y = 0; 
    };
}

window.resetAll = () => {
    location.reload(); 
};

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
