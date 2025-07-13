import * as THREE from 'three';
import { PolarField, SpectrogramData } from './polarField';

export class PolarThreeSetup {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private polarField: PolarField;
  private fieldGeometry: THREE.BufferGeometry;
  private fieldMaterial: THREE.MeshPhongMaterial;
  private fieldMesh: THREE.Mesh;
  private gridLines: THREE.LineSegments;
  private animationId: number | null = null;
  private spectrogramData: Map<number, SpectrogramData> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.polarField = new PolarField();
    this.init(canvas);
  }

  private init(canvas: HTMLCanvasElement): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera setup - positioned for portrait mobile view
    const container = canvas.parentElement!;
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    
    const dimensions = this.polarField.getFieldDimensions();
    
    // Position camera closer for zoomed in view
    this.camera.position.set(0, dimensions.maxRadius * 0.4, -dimensions.maxRadius * 0.3);
    this.camera.lookAt(0, 0, dimensions.maxRadius * 0.5); // Look at middle of field

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create field geometry and grid
    this.createPolarFieldGeometry();
    this.createGridLines();
    this.setupLighting();

    // Start animation loop
    this.animate();
  }

  private createPolarFieldGeometry(): void {
    const dimensions = this.polarField.getFieldDimensions();
    
    // Create geometry for the polar field surface
    const radialSegments = 50;
    const angularSegments = 100;
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    
    // Generate vertices in polar pattern
    for (let r = 0; r <= radialSegments; r++) {
      const radius = r / radialSegments;
      
      for (let a = 0; a <= angularSegments; a++) {
        const angle = (a / angularSegments) * dimensions.totalAngleSpan - dimensions.halfAngleSpan;
        
        const cartesian = this.polarField.polarToCartesian({ radius, angle });
        vertices.push(cartesian.x, cartesian.y, cartesian.z);
        
        // Simple neutral color scheme
        const gray = 0.2;
        colors.push(gray, gray, gray);
      }
    }
    
    // Generate indices for triangles
    for (let r = 0; r < radialSegments; r++) {
      for (let a = 0; a < angularSegments; a++) {
        const i1 = r * (angularSegments + 1) + a;
        const i2 = (r + 1) * (angularSegments + 1) + a;
        const i3 = (r + 1) * (angularSegments + 1) + (a + 1);
        const i4 = r * (angularSegments + 1) + (a + 1);
        
        // Two triangles per quad
        indices.push(i1, i2, i3);
        indices.push(i1, i3, i4);
      }
    }
    
    // Create geometry
    this.fieldGeometry = new THREE.BufferGeometry();
    this.fieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.fieldGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.fieldGeometry.setIndex(indices);
    this.fieldGeometry.computeVertexNormals();
    
    // Create material
    this.fieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      shininess: 30
    });
    
    // Create mesh
    this.fieldMesh = new THREE.Mesh(this.fieldGeometry, this.fieldMaterial);
    this.fieldMesh.position.y = -dimensions.maxRadius * 0.3; // Position in lower third of screen
    this.scene.add(this.fieldMesh);
  }

  private createGridLines(): void {
    const gridPoints: number[] = [];
    const dimensions = this.polarField.getFieldDimensions();
    
    // Concentric arcs
    const arcCount = 10;
    const arcDetail = 50;
    
    for (let r = 1; r <= arcCount; r++) {
      const radius = r / arcCount;
      
      for (let a = 0; a < arcDetail; a++) {
        const angle1 = (a / arcDetail) * dimensions.totalAngleSpan - dimensions.halfAngleSpan;
        const angle2 = ((a + 1) / arcDetail) * dimensions.totalAngleSpan - dimensions.halfAngleSpan;
        
        const pos1 = this.polarField.polarToCartesian({ radius, angle: angle1 });
        const pos2 = this.polarField.polarToCartesian({ radius, angle: angle2 });
        
        gridPoints.push(pos1.x, pos1.y, pos1.z);
        gridPoints.push(pos2.x, pos2.y, pos2.z);
      }
    }
    
    // Radial lines
    const radialCount = 20;
    const radialDetail = 30;
    
    for (let a = 0; a <= radialCount; a++) {
      const angle = (a / radialCount) * dimensions.totalAngleSpan - dimensions.halfAngleSpan;
      
      for (let r = 0; r < radialDetail; r++) {
        const radius1 = r / radialDetail;
        const radius2 = (r + 1) / radialDetail;
        
        const pos1 = this.polarField.polarToCartesian({ radius: radius1, angle });
        const pos2 = this.polarField.polarToCartesian({ radius: radius2, angle });
        
        gridPoints.push(pos1.x, pos1.y, pos1.z);
        gridPoints.push(pos2.x, pos2.y, pos2.z);
      }
    }
    
    // Create grid lines
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x404040,
      transparent: true,
      opacity: 0.6
    });
    
    this.gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.gridLines.position.y = -dimensions.maxRadius * 0.3; // Match field position
    this.scene.add(this.gridLines);
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Point light for highlights
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  public addSpectrogram(timeIndex: number, frequencyBins: number[]): void {
    const spectrogramData: SpectrogramData = {
      timeIndex,
      frequencyBins: [...frequencyBins] // Copy array
    };
    
    this.spectrogramData.set(timeIndex, spectrogramData);
    this.updateFieldGeometry();
  }

  private updateFieldGeometry(): void {
    const positions = this.fieldGeometry.attributes.position.array as Float32Array;
    const dimensions = this.polarField.getFieldDimensions();
    
    // Reset all heights to 0
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] = 0;
    }
    
    // Apply spectrogram data
    this.spectrogramData.forEach((spectrogram) => {
      const bilateralPoints = this.polarField.createBilateralSpectrogram(spectrogram);
      
      // Apply heights to nearest vertices
      bilateralPoints.forEach((point) => {
        // Find nearest vertex and update its height
        // This is a simplified approach - in production, you'd want proper interpolation
        const nearestIndex = this.findNearestVertexIndex(point.x, point.z);
        if (nearestIndex >= 0) {
          positions[nearestIndex * 3 + 1] = Math.max(positions[nearestIndex * 3 + 1], point.y);
        }
      });
    });
    
    this.fieldGeometry.attributes.position.needsUpdate = true;
    this.fieldGeometry.computeVertexNormals();
  }

  private findNearestVertexIndex(x: number, z: number): number {
    const positions = this.fieldGeometry.attributes.position.array as Float32Array;
    let minDistance = Infinity;
    let nearestIndex = -1;
    
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - x;
      const dz = positions[i + 2] - z;
      const distance = dx * dx + dz * dz;
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i / 3;
      }
    }
    
    return nearestIndex;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // No rotation - keep field stationary
    
    this.renderer.render(this.scene, this.camera);
  };

  public handleResize(): void {
    const container = this.renderer.domElement.parentElement!;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.fieldGeometry.dispose();
    this.fieldMaterial.dispose();
    this.renderer.dispose();
  }
}