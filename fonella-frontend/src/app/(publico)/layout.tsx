import React from 'react';

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {children}
    </div>
  );
}