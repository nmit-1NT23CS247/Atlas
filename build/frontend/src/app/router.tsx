import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.tsx';
import { OverviewPage } from '../features/overview/OverviewPage.tsx';
import { BuildsPage } from '../features/builds/BuildsPage.tsx';
import { StablePage } from '../features/stable/StablePage.tsx';
import { ReleasesPage } from '../features/releases/ReleasesPage.tsx';
import { ActivityPage } from '../features/activity/ActivityPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'builds',
        element: <BuildsPage />,
      },
      {
        path: 'stable',
        element: <StablePage />,
      },
      {
        path: 'releases',
        element: <ReleasesPage />,
      },
      {
        path: 'activity',
        element: <ActivityPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
