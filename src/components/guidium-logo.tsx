import React from 'react';
import Image from 'next/image';

export const GuidiumLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/guidium-logo.png"
        alt="Guidium Logo"
        width={64}
        height={64}
        className="w-16 h-16"
      />
      <span className="text-2xl font-bold text-[#264653]" style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span>
    </div>
  );
}; 