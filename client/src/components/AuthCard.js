import React from 'react';

function AuthCard({ title, children, bottomContent }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 animate-fade-in-scale">
        {title && <h2 className="text-2xl font-semibold text-center mb-6">{title}</h2>}
        {children}
        {bottomContent && (
          <div className="mt-6 text-center">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCard;