import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import NetworkAnalysis from './pages/NetworkAnalysis/NetworkAnalysis';
import Performance from './pages/Performance/Performance';
import FinOps from './pages/FinOps/FinOps';
import Security from './pages/Security/Security';
import Observability from './pages/Observability/Observability';
import Executive from './pages/Executive/Executive';
import OutageContext from './pages/OutageContext/OutageContext';
import DrGuidance from './pages/DrGuidance/DrGuidance';
import Greenfield from './pages/Greenfield/Greenfield';
import ArbSupport from './pages/ArbSupport/ArbSupport';
import InfrastructureGraphPage from './pages/InfrastructureGraphPage';
import DemoScenariosPage from './pages/DemoScenariosPage';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PresenterModeProvider } from './contexts/PresenterModeContext';
import { mantineTheme } from './theme/mantine-theme';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <WebSocketProvider>
        <NotificationProvider>
          <PresenterModeProvider>
            <Layout />
          </PresenterModeProvider>
        </NotificationProvider>
      </WebSocketProvider>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'network-analysis', element: <NetworkAnalysis /> },
      { path: 'performance', element: <Performance /> },
      { path: 'infrastructure-graph', element: <InfrastructureGraphPage /> },
      { path: 'finops', element: <FinOps /> },
      { path: 'security', element: <Security /> },
      { path: 'observability', element: <Observability /> },
      { path: 'executive', element: <Executive /> },
      { path: 'outage-context', element: <OutageContext /> },
      { path: 'dr-guidance', element: <DrGuidance /> },
      { path: 'greenfield', element: <Greenfield /> },
      { path: 'arb-support', element: <ArbSupport /> },
      { path: 'demo-scenarios', element: <DemoScenariosPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

function App() {
  return (
    <MantineProvider theme={mantineTheme}>
      <ModalsProvider>
        <Notifications />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;