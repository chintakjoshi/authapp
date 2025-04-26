import React from 'react';

function AnimatedPage({ children }) {
  return (
    <div className="animate-fade-in opacity-0 animate-[fade-in_0.4s_ease-out_forwards]">
      {children}
    </div>
  );
}

export default AnimatedPage;