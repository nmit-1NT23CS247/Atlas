import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { OverviewPage } from '../features/dashboard/OverviewPage';
import { PipelinesPage } from '../features/pipelines/PipelinesPage';
import { PipelineDetailsPage } from '../features/pipelines/PipelineDetailsPage';
import { ProjectsPage } from '../features/projects/ProjectsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'overview',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'pipelines',
        element: <PipelinesPage />,
      },
      {
        path: 'pipelines/:pipelineId',
        element: <PipelineDetailsPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
