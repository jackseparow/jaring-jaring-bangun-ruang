const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orbit = new THREE.OrbitControls(camera, renderer.domElement);
const transform = new THREE.TransformControls(camera, renderer.domElement);
scene.add(transform);

// Logika agar Orbit & Transform tidak bentrok
transform.addEventListener('dragging-changed', (e) => orbit.enabled = !e.value);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
scene.add(new THREE.GridHelper(30, 30, 0x444444, 0x222222));
camera.position.set(0, 15, 15);

let shapes = [];
let mode = 'view'; 
let drawPoints = [];
let drawMarkers = [];
let drawLine = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- FUNGSI BANGUN DASAR ---
window.addBasicShape = function(type, sides) {
    const color = document.getElementById('colorPicker').value;
    let shape = new THREE.Shape();
    
    if(type === 'circle') {
        shape.absarc(0, 0, 2, 0, Math.PI * 2, false);
    } else if(type === 'ellipse') {
        shape.absellipse(0, 0, 3, 1.5, 0, Math.PI * 2, false);
    } else {
        const radius = 2;
        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            if (i === 0) shape.moveTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
            else shape.lineTo(Math.cos(angle)*radius, Math.sin(angle)*radius);
        }
    }
    createMesh(shape, color);
};

function createMesh(shape, color) {
    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.1;
    scene.add(mesh);
    shapes.push(mesh);
    transform.attach(mesh); // Langsung pilih yang baru dibuat
}

// --- MANIPULASI ---
window.setTransformMode = function(m) {
    transform.setMode(m);
    mode = 'view';
    document.getElementById('status').innerText = "Mode: " + m.toUpperCase();
};

window.startDrawMode = function(type) {
    mode = type;
    drawPoints = [];
    transform.detach();
    document.getElementById('status').innerText = "Mode: Menggambar " + type;
};

// --- LOGIKA KLIK & DRAW ---
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || mode === 'view') {
        // Seleksi objek di mode view
        if(mode === 'view') {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(shapes);
            if(intersects.length > 0) transform.attach(intersects[0].object);
        }
        return;
    }

    // Ambil titik lantai
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const t = -camera.position.y / raycaster.ray.direction.y;
    const pt = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
    
    drawPoints.push(pt);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    marker.position.copy(pt);
    scene.add(marker);
    drawMarkers.push(marker);

    if(drawPoints.length > 1) {
        if(drawLine) scene.remove(drawLine);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(drawPoints);
        drawLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({color: 0xff0000}));
        scene.add(drawLine);
    }
});

window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && drawPoints.length > 2) {
        const shape = new THREE.Shape();
        const color = document.getElementById('colorPicker').value;
        const pts2d = drawPoints.map(p => new THREE.Vector2(p.x, -p.z));
        
        shape.moveTo(pts2d[0].x, pts2d[0].y);
        if(mode === 'curve') shape.splineThru(pts2d);
        else pts2d.forEach(p => shape.lineTo(p.x, p.y));

        createMesh(shape, color);
        drawMarkers.forEach(m => scene.remove(m));
        if(drawLine) scene.remove(drawLine);
        drawPoints = []; drawMarkers = []; drawLine = null;
        mode = 'view';
        document.getElementById('status').innerText = "Mode: View";
    }
});

window.resetAll = function() {
    shapes.forEach(s => scene.remove(s));
    shapes = []; transform.detach();
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
