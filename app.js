const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 10, 10);

let shapes = [];
let draggingObject = null;
let drawMode = 'view'; // view, poly, curve
let points = [];
let tempMarkers = [];
let previewLine = null;

// --- FUNGSI TAMBAH BENTUK DASAR ---
window.addShape = function(type, sides = 4) {
    const color = document.getElementById('colorPicker').value;
    const size = parseFloat(document.getElementById('sizeSlider').value);
    let geo;

    if (type === 'poly') {
        const shape = new THREE.Shape();
        for(let i=0; i<sides; i++){
            const angle = (i/sides) * Math.PI * 2;
            shape[i===0?'moveTo':'lineTo'](Math.cos(angle)*size, Math.sin(angle)*size);
        }
        geo = new THREE.ShapeGeometry(shape);
    } else {
        geo = new THREE.CircleGeometry(size, 32);
    }

    createMesh(geo, color);
};

function createMesh(geo, color) {
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    scene.add(mesh);
    shapes.push(mesh);
}

// --- LOGIKA MENGGAMBAR KUSTOM ---
window.startDraw = function(mode) {
    drawMode = mode;
    clearDrawing();
    document.getElementById('status').innerText = "Mode: Menggambar " + mode;
};

function clearDrawing() {
    points = [];
    tempMarkers.forEach(m => scene.remove(m));
    tempMarkers = [];
    if(previewLine) scene.remove(previewLine);
}

window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    if (drawMode !== 'view') {
        // Hitung posisi di lantai (Y=0)
        const t = -camera.position.y / raycaster.ray.direction.y;
        const pt = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
        
        points.push(pt);
        
        // Visual Point
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        marker.position.copy(pt);
        scene.add(marker);
        tempMarkers.push(marker);

        // Update Line Preview
        if (points.length > 1) {
            if(previewLine) scene.remove(previewLine);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            previewLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
            scene.add(previewLine);
        }
    } else {
        const intersects = raycaster.intersectObjects(shapes);
        if(intersects.length > 0) {
            draggingObject = intersects[0].object;
            controls.enabled = false;
        }
    }
});

window.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && points.length > 2) finalizeShape();
});

function finalizeShape() {
    const shape = new THREE.Shape();
    const color = document.getElementById('colorPicker').value;

    if (drawMode === 'poly') {
        shape.moveTo(points[0].x, -points[0].z); // Invert Z ke Y Shape
        for(let i=1; i<points.length; i++) shape.lineTo(points[i].x, -points[i].z);
    } else {
        const pts2d = points.map(p => new THREE.Vector2(p.x, -p.z));
        shape.moveTo(pts2d[0].x, pts2d[0].y);
        shape.splineThru(pts2d);
    }

    createMesh(new THREE.ShapeGeometry(shape), color);
    clearDrawing();
    drawMode = 'view';
    document.getElementById('status').innerText = "Mode: View";
}

// --- DRAG & SNAP ---
window.addEventListener('mousemove', (e) => {
    if(!draggingObject) return;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const t = -camera.position.y / raycaster.ray.direction.y;
    const pt = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
    
    draggingObject.position.set(pt.x, 0.05, pt.z);

    // Snapping Sederhana
    shapes.forEach(other => {
        if(other === draggingObject) return;
        if(draggingObject.position.distanceTo(other.position) < 0.5) {
            draggingObject.position.copy(other.position).x += 1; // Snap berjejer
        }
    });
});

window.addEventListener('mouseup', () => {
    draggingObject = null;
    controls.enabled = true;
});

function updateMouse(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

window.resetAll = function() {
    shapes.forEach(s => scene.remove(s));
    shapes = [];
    clearDrawing();
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
