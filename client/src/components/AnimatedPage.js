import React from 'react';

function AnimatedPage({ children }) {
  return (
    <div className="animate-[fade-in-scale_320ms_ease-out]">
      {children}
    </div>
  );
}

export default AnimatedPage;
