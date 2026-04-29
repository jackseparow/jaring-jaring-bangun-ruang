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
scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));
camera.position.set(0, 8, 10);

let shapes = [];
let draggingObject = null;
let isDrawing = false;
let customPoints = [];
let drawMode = 'view'; // view, poly, curve

// --- CORE FUNCTIONS ---

window.addShape = function(type, sides = 4) {
    const color = document.getElementById('colorPicker').value;
    const size = parseFloat(document.getElementById('sizeSlider').value);
    let geo;

    if (type === 'poly') {
        const shape = new THREE.Shape();
        for(let i=0; i<sides; i++){
            const angle = (i/sides) * Math.PI * 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if(i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
        }
        geo = new THREE.ShapeGeometry(shape);
    } else if (type === 'circle') {
        geo = new THREE.CircleGeometry(size, 32);
    }

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    scene.add(mesh);
    shapes.push(mesh);
};

// --- CUSTOM DRAWING (POLYGON & CURVE) ---

window.startCustomPolygon = function() {
    drawMode = 'poly';
    customPoints = [];
    updateStatus("Klik di lantai untuk titik poligon. Tekan 'Enter' untuk selesai.");
};

window.startCurveDraw = function() {
    drawMode = 'curve';
    customPoints = [];
    updateStatus("Klik untuk titik kurva. 'Enter' untuk tutup kurva.");
};

window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && customPoints.length > 2) {
        finalizeCustomShape();
    }
});

function finalizeCustomShape() {
    const shape = new THREE.Shape();
    const color = document.getElementById('colorPicker').value;

    if(drawMode === 'poly') {
        shape.moveTo(customPoints[0].x, customPoints[0].z);
        for(let i=1; i<customPoints.length; i++) shape.lineTo(customPoints[i].x, customPoints[i].z);
    } else {
        shape.moveTo(customPoints[0].x, customPoints[0].z);
        shape.splineThru(customPoints.map(p => new THREE.Vector2(p.x, p.z)));
    }

    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide }));
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    shapes.push(mesh);
    drawMode = 'view';
    updateStatus("View Mode");
}

// --- INTERACTION (DRAG & SNAP) ---

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);

function onMouseDown(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if(drawMode !== 'view') {
        const intersect = raycaster.intersectObject(scene.getObjectByName('grid') || new THREE.GridHelper(20,20)); // Dummy plane check
        // Sederhananya, kita ambil posisi grid di y=0
        const t = -camera.position.y / raycaster.ray.direction.y;
        const pt = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
        customPoints.push(pt);
        return;
    }

    const intersects = raycaster.intersectObjects(shapes);
    if(intersects.length > 0) {
        draggingObject = intersects[0].object;
        controls.enabled = false;
    }
}

function onMouseMove(e) {
    if(!draggingObject) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const t = -camera.position.y / raycaster.ray.direction.y;
    const pt = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
    
    draggingObject.position.x = pt.x;
    draggingObject.position.z = pt.z;

    // SISTEM REKAT (SNAPPING) SEDERHANA
    shapes.forEach(other => {
        if(other === draggingObject) return;
        const dist = draggingObject.position.distanceTo(other.position);
        if(dist < 1.0) { // Jika dekat, rekatkan
            draggingObject.position.x = other.position.x + 1.5; // Offset sederhana
        }
    });
}

function onMouseUp() {
    draggingObject = null;
    controls.enabled = true;
}

function updateStatus(txt) { document.getElementById('status').innerText = "Mode: " + txt; }

function resetAll() {
    shapes.forEach(s => scene.remove(s));
    shapes = [];
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
