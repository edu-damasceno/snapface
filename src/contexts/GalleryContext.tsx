import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSessionGallery } from '../hooks/useSessionGallery';

type GalleryContextType = ReturnType<typeof useSessionGallery>;

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const useGallery = (): GalleryContextType => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};

export const GalleryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const gallery = useSessionGallery();

  return (
    <GalleryContext.Provider value={gallery}>
      {children}
    </GalleryContext.Provider>
  );
};
