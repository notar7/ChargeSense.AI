import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface GlobeEntryProps {
  onIndiaClick: () => void;
}

interface IndianCity {
  lat: number;
  lng: number;
  name: string;
  color: number;
}

const INDIAN_CITIES: IndianCity[] = [
  { lat: 19.076, lng: 72.877, name: 'Mumbai', color: 0x00E5FF },
  { lat: 28.679, lng: 77.213, name: 'Delhi', color: 0x00E676 },
  { lat: 13.082, lng: 80.270, name: 'Chennai', color: 0xFFD600 },
  { lat: 22.572, lng: 88.363, name: 'Kolkata', color: 0xE040FB },
  { lat: 18.520, lng: 73.856, name: 'Pune', color: 0xFF3D00 },
  { lat: 12.971, lng: 77.594, name: 'Bangalore', color: 0x2979FF },
  { lat: 17.385, lng: 78.486, name: 'Hyderabad', color: 0xFF2A6D },
];

// Convert lat/lng to 3D sphere position
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Create starfield particles
function createStarfield(scene: THREE.Scene) {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const radius = 80 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    sizes[i] = Math.random() * 1.5 + 0.5;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  return stars;
}

// Create glowing atmosphere
function createAtmosphere(earth: THREE.Mesh, radius: number) {
  const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.15, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        gl_FragColor = vec4(0.0, 0.82, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });

  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  earth.add(atmosphere); // Add directly to earth so it shares positioning and transforms
  return atmosphere;
}

