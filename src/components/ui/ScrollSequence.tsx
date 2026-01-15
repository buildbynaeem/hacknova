import React, { useEffect, useRef, useState } from 'react';
import { useScroll, motion, useMotionValueEvent } from 'framer-motion';

interface ScrollSequenceProps {
  frameCount: number;
  basePath: string;
  filenamePrefix: string;
  filenameSuffix: string;
  digits?: number; // for padding, e.g. 3 for 001
  height?: string; // height of the scroll container
  width?: string;
  className?: string;
  children?: React.ReactNode;
}

const ScrollSequence: React.FC<ScrollSequenceProps> = ({
  frameCount,
  basePath,
  filenamePrefix,
  filenameSuffix,
  digits = 3,
  height = "300vh", // Default to a tall container to allow scrolling
  width = "100%",
  className = "",
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    // Create a promise-based loader to ensure order
    const loadImages = async () => {
      const promises = [];
      for (let i = 1; i <= frameCount; i++) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          const paddedIndex = String(i).padStart(digits, '0');
          img.src = `${basePath}/${filenamePrefix}${paddedIndex}${filenameSuffix}`;
          
          img.onload = () => {
            loadedCount++;
            setLoadProgress((loadedCount / frameCount) * 100);
            resolve(img);
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${img.src}`);
            // Resolve anyway to not break the sequence, maybe with a placeholder or previous image
            resolve(img); 
          };
        });
        promises.push(promise);
      }

      const loadedImages = await Promise.all(promises);
      setImages(loadedImages);
      setIsLoaded(true);
    };

    loadImages();
  }, [frameCount, basePath, filenamePrefix, filenameSuffix, digits]);

  // Draw frame
  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = images[index];

    if (canvas && ctx && img && img.complete && img.naturalHeight !== 0) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate aspect ratio to cover/contain
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio); // Cover
      
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;  

      ctx.drawImage(
        img, 
        0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
      );
    }
  };

  // Update on scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isLoaded || images.length === 0) return;
    
    const frameIndex = Math.min(
      frameCount - 1,
      Math.floor(latest * frameCount)
    );
    
    requestAnimationFrame(() => renderFrame(frameIndex));
  });

  // Initial render and resize handling
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || images.length === 0) return;

    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        // Set canvas size to match window or container
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        
        // Re-render current frame (or first frame)
        const currentProgress = scrollYProgress.get();
        const frameIndex = Math.min(
          frameCount - 1,
          Math.floor(currentProgress * frameCount)
        );
        renderFrame(frameIndex);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded, images]);

  return (
    <div 
      ref={containerRef} 
      style={{ height }} 
      className={`relative w-full bg-black ${className}`}
    >
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-50 bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="loader"></div>
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">
                Loading Experience {Math.round(loadProgress)}%
              </span>
            </div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Content */}
        {children && (
          <div className="absolute inset-0 z-20">
             {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollSequence;
