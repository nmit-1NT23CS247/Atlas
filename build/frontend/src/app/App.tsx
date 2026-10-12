import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.tsx';
import { DashboardProvider } from '../hooks/useDashboardContext.tsx';

export default function App() {
  return (
    <DashboardProvider>
      <RouterProvider router={router} />
    </DashboardProvider>
  );
}