// Create pulsing city markers
function createCityMarkers(earth: THREE.Mesh, radius: number) {
  const markers: THREE.Mesh[] = [];

  INDIAN_CITIES.forEach((city) => {
    const pos = latLngToVector3(city.lat, city.lng, radius * 1.02);

    // Main dot (increased size to 0.024)
    const dotGeometry = new THREE.SphereGeometry(0.024, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: city.color,
      transparent: true,
      opacity: 0.9,
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(pos);
    earth.add(dot);
    markers.push(dot);
  });

  return { markers };
}

export default function GlobeEntry({ onIndiaClick }: GlobeEntryProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mainOverlayRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    earth: THREE.Mesh;
    stars: THREE.Points;
    pulseRings: THREE.Mesh[];
    animationId: number;
    isZooming: boolean;
    controls: OrbitControls;
  } | null>(null);

  const handleZoomToIndia = useCallback(() => {
    if (!sceneRef.current || sceneRef.current.isZooming) return;
    sceneRef.current.isZooming = true;

    const { camera, earth, controls, renderer } = sceneRef.current;

    // Disable OrbitControls to allow GSAP to animate the camera smoothly
    controls.enabled = false;

    // Get current dimensions directly from the renderer to adjust offset
    const size = new THREE.Vector2();
    renderer.getSize(size);
    const w = size.x;
    const h = size.y;

    // Check if large screen to calculate viewOffset initial value
    const isLarge = window.innerWidth >= 1024;

    // Calculate exact target coordinate of India relative to Earth center (0, 0, 0)
    const targetCameraPos = latLngToVector3(22.5, 77.5, 2.4); // Distance 2.4 from Earth center (smaller Earth)
    const targetLookAt = latLngToVector3(22.5, 77.5, 1.7); // India surface on smaller Earth (radius 1.7)

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onIndiaClick, 300);
      },
    });

    // Reset Earth rotation smoothly to (0, 0, 0) so local coordinates align perfectly
    tl.to(earth.rotation, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: 'power2.out',
    });

    // Concurrently animate camera view offset back to 0 (slides Earth from right to center of screen!)
    const offsetObj = { x: isLarge ? -w * 0.22 : 0 };
    tl.to(offsetObj, {
      x: 0,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.setViewOffset(w, h, offsetObj.x, 0, w, h);
      }
    }, '-=0.8');

    // Fly camera directly to the India coordinate vector relative to Earth
    tl.to(
      camera.position,
      {
        x: targetCameraPos.x,
        y: targetCameraPos.y,
        z: targetCameraPos.z,
        duration: 1.8,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.lookAt(targetLookAt);
        },
      },
      '-=1.8'
    );

    // Stagger fade-out, slide-left, and motion blur on left textual overlay items
    if (mainOverlayRef.current) {
      const items = Array.from(mainOverlayRef.current.children);
      tl.to(items, {
        opacity: 0,
        x: -80,
        filter: 'blur(8px)',
        stagger: 0.08,
        duration: 0.8,
        ease: 'power2.in',
      }, '-=1.8');
    }

    // Scale up/zoom canvas size and fade out canvas container smoothly
    tl.to(canvasContainerRef.current, {
      scale: 1.5,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
    }, '-=0.6');
  }, [onIndiaClick]);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    // Shift camera view offset so the Earth (centered at 0, 0, 0) appears on the right side of the screen
    const isLarge = window.innerWidth >= 1024;
    const xOffset = isLarge ? -width * 0.22 : 0; // Shift camera view left, moving Earth right
    camera.setViewOffset(width, height, xOffset, 0, width, height);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Remove black background boundary, make transparent
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 4.0;
    controls.maxDistance = 15.0;
    controls.target.set(0, 0, 0); // Rotate around center in place

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x06B6D4, 1.2);
    backLight.position.set(-5, -2, -5);
    scene.add(backLight);

    // Earth
    const earthRadius = 1.7;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x112244,
      emissive: 0x051122,
      specular: 0x222222,
      shininess: 15,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 0, 0);
    scene.add(earth);

    // Load Blue Marble texture
    textureLoader.load(
      'https://unpkg.com/three-globe@2.35.2/example/img/earth-blue-marble.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.color.set(0xffffff);
        earthMaterial.emissive.set(0x112233);
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load(
          'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
          (texture) => {
            earthMaterial.map = texture;
            earthMaterial.color.set(0xffffff);
            earthMaterial.emissive.set(0x000000);
            earthMaterial.needsUpdate = true;
          }
        );
      }
    );

    // Starfield
    const stars = createStarfield(scene);

    // Atmosphere (attach directly to earth so it shifts alongside it)
    createAtmosphere(earth, earthRadius);

    // City markers
    const { markers: pulseRings } = createCityMarkers(earth, earthRadius);

    // Initial earth rotation angle
    earth.rotation.y = -0.5;

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      earth,
      stars,
      pulseRings,
      animationId: 0,
      isZooming: false,
      controls,
    };

    // Animation loop
    let time = 0;
    function animate() {
      const id = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.animationId = id;
      }

      time += 0.01;

      // Update OrbitControls
      controls.update();

      // Slow rotation when not zooming and not dragging (if controls are idle, add slow rotation to camera or earth)
      if (!sceneRef.current?.isZooming) {
        // Slow auto-rotation of Earth
        earth.rotation.y += 0.0012;
      }

      // Pulse city dots from inside (breathing scale & opacity)
      pulseRings.forEach((dot, i) => {
        const scale = 1.0 + 0.22 * Math.sin(time * 3.5 + i * 0.8);
        dot.scale.set(scale, scale, scale);
        (dot.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.35 * Math.sin(time * 3.5 + i * 0.8);
      });

      stars.rotation.y += 0.00005;

      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    function handleResize() {
      if (!canvasContainerRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const isLargeScreen = window.innerWidth >= 1024;
      const xOffset = isLargeScreen ? -w * 0.22 : 0;
      camera.setViewOffset(w, h, xOffset, 0, w, h);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      controls.dispose();
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="globe-container relative">
      {/* Full screen canvas behind everything - allows stars to cover the entire page */}
      <div className="absolute inset-0 w-full h-full z-0" ref={canvasContainerRef} />

      {/* Scanline grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,255,0.03),rgba(16,185,129,0.01),rgba(0,0,255,0.04))] bg-[size:100%_4px,6px_100%] pointer-events-none z-10 opacity-30" />

      {/* Overlay text grid layout - placed in front of canvas */}
      <div className="w-full h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-8 relative z-20 pointer-events-none">
        
        {/* Left Column (5 cols) - Title & CTA (Enable pointer events only on interactive parts) */}
        <div ref={mainOverlayRef} className="lg:col-span-5 flex flex-col justify-center text-left py-12 pointer-events-auto">
          <div className="flex items-center gap-4 mb-6 flex-nowrap">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg shadow-cyan-900/10 bg-[#0A0F1E]">
              <img src="/logo.png" alt="ChargeSense Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none flex items-center gap-0 whitespace-nowrap">
              <span>CHARGE</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-20 w-20 md:h-24 md:w-24 text-cyan-400 fill-cyan-400 animate-pulse shrink-0 -mx-3.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>ENSE</span>
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">.AI</span>
            </h1>
          </div>

          <p className="text-sm md:text-base text-gray-400 mb-8 leading-relaxed max-w-md font-medium">
            Accelerating India's Net-Zero Transition. AI-driven operational intelligence for EV battery health, fleet procurement, and mineral supply chain vectors.
          </p>

          <div>
            <button
              onClick={handleZoomToIndia}
              id="explore-btn"
              className="cyber-btn px-8 py-4 text-sm font-bold uppercase tracking-widest cursor-pointer hover:shadow-emerald-500/20"
            >
              Explore India's Fleet
            </button>
          </div>

          {/* Subtext info */}
          <div className="mt-12 pt-6 border-t border-white/5 font-mono text-[0.6rem] text-gray-500 tracking-widest uppercase flex gap-6">
            <span>🔋 MODEL: NASA LI-ION</span>
            <span>📍 PING: 18MS</span>
          </div>
        </div>

        {/* Right side is visually covered by the shifted Earth canvas, so we keep this column empty in layout */}
        <div className="hidden lg:block lg:col-span-7" />
      </div>
    </div>
  );
}
