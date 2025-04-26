import React from 'react';

function AuthCard({ title, children, bottomContent }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300 animate-fade-in-scale">
        {title && (
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-white">
            {title}
          </h2>
        )}
        {children}
        {bottomContent && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCard;