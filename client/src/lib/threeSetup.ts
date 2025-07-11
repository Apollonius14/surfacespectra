import * as THREE from 'three';
import { WaveEngine } from './waveEngine';

export class ThreeJSSetup {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;
  private waveEngine: WaveEngine;
  private animationId: number | null = null;

  private readonly params = {
    arcSpan: Math.PI / 3, // 60 degrees
    maxRadius: 10,
    segments: 128,
  };

  constructor(canvas: HTMLCanvasElement, waveEngine: WaveEngine) {
    this.waveEngine = waveEngine;
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.geometry = new THREE.PlaneGeometry();
    this.material = new THREE.MeshPhongMaterial();
    this.mesh = new THREE.Mesh();
    
    this.init(canvas);
  }

  private init(canvas: HTMLCanvasElement): void {
    const container = canvas.parentElement!;
    
    // Scene setup
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, -12);
    this.camera.lookAt(0, 0, 5);
    
    // Renderer setup
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create geometry and material
    this.createArcGeometry();
    this.setupLighting();
    
    // Start animation
    this.animate();
  }

  private createArcGeometry(): void {
    const segments = this.params.segments;
    
    // Create plane geometry for wedge shape
    this.geometry = new THREE.PlaneGeometry(
      this.params.maxRadius * 2,
      this.params.maxRadius * 2,
      segments,
      segments
    );
    
    // Transform to create wedge shape with proper orientation
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Convert x,y to radius and angle for wedge shape
      const radius = Math.sqrt(x * x + y * y);
      const angle = Math.atan2(y, x);
      
      // Hide vertices outside arc span or beyond radius
      if (Math.abs(angle) > this.params.arcSpan / 2 || radius > this.params.maxRadius || radius < 0.5) {
        positions[i] = 0;     // X
        positions[i + 1] = 0; // Y (height)
        positions[i + 2] = -100; // Z (hide by moving far back)
        colors[i] = 0.0;     // R
        colors[i + 1] = 0.0; // G
        colors[i + 2] = 0.0; // B
      } else {
        // Map to wedge coordinates: angle becomes X, radius becomes Z
        const normalizedAngle = angle / (this.params.arcSpan / 2); // -1 to 1
        positions[i] = normalizedAngle * this.params.maxRadius; // X position based on angle
        positions[i + 1] = 0; // Y height (flat initially)
        positions[i + 2] = radius; // Z position based on radius
        
        // Set color based on frequency (angle position)
        const normalizedFreq = (angle + this.params.arcSpan / 2) / this.params.arcSpan;
        colors[i] = 1.0 - normalizedFreq * 0.8;     // R (high at low freq)
        colors[i + 1] = Math.sin(normalizedFreq * Math.PI) * 0.8; // G (peak at mid freq)
        colors[i + 2] = normalizedFreq * 0.8;     // B (high at high freq)
      }
    }
    
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Material setup - very thin base surface
    this.material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      shininess: 30,
      wireframe: false
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    
    // Add subtle wireframe grid
    const wireframeGeometry = this.geometry.clone();
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333, 
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    this.scene.add(wireframeMesh);
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light from above
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Additional side light
    const sideLight = new THREE.DirectionalLight(0x00bcd4, 0.6);
    sideLight.position.set(10, 10, 0);
    this.scene.add(sideLight);
    
    // Additional accent light
    const accentLight = new THREE.PointLight(0x00bcd4, 0.4, 30);
    accentLight.position.set(0, 8, 0);
    this.scene.add(accentLight);
  }

  private updateGeometry(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      
      // Skip hidden vertices
      if (z === -100) continue;
      
      const height = this.waveEngine.calculateHeightAtPosition(x, z);
      positions[i + 1] = height;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private animate = (): void => {
    this.waveEngine.updateTime(0.05);
    this.updateGeometry();
    
    // Keep camera fixed - no rotation
    this.camera.position.set(0, 8, -12);
    this.camera.lookAt(0, 0, 5);
    
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  public handleResize(): void {
    const canvas = this.renderer.domElement;
    const container = canvas.parentElement!;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
