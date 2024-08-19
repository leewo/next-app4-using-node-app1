import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
      className="inline-block mr-2"
    >
      <rect width="100" height="100" fill="#4F46E5" rx="20" />
      <path
        d="M20 80 L50 20 L80 80 Z"
        fill="none"
        stroke="white"
        strokeWidth="8"
      />
      <text
        x="50"
        y="65"
        fontFamily="Arial, sans-serif"
        fontSize="36"
        fill="white"
        textAnchor="middle"
      >
        RE
      </text>
    </svg>
  );
};

export default Logo;
