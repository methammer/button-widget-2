import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ItemPosition extends Position {
  angle: number; // Store angle for potential future use (e.g., rotation)
}

interface UseOrbitalMenuProps {
  buttonRef: React.RefObject<HTMLElement>;
  menuRef: React.RefObject<HTMLElement>; // Ref for the container of menu items
  itemCount: number;
  radius?: number;
  startAngle?: number; // In radians
  sweepAngle?: number; // In radians
  buttonSize?: number;
  itemSize?: number;
  boundaryPadding?: number; // Padding from viewport edges
  initialPosition?: Position; // Optional initial position
}

const DEFAULT_RADIUS = 100;
const DEFAULT_START_ANGLE = -Math.PI / 2; // Top
const DEFAULT_SWEEP_ANGLE = Math.PI * 2; // Full circle
const DEFAULT_BUTTON_SIZE = 50;
const DEFAULT_ITEM_SIZE = 40;
const DEFAULT_BOUNDARY_PADDING = 10;
const CLICK_THRESHOLD_MS = 200; // Max time for a click
const CLICK_THRESHOLD_PX = 5; // Max distance moved for a click

export const useOrbitalMenu = ({
  buttonRef,
  menuRef, // Include menuRef
  itemCount,
  radius = DEFAULT_RADIUS,
  startAngle = DEFAULT_START_ANGLE,
  sweepAngle = DEFAULT_SWEEP_ANGLE,
  buttonSize = DEFAULT_BUTTON_SIZE,
  itemSize = DEFAULT_ITEM_SIZE,
  boundaryPadding = DEFAULT_BOUNDARY_PADDING,
  initialPosition = { x: 100, y: window.innerHeight / 2 }, // Default initial position
}: UseOrbitalMenuProps) => {
  // State for menu visibility
  const [isOpen, setIsOpen] = useState(false);
  // State for button's center position
  const [buttonPosition, setButtonPosition] = useState<Position>(initialPosition);
  // State for calculated item positions
  const [itemPositions, setItemPositions] = useState<ItemPosition[]>([]);
  // State to track dragging status
  const [isDragging, setIsDragging] = useState(false);

  // Refs for drag internals
  const dragStartRef = useRef<Position | null>(null); // Pointer position at drag start
  const dragStartTimeRef = useRef<number>(0); // Timestamp of drag start
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 }); // Offset from button center to pointer down
  const animationFrameRef = useRef<number | null>(null); // For requestAnimationFrame

  // --- Core Logic ---

  // Function to calculate positions of menu items along the arc
  const calculateItemPositions = useCallback((cx: number, cy: number): ItemPosition[] => {
    const positions: ItemPosition[] = [];
    // Prevent division by zero if itemCount is 0 or 1
    const angleStep = itemCount > 1 ? sweepAngle / (itemCount - 1) : 0;

    for (let i = 0; i < itemCount; i++) {
      // For a single item, place it directly at the start angle
      const angle = startAngle + (itemCount === 1 ? 0 : i * angleStep);
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      positions.push({ x, y, angle });
    }
    return positions;
  }, [itemCount, radius, startAngle, sweepAngle]);

  // Update item positions whenever button position or open state changes
  useEffect(() => {
    if (isOpen) {
      setItemPositions(calculateItemPositions(buttonPosition.x, buttonPosition.y));
    } else {
      // Optionally reset positions or keep them calculated but hidden
       setItemPositions([]); // Clear positions when closed for clarity
       // Or: setItemPositions(calculateItemPositions(buttonPosition.x, buttonPosition.y));
    }
  }, [isOpen, buttonPosition, calculateItemPositions]);


  // --- Event Handlers ---

  const handlePointerDown = useCallback((event: React.PointerEvent | PointerEvent) => {
    // Prevent default only if it's the button itself to allow text selection etc. elsewhere
    if (event.target === buttonRef.current) {
       event.preventDefault(); // Prevent text selection during drag
       event.stopPropagation(); // Stop propagation to avoid outside click handler
    }

    // Ensure the target has setPointerCapture if available (for pointer events)
    if (buttonRef.current && typeof (event.target as HTMLElement).setPointerCapture === 'function') {
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
    }


    setIsDragging(true); // Assume drag starts, will be checked on pointerup
    dragStartTimeRef.current = Date.now();
    dragStartRef.current = { x: event.clientX, y: event.clientY };

    // Calculate offset from button *center* to pointer down position
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
        dragOffsetRef.current = {
            x: event.clientX - (rect.left + rect.width / 2),
            y: event.clientY - (rect.top + rect.height / 2),
        };
    } else {
         dragOffsetRef.current = { x: 0, y: 0 }; // Fallback
    }


  }, [buttonRef]); // Added buttonRef dependency

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    // Throttle updates using requestAnimationFrame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const currentX = event.clientX;
      const currentY = event.clientY;

      // Calculate the new desired center position
      let newX = currentX - dragOffsetRef.current.x;
      let newY = currentY - dragOffsetRef.current.y;

      // --- Basic Viewport Constraint (Button Center) ---
      const halfButton = buttonSize / 2;
      const minX = halfButton + boundaryPadding;
      const maxX = window.innerWidth - halfButton - boundaryPadding;
      const minY = halfButton + boundaryPadding;
      const maxY = window.innerHeight - halfButton - boundaryPadding;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
      // --- End Basic Viewport Constraint ---

      // *** Advanced Constraint Logic Placeholder ***
      // Here you would:
      // 1. Calculate potential item positions based on newX, newY.
      // 2. Get bounding boxes for each item.
      // 3. Check collisions with viewport edges.
      // 4. Check collisions with the button itself (using radius should suffice mostly).
      // 5. If collision:
      //    - Calculate adjustment vector (e.g., slide along arc away from edge).
      //    - Apply adjustment to item position.
      //    - Potentially adjust neighboring items or the radius/arc angles.
      //    - This might involve iterative adjustments or physics-based repulsion.
      // 6. Update the *actual* buttonPosition based on resolved constraints.
      // For now, we just update based on the clamped position:
      setButtonPosition({ x: newX, y: newY });
    });

  }, [isDragging, boundaryPadding, buttonSize]); // Added dependencies

  const handlePointerUp = useCallback((event: PointerEvent | React.PointerEvent) => {
    if (!isDragging) return; // Only handle if dragging was initiated

     // Ensure the target releases pointer capture if available
    if (buttonRef.current && typeof (event.target as HTMLElement).releasePointerCapture === 'function') {
        // Check if the pointerId exists before releasing
        if (event.pointerId) {
            try {
                 (event.target as HTMLElement).releasePointerCapture(event.pointerId);
            } catch (e) {
                // Ignore errors if capture was already lost (e.g., element removed)
                // console.warn("Could not release pointer capture:", e);
            }
        }
    }


    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const upTime = Date.now();
    const duration = upTime - dragStartTimeRef.current;
    const distanceMoved = dragStartRef.current
      ? Math.sqrt(
          Math.pow(event.clientX - dragStartRef.current.x, 2) +
          Math.pow(event.clientY - dragStartRef.current.y, 2)
        )
      : 0;

    // Determine if it was a click/tap or a drag
    if (duration < CLICK_THRESHOLD_MS && distanceMoved < CLICK_THRESHOLD_PX) {
      // It's a click/tap, handle toggle in handleClick
    } else {
      // It's a drag, position is already updated by pointerMove
      // Perform final constraint check here if not done in real-time
    }

    setIsDragging(false);
    dragStartRef.current = null; // Clear drag start position

  }, [isDragging, buttonRef]); // Added buttonRef dependency

  // Separate click handler for clarity and accessibility
  const handleClick = useCallback((event: React.MouseEvent) => {
      // Only toggle if it wasn't part of a drag sequence ending
      const upTime = Date.now();
      const duration = upTime - dragStartTimeRef.current;
      const distanceMoved = dragStartRef.current
          ? Math.sqrt(
              Math.pow(event.clientX - dragStartRef.current.x, 2) +
              Math.pow(event.clientY - dragStartRef.current.y, 2)
          )
          : 0;

      // Check click thresholds again, as pointerup might fire slightly after click
      if (duration < CLICK_THRESHOLD_MS && distanceMoved < CLICK_THRESHOLD_PX) {
          setIsOpen(prev => !prev);
      }
      // If it was a drag, isDragging would be false already from pointerup,
      // and we don't toggle here.

  }, []); // No dependencies needed here if logic relies on refs/state updated elsewhere


  // Exposed function to explicitly toggle menu state if needed
  const toggleMenu = useCallback((forceState?: boolean) => {
      setIsOpen(prev => typeof forceState === 'boolean' ? forceState : !prev);
  }, []);


  return {
    isOpen,
    isDragging,
    buttonPosition,
    itemPositions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
    toggleMenu, // Expose toggle function
  };
};
