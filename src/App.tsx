import React from 'react';
import { OrbitalMenuButton } from './components/OrbitalMenuButton'; // Import the component

function App() {
  return (
    // Ensure the container takes full viewport height and allows overflow if needed
    // Added relative positioning context if needed by absolutely positioned children,
    // though the button uses 'fixed' positioning.
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 overflow-hidden">
       {/* Optional background content */}
       <div className="absolute inset-0 flex items-center justify-center -z-10">
            <p className="text-gray-400 text-lg">Orbital Menu Demo</p>
       </div>

      {/* Render the Orbital Menu Button */}
      <OrbitalMenuButton />
    </div>
  );
}

export default App;
