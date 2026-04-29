// --- SETUP SCENE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const grid = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
scene.add(grid);
camera.position.set(0, 15, 15);

// --- VARIABLES ---
let shapes = [];
let draggingObj = null;
let mode = 'view'; // view, draw_poly, draw_curve
let drawPoints = [];
let drawMarkers = [];
let drawLine = null;

// --- UTILS ---
const getFloorPoint = () => {
    raycaster.setFromCamera(mouse, camera);
    const t = -camera.position.y / raycaster.ray.direction.y;
    return camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(t));
};

const updateStatus = (msg) => document.getElementById('status').innerText = "Mode: " + msg;

// --- ACTIONS ---
window.addBasicShape = function(sides) {
    const color = document.getElementById('colorPicker').value;
    const shape = new THREE.Shape();
    const radius = 2;
    for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    createFinalMesh(shape, color);
};

window.startDrawMode = function(type) {
    mode = type === 'poly' ? 'draw_poly' : 'draw_curve';
    clearDraft();
    updateStatus(type === 'poly' ? "Gambar Sisi Lurus" : "Gambar Sisi Lengkung");
    controls.enabled = false;
};

function clearDraft() {
    drawPoints = [];
    drawMarkers.forEach(m => scene.remove(m));
    drawMarkers = [];
    if (drawLine) scene.remove(drawLine);
    drawLine = null;
}

function createFinalMesh(shape, color) {
    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.1;
    scene.add(mesh);
    shapes.push(mesh);
}

// --- EVENTS ---
window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (mode.startsWith('draw')) {
        const pt = getFloorPoint();
        drawPoints.push(pt);
        
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        marker.position.copy(pt);
        scene.add(marker);
        drawMarkers.push(marker);

        if (drawPoints.length > 1) {
            if (drawLine) scene.remove(drawLine);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(drawPoints);
            drawLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
            scene.add(drawLine);
        }
    } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(shapes);
        if (intersects.length > 0) {
            draggingObj = intersects[0].object;
            controls.enabled = false;
        }
    }
});

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (draggingObj) {
        const pt = getFloorPoint();
        draggingObj.position.set(pt.x, 0.1, pt.z);
    }
});

window.addEventListener('mouseup', () => {
    if (mode === 'view') {
        draggingObj = null;
        controls.enabled = true;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && drawPoints.length > 2) {
        const shape = new THREE.Shape();
        const color = document.getElementById('colorPicker').value;

        if (mode === 'draw_poly') {
            shape.moveTo(drawPoints[0].x, -drawPoints[0].z);
            for (let i = 1; i < drawPoints.length; i++) {
                shape.lineTo(drawPoints[i].x, -drawPoints[i].z);
            }
        } else {
            const pts2d = drawPoints.map(p => new THREE.Vector2(p.x, -p.z));
            shape.moveTo(pts2d[0].x, pts2d[0].y);
            shape.splineThru(pts2d);
        }

        createFinalMesh(shape, color);
        clearDraft();
        mode = 'view';
        updateStatus("View (Orbit)");
        controls.enabled = true;
    }
});

window.resetAll = function() {
    shapes.forEach(s => scene.remove(s));
    shapes = [];
    clearDraft();
};

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
