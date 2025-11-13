// app.js
// Floating Clouds with official icons (Three.js + GSAP)

(() => {
  const ICONS = [
    { id: 'html5', label: 'HTML5', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/html5.svg' },
    { id: 'css3', label: 'CSS3', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/css3.svg' },
    { id: 'javascript', label: 'JavaScript', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/javascript.svg' },
    { id: 'php', label: 'PHP', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/php.svg' },
    { id: 'mysql', label: 'MySQL', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mysql.svg' },
    { id: 'kotlin', label: 'Kotlin', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/kotlin.svg' },
    { id: 'java', label: 'Java', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/java.svg' },
    { id: 'wordpress', label: 'WordPress', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/wordpress.svg' },
    { id: 'python', label: 'Python', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/python.svg' },
    { id: 'linux', label: 'Linux', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linux.svg' },
    { id: 'aws', label: 'AWS', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazonaws.svg' },
    { id: 'react', label: 'React', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/react.svg' },
    { id: 'flutter', label: 'Flutter', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/flutter.svg' },
    { id: 'laravel', label: 'Laravel', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/laravel.svg' }
  ];

  // DOM
  const canvas = document.getElementById('bg3d');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 18);

  // Controls (subtle auto rotate, disabled by user)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const rim = new THREE.PointLight(0x8b5cff, 0.8);
  rim.position.set(15, 10, 10);
  scene.add(rim);
  const fill = new THREE.PointLight(0x00d4ff, 0.6);
  fill.position.set(-10, -8, 6);
  scene.add(fill);

  // Soft gradient background sphere (very large, inside-out)
  const skyGeo = new THREE.SphereGeometry(120, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    color: 0x041024,
    transparent: true,
    opacity: 0.95
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Particles subtle
  const particlesCount = 700;
  const ptsGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 120;
  }
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const ptsMat = new THREE.PointsMaterial({ size: 0.06, opacity: 0.12, transparent: true });
  const pts = new THREE.Points(ptsGeo, ptsMat);
  scene.add(pts);

  // Group for icon sprites
  const iconsGroup = new THREE.Group();
  scene.add(iconsGroup);

  // Loaders
  const loader = new THREE.TextureLoader();

  // Helper: convert SVG to PNG-friendly (SVG can be used as texture if loaded as dataURL)
  // We'll load SVG via TextureLoader directly — most browsers support it.

  // Parameters
  const NUM_ICONS = ICONS.length;
  const CLUSTER_RADIUS = 18; // how far icons can be from center
  const ICON_MIN = 1.0;
  const ICON_MAX = 2.6;

  // Create sprite for each icon multiple times to create cloud effect
  const SPRITES_PER_ICON = 2; // more => denser clouds
  const allSprites = [];

  function createSprite(texture, meta) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: true,
      opacity: 1.0
    });

    const sprite = new THREE.Sprite(material);

    // randomize scale
    const s = ICON_MIN + Math.random() * (ICON_MAX - ICON_MIN);
    sprite.scale.set(s * 1.6, s, 1);

    // random position in a spherical shell / cloud region, biased on Y
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = CLUSTER_RADIUS * (0.35 + Math.random() * 0.85);

    sprite.position.set(
      Math.sin(phi) * Math.cos(theta) * r,
      Math.cos(phi) * r * 0.6, // flatten vertically a bit
      Math.sin(phi) * Math.sin(theta) * r
    );

    // store some velocity / personal motion parameters
    sprite.userData = {
      basePos: sprite.position.clone(),
      speed: 0.2 + Math.random() * 0.8,
      bobAmp: 0.3 + Math.random() * 1.0,
      rotSpeed: (Math.random() - 0.5) * 0.4,
      id: meta.id,
      label: meta.label,
    };

    iconsGroup.add(sprite);
    allSprites.push(sprite);
  }

  // Load all icons (textures) and create sprites
  let loaded = 0;
  ICONS.forEach((ic) => {
    for (let i = 0; i < SPRITES_PER_ICON; i++) {
      // we request the svg directly from CDN. If it fails, the texture will be empty but app still runs.
      loader.load(
        ic.url,
        (texture) => {
          // some SVGs have black fill; tinting is possible by using sprite.material.color, but we keep original.
          createSprite(texture, ic);
          loaded++;
        },
        undefined,
        (err) => {
          console.warn('Icon load err', ic.url, err);
          // create a simple colored circle as fallback
          const canvas = document.createElement('canvas');
          canvas.width = 256; canvas.height = 256;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(128,128,90,0,Math.PI*2); ctx.fill();
          const fallbackTex = new THREE.CanvasTexture(canvas);
          createSprite(fallbackTex, ic);
          loaded++;
        }
      );
    }
  });

  // Add a subtle central holographic icosahedron mesh for depth
  const icoGeo = new THREE.IcosahedronGeometry(3.6, 2);
  const icoMat = new THREE.MeshStandardMaterial({
    color: 0x0f2b3a,
    emissive: 0x0a3f5b,
    metalness: 0.6,
    roughness: 0.35,
    transparent: true,
    opacity: 0.9
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-2, -0.4, -1);
  scene.add(ico);

  // small wireframe overlay
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(icoGeo),
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.06 })
  );
  ico.add(wire);

  // Mouse parallax
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Resize
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    // subtle global rotation for cloud drift
    iconsGroup.rotation.y = Math.sin(t * 0.06) * 0.08;
    iconsGroup.rotation.x = Math.sin(t * 0.03) * 0.02;

    // animate each sprite: bobbing + gentle rotation + slow inward/outward float
    allSprites.forEach((s, i) => {
      const ud = s.userData;
      // bobbing on Y
      s.position.y = ud.basePos.y + Math.sin(t * ud.speed + i) * ud.bobAmp;
      // gentle rotation by changing scale.x to simulate circular spin
      s.material.rotation = t * ud.rotSpeed * 0.6;
      // small drift from base position
      s.position.x = ud.basePos.x + Math.sin(t * (ud.speed * 0.3) + i * 0.7) * 0.25;
      s.position.z = ud.basePos.z + Math.cos(t * (ud.speed * 0.25) + i * 0.4) * 0.25;
      // tweak opacity for subtle twinkle
      const fade = 0.85 + Math.sin(t * ud.speed + i) * 0.12;
      s.material.opacity = THREE.MathUtils.clamp(fade, 0.35, 1.0);
    });

    // animate central ico
    ico.rotation.y += 0.0025;
    ico.rotation.x += 0.0012;

    // camera move with mouse (parallax)
    camera.position.x += (mouse.x * 6 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.y * 3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // Start loop even if textures still loading (sprites will appear when loaded)
  animate();

  // GSAP entrance animations for DOM elements (optional)
  window.addEventListener('load', () => {
    gsap.from(".avatar", { y: 28, opacity: 0, duration: 0.9, ease: "power3.out" });
    gsap.from(".hero-info h1", { y: 18, opacity: 0, duration: 0.9, delay: 0.08, ease: "power3.out" });
    gsap.from(".role", { y: 12, opacity: 0, duration: 0.8, delay: 0.16 });
    gsap.from(".panel", { y: 16, opacity: 0, stagger: 0.06, delay: 0.28 });
  });

  // Optional: click interaction — show label of nearest icon (quick implementation)
  const infoBox = document.createElement('div');
  infoBox.style.position = 'fixed';
  infoBox.style.pointerEvents = 'none';
  infoBox.style.padding = '6px 10px';
  infoBox.style.background = 'rgba(8,10,18,0.8)';
  infoBox.style.color = '#dff7ff';
  infoBox.style.border = '1px solid rgba(0,212,255,0.12)';
  infoBox.style.fontSize = '13px';
  infoBox.style.borderRadius = '8px';
  infoBox.style.zIndex = 9999;
  infoBox.style.display = 'none';
  document.body.appendChild(infoBox);

  // raycaster for hover
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(allSprites, true);
    if (intersects.length > 0) {
      const top = intersects[0].object;
      infoBox.style.left = (e.clientX + 14) + 'px';
      infoBox.style.top = (e.clientY + 14) + 'px';
      infoBox.textContent = top.userData.label || '';
      infoBox.style.display = 'block';
    } else {
      infoBox.style.display = 'none';
    }
  }
  window.addEventListener('pointermove', onPointerMove);

  // Clean up note: If you want more interactivity (click to open docs), I can add links.
})();
