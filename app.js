const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x2c3e50);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

camera.position.set(0, 5, 10);
scene.add(new THREE.GridHelper(20, 20));

let shapes = [];
let isFolding = false;
let foldAngle = 0;

// Fungsi membuat poligon beraturan
function createPolygonGeometry(sides, radius = 1) {
    const shape = new THREE.Shape();
    for (let i = 0; i <= sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    return new THREE.ShapeGeometry(shape);
}

// Tambah bangun datar ke layar
window.addShape = function(sides) {
    const geo = createPolygonGeometry(sides);
    const mat = new THREE.MeshPhongMaterial({ 
        color: Math.random() * 0xffffff, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // Letakkan di lantai
    mesh.position.y = 0.01;
    
    // Logika Drag & Snap Sederhana
    mesh.userData = { sides: sides, connected: false };
    scene.add(mesh);
    shapes.push(mesh);
    
    // Kita buat interaksi klik untuk memindahkan (untuk prototipe ini, kita sebar saja)
    mesh.position.x = (Math.random() - 0.5) * 5;
    mesh.position.z = (Math.random() - 0.5) * 5;
};

// Logika Melipat
window.toggleFold = function() {
    isFolding = !isFolding;
    const btn = document.getElementById('fold-btn');
    btn.innerText = isFolding ? "BUKA JARING-JARING" : "LIPAT JADI 3D";
};

window.resetCanvas = function() {
    shapes.forEach(s => scene.remove(s));
    shapes = [];
    foldAngle = 0;
};

function animate() {
    requestAnimationFrame(animate);
    
    if (isFolding && foldAngle < Math.PI / 2) {
        foldAngle += 0.02;
    } else if (!isFolding && foldAngle > 0) {
        foldAngle -= 0.02;
    }

    // Terapkan lipatan pada bangun selain "alas"
    // Di sini kita asumsikan shape[0] adalah alas
    shapes.forEach((shape, index) => {
        if (index > 0) {
            // Animasi lipatan sederhana (rotasi pada sumbu tertentu)
            shape.rotation.z = foldAngle; 
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();
