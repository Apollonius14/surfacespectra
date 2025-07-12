import * as THREE from 'three';
import { WaveEngine } from './waveEngine';
import { CoordinateTransform } from './coordinateTransform';

export class ThreeJSSetup {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshPhongMaterial;
  private mesh: THREE.Mesh;
  private waveEngine: WaveEngine;
  private coordinateTransform: CoordinateTransform;
  private animationId: number | null = null;

  private readonly params = {
    arcSpan: Math.PI / 3, // 60 degrees
    maxRadius: 20, // Doubled for twice as long
    segments: 128,
  };

  constructor(canvas: HTMLCanvasElement, waveEngine: WaveEngine) {
    this.waveEngine = waveEngine;
    this.coordinateTransform = new CoordinateTransform();
    
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
    // Position camera like low-flying aircraft - behind and above the mouth
    this.camera.position.set(0, this.params.maxRadius / 2, -this.params.maxRadius / 2);
    this.camera.lookAt(0, -this.params.maxRadius / 2, this.params.maxRadius / 2); // Look at wedge center
    
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
    
    // Create plane geometry that will be transformed
    this.geometry = new THREE.PlaneGeometry(
      2, // Normalized size
      4, // Doubled height for twice as long wedge
      segments,
      segments
    );
    
    // Transform plane coordinates to shell coordinates using coordinate transform
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];      // -1 to 1
      const y = positions[i + 1];  // -1 to 1
      
      // Convert plane coordinates to logical coordinates
      const frequency = (x + 1) / 2; // 0 to 1
      const time = (y + 2) / 4;      // 0 to 1 (accounting for doubled height: -2 to 2 -> 0 to 1)
      
      // Transform to display coordinates
      const displayCoords = this.coordinateTransform.logicalToDisplay({ frequency, time });
      
      // Apply transformation
      positions[i] = displayCoords.x;     // X
      positions[i + 1] = displayCoords.y; // Y (height)
      positions[i + 2] = displayCoords.z; // Z
      
      // Set color based on frequency
      colors[i] = 1.0 - frequency * 0.8;     // R (high at low freq)
      colors[i + 1] = Math.sin(frequency * Math.PI) * 0.8; // G (peak at mid freq)
      colors[i + 2] = frequency * 0.8;     // B (high at high freq)
    }
    
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Material setup - thin base surface
    this.material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      shininess: 30,
      wireframe: false
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.z = this.params.maxRadius / 2; // Move wedge down to canvas center
    this.mesh.position.y = -this.params.maxRadius / 2; // Move much closer to bottom of canvas
    this.scene.add(this.mesh);
    
    // Add wireframe grid to show shell structure
    const wireframeGeometry = this.geometry.clone();
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x444444, 
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframeMesh.position.z = this.params.maxRadius / 2; // Match main mesh position
    wireframeMesh.position.y = -this.params.maxRadius / 2; // Match main mesh position
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
      
      // Transform display coordinates back to logical coordinates for wave sampling
      const logical = this.coordinateTransform.displayToLogical({ x, y: 0, z });
      
      // Calculate wave height using logical coordinates
      const height = this.waveEngine.calculateHeightAtPosition(logical.frequency, logical.time);
      positions[i + 1] = height;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private animate = (): void => {
    this.waveEngine.updateTime(0.05);
    this.updateGeometry();
    
    // Keep camera fixed - no rotation
    this.camera.position.set(0, this.params.maxRadius / 2, -this.params.maxRadius / 2);
    this.camera.lookAt(0, -this.params.maxRadius / 2, this.params.maxRadius / 2);
    
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
