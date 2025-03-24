'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface BloodTestItem {
  value: number;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  position: { x: number; y: number; z: number };
  description: string;
}

interface BloodTestData {
  [key: string]: BloodTestItem;
}

interface AnatomyViewerProps {
  bloodTestData: BloodTestData;
}

const AnatomyViewer: React.FC<AnatomyViewerProps> = ({ bloodTestData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  // These refs will persist across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const labelsRef = useRef<{[key: string]: { element: HTMLDivElement, position: THREE.Vector3, worldPosition: THREE.Vector3 }}>({});
  const animationFrameRef = useRef<number | null>(null);
  const markersRef = useRef<THREE.Object3D[]>([]);

  // Improved test positions to attach directly to the model
  const getOptimizedPositions = (originalData: BloodTestData): BloodTestData => {
    const optimized = { ...originalData };
    
    // Adjust positions for specific tests to better match human anatomy
    // These positions will be used relative to the model's coordinate system
    if (optimized.hemoglobin) {
      // Position in chest/heart area (central, upper torso)
      optimized.hemoglobin.position = { x: 0, y: 0.35, z: 0.2 };
    }
    
    if (optimized.whiteBloodCells) {
      // Position in bone marrow area (lower spine)
      optimized.whiteBloodCells.position = { x: 0, y: -0.1, z: 0.05 };
    }
    
    if (optimized.platelets) {
      // Position in spleen area (left side, under ribs)
      optimized.platelets.position = { x: -0.25, y: 0.1, z: 0.1 };
    }
    
    if (optimized.cholesterol) {
      // Position in liver area (right side, under ribs)
      optimized.cholesterol.position = { x: 0.3, y: 0.15, z: 0.1 };
    }
    
    if (optimized.glucose) {
      // Position in pancreas area (central, below stomach)
      optimized.glucose.position = { x: 0, y: 0, z: 0.15 };
    }
    
    return optimized;
  };

  // Create labels for blood test data with better positioning
  const createLabels = (data: BloodTestData, modelHeight: number) => {
    if (!labelsContainerRef.current || !sceneRef.current || !modelRef.current) return;
    
    // Clear previous labels
    while (labelsContainerRef.current.firstChild) {
      labelsContainerRef.current.removeChild(labelsContainerRef.current.firstChild);
    }
    
    // Remove previous markers
    markersRef.current.forEach(marker => {
      if (sceneRef.current) sceneRef.current.remove(marker);
    });
    markersRef.current = [];
    
    // Get model world matrix for proper positioning
    const modelWorldMatrix = new THREE.Matrix4();
    modelRef.current.updateMatrixWorld();
    modelWorldMatrix.copy(modelRef.current.matrixWorld);
    
    // Use optimized positions
    const optimizedData = getOptimizedPositions(data);
    
    // Create new labels and markers
    Object.entries(optimizedData).forEach(([testName, testData]) => {
      // Create HTML label
      const label = document.createElement('div');
      label.className = `anatomy-label status-${testData.status}`;
      label.innerHTML = `
        <div class="label-content">
          <h4>${formatTestName(testName)}</h4>
          <p>${testData.value} ${testData.unit}</p>
          <p>Normal: ${testData.normalRange}</p>
          <p class="label-description">${testData.description}</p>
        </div>
      `;
      
      // Add click handler to highlight corresponding part
      label.addEventListener('click', () => {
        setSelectedTest(testName === selectedTest ? null : testName);
      });
      
      labelsContainerRef.current?.appendChild(label);
      
      // Create position in 3D space relative to the model
      const localPosition = new THREE.Vector3(
        testData.position.x,
        testData.position.y,
        testData.position.z
      );
      
      // Create a dummy object to transform the position to world space
      const positionHelper = new THREE.Object3D();
      positionHelper.position.copy(localPosition);
      modelRef.current.add(positionHelper);
      positionHelper.updateMatrixWorld(true);
      
      // Get the world position
      const worldPosition = new THREE.Vector3();
      worldPosition.setFromMatrixPosition(positionHelper.matrixWorld);
      
      // Remove helper
      modelRef.current.remove(positionHelper);
      
      // Store reference to label and its positions
      labelsRef.current[testName] = {
        element: label,
        position: localPosition, // Local position
        worldPosition: worldPosition // World position
      };
      
      // Create marker in 3D space with better visibility
      const markerGeometry = new THREE.SphereGeometry(0.035, 16, 16); // Slightly smaller
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: getStatusColor(testData.status),
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(worldPosition);
      
      // Add pulsing effect with glow
      const glowGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Slightly smaller
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: getStatusColor(testData.status),
        transparent: true,
        opacity: 0.4
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(worldPosition);
      
      // Add to scene and store reference
      sceneRef.current?.add(marker);
      sceneRef.current?.add(glow);
      markersRef.current.push(marker);
      markersRef.current.push(glow);
      
      // Add connector line from marker to model center
      const lineStart = worldPosition.clone();
      const lineEnd = new THREE.Vector3(
        worldPosition.x * 0.8, 
        worldPosition.y * 0.8, 
        worldPosition.z * 0.8
      );
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([lineStart, lineEnd]);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: getStatusColor(testData.status),
        transparent: true,
        opacity: 0.7
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      sceneRef.current?.add(line);
      markersRef.current.push(line);
    });
  };
  
  // Format test name to be more readable
  const formatTestName = (name: string): string => {
    // Convert camelCase to separate words and capitalize first letter
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };
  
  // Get color based on status
  const getStatusColor = (status: 'normal' | 'high' | 'low'): number => {
    switch (status) {
      case 'high': return 0xff0000; // Red
      case 'low': return 0x0066ff;  // Blue
      case 'normal': return 0x00cc00; // Green
      default: return 0xffffff; // White
    }
  };
  
  // Update label positions based on 3D model position with better positioning
  const updateLabels = () => {
    if (!cameraRef.current || !rendererRef.current || !containerRef.current || !modelRef.current) return;
    
    const camera = cameraRef.current;
    
    // Update model world matrix
    modelRef.current.updateMatrixWorld(true);
    
    // Store all label positions to avoid overlapping
    const usedPositions: {x: number, y: number, width: number, height: number}[] = [];
    
    Object.entries(labelsRef.current).forEach(([testName, labelData]) => {
      const { element, worldPosition } = labelData;
      
      // Check if the marker is in front of the camera
      const isBehindCamera = worldPosition.clone().sub(camera.position).normalize().dot(camera.getWorldDirection(new THREE.Vector3())) < 0;
      
      // Convert world position to screen coordinates
      const vector = worldPosition.clone();
      vector.project(camera);
      
      // Convert to CSS coordinates
      const x = (vector.x * 0.5 + 0.5) * containerRef.current.clientWidth;
      const y = (-(vector.y * 0.5) + 0.5) * containerRef.current.clientHeight;
      
      // Calculate offset dynamically to avoid overlapping
      // Base offset
      let offsetX = 0;
      let offsetY = 0;
      
      // Get element dimensions
      const elementWidth = element.offsetWidth || 180; // Fallback width if not rendered yet
      const elementHeight = element.offsetHeight || 100; // Fallback height
      
      // Determine quadrant and adjust accordingly
      if (vector.x > 0) {
        offsetX = 20; // Right side of marker
      } else {
        offsetX = -20 - elementWidth; // Left side of marker
      }
      
      if (vector.y > 0) {
        offsetY = -elementHeight / 2; // Above center
      } else {
        offsetY = -elementHeight / 2; // Below center
      }
      
      // Check for overlaps with existing labels
      const labelRect = {
        x: x + offsetX,
        y: y + offsetY,
        width: elementWidth,
        height: elementHeight
      };
      
      // Adjust position to avoid overlaps
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loops
      
      while (
        attempts < maxAttempts && 
        usedPositions.some(pos => 
          labelRect.x < pos.x + pos.width &&
          labelRect.x + labelRect.width > pos.x &&
          labelRect.y < pos.y + pos.height &&
          labelRect.y + labelRect.height > pos.y
        )
      ) {
        // Try different offsets
        offsetY += (attempts % 2 === 0) ? 20 : -40;
        offsetX += (attempts % 2 === 0) ? 20 : -20;
        
        labelRect.x = x + offsetX;
        labelRect.y = y + offsetY;
        
        attempts++;
      }
      
      // Store the final position
      usedPositions.push(labelRect);
      
      // Update label position with calculated offset
      element.style.transform = `translate(${x + offsetX}px, ${y + offsetY}px)`;
      
      // Hide label if it's behind the camera or outside view
      if (isBehindCamera || vector.z > 1 || 
          x + offsetX < -elementWidth || 
          x + offsetX > containerRef.current.clientWidth + elementWidth || 
          y + offsetY < -elementHeight || 
          y + offsetY > containerRef.current.clientHeight + elementHeight) {
        element.style.display = 'none';
      } else {
        element.style.display = 'block';
        
        // Highlight selected test
        if (selectedTest === testName) {
          element.classList.add('selected');
          // Grow the marker
          markersRef.current.forEach((marker, index) => {
            if (marker instanceof THREE.Mesh && 
                marker.position.equals(worldPosition) && 
                index % 3 === 0) {
              marker.scale.set(1.7, 1.7, 1.7); // Slightly smaller highlight
            }
          });
        } else {
          element.classList.remove('selected');
          // Reset marker size
          markersRef.current.forEach((marker, index) => {
            if (marker instanceof THREE.Mesh && 
                marker.position.equals(worldPosition) && 
                index % 3 === 0) {
              marker.scale.set(1, 1, 1);
            }
          });
        }
      }
    });
    
    // Animate glow markers (every second sphere)
    markersRef.current.forEach((marker, index) => {
      if (marker instanceof THREE.Mesh && index % 3 === 1) {
        const scale = 1 + 0.2 * Math.sin(Date.now() * 0.003); // Smaller animation
        marker.scale.set(scale, scale, scale);
      }
    });
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    try {
      // Clean up existing scene if any
      if (rendererRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Create new scene with darker background for better contrast
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x282828); // Darker background
      sceneRef.current = scene;
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        60, 
        containerRef.current.clientWidth / containerRef.current.clientHeight, 
        0.1, 
        1000
      );
      camera.position.z = 2;
      cameraRef.current = camera;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true
      });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Add lights
      const topLight = new THREE.DirectionalLight(0xffffff, 3);
      topLight.position.set(1, 1, 1);
      topLight.castShadow = true;
      scene.add(topLight);
      
      const frontLight = new THREE.DirectionalLight(0xffffff, 2);
      frontLight.position.set(0, 0, 1);
      scene.add(frontLight);
      
      const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
      backLight.position.set(0, 0, -1);
      scene.add(backLight);
      
      const ambientLight = new THREE.AmbientLight(0xcccccc, 2.5);
      scene.add(ambientLight);
      
      // Add controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.rotateSpeed = 0.5;
      controls.minDistance = 1;
      controls.maxDistance = 4;
      controlsRef.current = controls;
      
      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Load the 3D model
      const loader = new GLTFLoader();
      loader.load(
        '/assests/human_antomy/scene.gltf', // Make sure this path is correct
        (gltf) => {
          const model = gltf.scene;
          modelRef.current = model;
          
          // Scale model appropriately
          model.scale.set(1, 1, 1);
          
          // Calculate bounding box to center the model
          const bbox = new THREE.Box3().setFromObject(model);
          const center = bbox.getCenter(new THREE.Vector3());
          const size = bbox.getSize(new THREE.Vector3());
          
          // Center the model
          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;
          
          // Set initial rotation to face forward
          model.rotation.y = Math.PI; // Rotate 180 degrees
          
          // Apply a lighter material color to the model for better contrast with dark background
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.color) {
                    // Lighten the model color for better visibility
                    mat.color.offsetHSL(0, 0, 0.2);
                  }
                });
              } else if (child.material.color) {
                // Lighten the model color for better visibility
                child.material.color.offsetHSL(0, 0, 0.2);
              }
            }
          });
          
          scene.add(model);
          
          // Calculate camera distance
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
          cameraZ *= 1.5; // Add padding
          
          // Update camera and controls
          camera.position.set(0, 0, cameraZ);
          camera.lookAt(0, 0, 0);
          controls.target.set(0, 0, 0);
          controls.update();
          
          setIsLoaded(true);
          
          // Create labels for blood test data after model is loaded
          createLabels(bloodTestData, size.y);
        },
        (progress) => {
          // Loading progress
          console.log(`Loading model: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        (err) => {
          console.error('Error loading model:', err);
          setError('Failed to load 3D model. Please check the model path and try again.');
        }
      );
      
      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        updateLabels();
        
        // Render scene
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      animate();
      
      // Cleanup function
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        window.removeEventListener('resize', handleResize);
        
        if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        // Dispose of Three.js resources
        if (markersRef.current) {
          markersRef.current.forEach(marker => {
            if (marker instanceof THREE.Mesh) {
              if (marker.geometry) marker.geometry.dispose();
              if (marker.material) {
                if (Array.isArray(marker.material)) {
                  marker.material.forEach((material: THREE.Material) => material.dispose());
                } else {
                  marker.material.dispose();
                }
              }
            }
          });
        }
        
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    } catch (err) {
      console.error('Error initializing 3D scene:', err);
      setError('Failed to initialize 3D viewer. Please try refreshing the page.');
    }
  }, [bloodTestData]);

  // Effect to update positions when selected test changes
  useEffect(() => {
    updateLabels();
  }, [selectedTest]);

  return (
    <div className="anatomy-viewer-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      
      <div 
        ref={labelsContainerRef} 
        className="labels-container" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          zIndex: 10
        }}
      ></div>
      
      {!isLoaded && !error && (
        <div className="loading-indicator" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          Loading 3D model...
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      <div className="legend" style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#ff0000', 
            borderRadius: '50%',
            marginRight: '8px',
            boxShadow: '0 0 8px rgba(255,0,0,0.8)'
          }}></span>
          <span>High</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#0066ff', 
            borderRadius: '50%',
            marginRight: '8px',
            boxShadow: '0 0 8px rgba(0,102,255,0.8)'
          }}></span>
          <span>Low</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#00cc00', 
            borderRadius: '50%',
            marginRight: '8px',
            boxShadow: '0 0 8px rgba(0,204,0,0.8)'
          }}></span>
          <span>Normal</span>
        </div>
      </div>
      
      <style jsx>{`
        .anatomy-label {
          position: absolute;
          pointer-events: auto;
          cursor: pointer;
          transform-origin: left center;
          user-select: none;
          transition: transform 0.2s;
          z-index: 50;
        }
        
        .label-content {
          background-color: rgba(30, 30, 30, 0.85);
          color: white;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          max-width: 180px;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .anatomy-label:hover .label-content,
        .anatomy-label.selected .label-content {
          transform: scale(1.05);
          z-index: 100;
          box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 15px rgba(255,255,255,0.2);
        }
        
        .label-description {
          display: none;
          margin-top: 6px;
          font-size: 11px;
          line-height: 1.4;
          color: #e0e0e0;
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 6px;
        }
        
        .anatomy-label.selected .label-description {
          display: block;
        }
        
        .status-high .label-content {
          border-left: 3px solid #ff0000;
          box-shadow: 0 4px 15px rgba(255,0,0,0.3), 0 0 5px rgba(255,0,0,0.2);
        }
        
        .status-low .label-content {
          border-left: 3px solid #0066ff;
          box-shadow: 0 4px 15px rgba(0,102,255,0.3), 0 0 5px rgba(0,102,255,0.2);
        }
        
        .status-normal .label-content {
          border-left: 3px solid #00cc00;
          box-shadow: 0 4px 15px rgba(0,204,0,0.3), 0 0 5px rgba(0,204,0,0.2);
        }
        
        .anatomy-label h4 {
          margin: 0 0 6px 0;
          font-size: 13px;
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        
        .anatomy-label p {
          margin: 0 0 4px 0;
          color: #f0f0f0;
          font-size: 11px;
        }
        
        /* Connecting lines for better visibility */
        .label-content::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
        }
        
        /* Custom connector line for each status */
        .status-high .label-content::before {
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: 6px solid rgba(255,0,0,0.8);
          left: -6px;
          top: calc(50% - 6px);
        }
        
        .status-low .label-content::before {
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: 6px solid rgba(0,102,255,0.8);
          left: -6px;
          top: calc(50% - 6px);
        }
        
        .status-normal .label-content::before {
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: 6px solid rgba(0,204,0,0.8);
          left: -6px;
          top: calc(50% - 6px);
        }
      `}</style>
    </div>
  );
};

export default AnatomyViewer;