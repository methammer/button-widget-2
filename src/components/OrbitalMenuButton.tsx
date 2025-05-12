import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Menu, X, Home, Settings, User, Mail } from 'lucide-react';
import { useOrbitalMenu } from '../hooks/useOrbitalMenu';

// --- Configuration ---
const MENU_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'contact', icon: Mail, label: 'Contact' },
  // Add more items as needed
];
const BUTTON_SIZE = 60; // Diameter of the central button in pixels
const ITEM_SIZE = 40; // Diameter of the menu items in pixels
const RADIUS = 100; // Distance from button center to item center
const START_ANGLE = -Math.PI / 2 - Math.PI / 4; // Start angle (top-left) in radians
const SWEEP_ANGLE = Math.PI * 1.5; // Arc sweep (e.g., 270 degrees) in radians
const BOUNDARY_PADDING = 10; // Minimum space from viewport edge

// --- Component ---
export const OrbitalMenuButton: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    isDragging,
    buttonPosition,
    itemPositions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
    toggleMenu, // Expose toggleMenu directly if needed elsewhere
  } = useOrbitalMenu({
    buttonRef,
    menuRef,
    itemCount: MENU_ITEMS.length,
    radius: RADIUS,
    startAngle: START_ANGLE,
    sweepAngle: SWEEP_ANGLE,
    buttonSize: BUTTON_SIZE,
    itemSize: ITEM_SIZE,
    boundaryPadding: BOUNDARY_PADDING,
  });

  // Effect to handle clicks outside the component to close the menu
  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        // Only close if the click is truly outside button AND menu items
        toggleMenu(false); // Explicitly close
      }
    };

    // Use pointerdown for consistency and to catch interaction start
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isOpen, toggleMenu]); // Dependency on isOpen and toggleMenu

  // Effect to attach global move/up listeners during drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp); // Handle cancellations
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <>
      {/* Central Button */}
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick} // Use click for accessibility and simple toggles
        className={`fixed z-50 rounded-full shadow-lg flex items-center justify-center cursor-grab transition-colors duration-200 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        style={{
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          left: `${buttonPosition.x - BUTTON_SIZE / 2}px`, // Position center
          top: `${buttonPosition.y - BUTTON_SIZE / 2}px`, // Position center
          touchAction: 'none', // Crucial for preventing default touch actions like scrolling
        }}
        aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={32} /> : <Menu size={32} />}
      </button>

      {/* Menu Items Container (for outside click detection) */}
      <div
        ref={menuRef}
        className="fixed inset-0 z-40 pointer-events-none" // Covers screen but only items are interactive
        style={{
            // This container doesn't move, only its children
        }}
      >
        {/* Individual Menu Items */}
        {itemPositions.map((pos, index) => {
          const item = MENU_ITEMS[index];
          return (
            <div
              key={item.id}
              className={`absolute z-40 rounded-full bg-gray-700 hover:bg-gray-600 shadow-md flex items-center justify-center text-white transition-all duration-300 ease-out ${
                isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
              } pointer-events-auto cursor-pointer`} // Enable pointer events only for items
              style={{
                width: `${ITEM_SIZE}px`,
                height: `${ITEM_SIZE}px`,
                left: `${pos.x - ITEM_SIZE / 2}px`, // Position center
                top: `${pos.y - ITEM_SIZE / 2}px`, // Position center
                transformOrigin: 'center center',
                // Add a slight delay based on index for staggered animation
                transitionDelay: isOpen ? `${index * 0.03}s` : '0s',
              }}
              onClick={() => {
                console.log(`Clicked: ${item.label}`);
                toggleMenu(false); // Close menu on item click
              }}
              role="menuitem"
              aria-label={item.label}
            >
              <item.icon size={ITEM_SIZE * 0.5} />
            </div>
          );
        })}
      </div>
    </>
  );
};
