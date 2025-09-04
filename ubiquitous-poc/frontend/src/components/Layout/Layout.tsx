import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  AppShell,
  Group,
  Title,
  TextInput,
  ActionIcon,
  NavLink,
  ScrollArea,
  Badge,
  Avatar,
  Menu,
  Burger,
  Text,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconBell,
  IconUser,
  IconLogout,
  IconSettings,
  IconDashboard,
  IconNetwork,
  IconBolt,
  IconHierarchy,
  IconCurrencyDollar,
  IconShield,
  IconEye,
  IconChartBar,
  IconAlertTriangle,
  IconRefresh,
  IconPlant,
  IconClipboardList,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { usePresenterMode } from '../../contexts/PresenterModeContext';
import PresenterControls from '../PresenterMode/PresenterControls';
import ScenarioNavigator from '../PresenterMode/ScenarioNavigator';
import PresenterModeToggle from '../PresenterMode/PresenterModeToggle';
import RealTimeNotificationSystem from '../RealTime/RealTimeNotificationSystem';
import ScenarioTriggerSystem from '../RealTime/ScenarioTriggerSystem';
import './Layout.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: string | number }>;
  description: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: IconDashboard, description: 'System Overview' },
  { path: '/network-analysis', label: 'Network Analysis', icon: IconNetwork, description: 'Protocol & Latency Analysis' },
  { path: '/performance', label: 'Performance', icon: IconBolt, description: 'Real-time Performance Metrics' },
  { path: '/infrastructure-graph', label: 'Infrastructure Graph', icon: IconHierarchy, description: '50K+ Node Topology' },
  { path: '/finops', label: 'FinOps', icon: IconCurrencyDollar, description: 'Cost Optimization' },
  { path: '/security', label: 'Security', icon: IconShield, description: 'Security Analysis' },
  { path: '/observability', label: 'Observability', icon: IconEye, description: 'System Monitoring' },
  { path: '/executive', label: 'Executive', icon: IconChartBar, description: 'Executive Reporting' },
  { path: '/outage-context', label: 'Outage Context', icon: IconAlertTriangle, description: 'Incident Analysis' },
  { path: '/dr-guidance', label: 'DR Guidance', icon: IconRefresh, description: 'Disaster Recovery' },
  { path: '/greenfield', label: 'Greenfield', icon: IconPlant, description: 'Architecture Design' },
  { path: '/arb-support', label: 'ARB Support', icon: IconClipboardList, description: 'Review Board Support' },
  { path: '/demo-scenarios', label: 'Demo Scenarios', icon: IconBolt, description: 'Interactive Demonstrations' },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { isPresenterMode } = usePresenterMode();

  const filteredNavItems = navItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        style={{
          height: 70,
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-white)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle mobile navigation"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
              aria-label="Toggle desktop navigation"
            />
            <Group gap="xs">
              <Text
                size="xl"
                fw={700}
                variant="gradient"
                gradient={{ from: 'cg-navy.5', to: 'cg-blue.5' }}
              >
                🚀 Ubiquitous Platform
              </Text>
            </Group>
          </Group>

          <Group gap="sm">
            <TextInput
              placeholder="Search infrastructure..."
              leftSection={<IconSearch size={16} />}
              w={250}
              visibleFrom="md"
            />
            
            <ActionIcon 
              variant="subtle" 
              color="gray" 
              size="lg" 
              pos="relative"
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
            >
              <IconBell size={18} />
              {unreadNotificationCount > 0 && (
                <Badge
                  size="xs"
                  circle
                  color="red"
                  pos="absolute"
                  top={-5}
                  right={-5}
                >
                  {unreadNotificationCount}
                </Badge>
              )}
            </ActionIcon>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="lg">
                  <Avatar size={24} color="cg-navy">
                    <IconUser size={16} />
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Demo User</Menu.Label>
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconLogout size={16} />}
                  color="red"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Box>

      {/* Body with Sidebar and Content */}
      <Box style={{ display: 'flex', flex: 1, marginTop: 70 }}>
        {/* Sidebar */}
        <Box
          style={{
            width: (desktopOpened ? 280 : 0),
            backgroundColor: 'var(--mantine-color-white)',
            borderRight: '1px solid var(--mantine-color-gray-3)',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
          }}
          visibleFrom="sm"
        >
          <Box p="md" h="100%">
            <Box mb="md">
              <TextInput
                placeholder="Search capabilities..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />
            </Box>

            <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
              {filteredNavItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    href={item.path}
                    label={item.label}
                    description={item.description}
                    leftSection={<IconComponent size="1.2rem" />}
                    active={location.pathname === item.path}
                    mb="xs"
                  />
                );
              })}
            </ScrollArea>

            {!isPresenterMode && (
              <Box mt="md" p="sm" style={(theme) => ({
                backgroundColor: 'light-dark(var(--mantine-color-green-0), var(--mantine-color-dark-8))',
                borderRadius: theme.radius.md,
                border: '1px solid light-dark(var(--mantine-color-green-2), var(--mantine-color-dark-4))',
              })}>
                <Group gap="xs">
                  <Box
                    w={8}
                    h={8}
                    style={{
                      borderRadius: '50%',
                      backgroundColor: 'var(--mantine-color-green-6)',
                    }}
                  />
                  <Text size="sm" fw={500}>
                    All Systems Operational
                  </Text>
                </Group>
              </Box>
            )}

            <Box mt="md">
              <PresenterModeToggle compact={isPresenterMode} showStats={!isPresenterMode} />
            </Box>
          </Box>
        </Box>

        {/* Mobile Overlay */}
        {mobileOpened && (
          <Box
            style={{
              position: 'fixed',
              top: 70,
              left: 0,
              width: 280,
              height: 'calc(100vh - 70px)',
              backgroundColor: 'var(--mantine-color-white)',
              borderRight: '1px solid var(--mantine-color-gray-3)',
              zIndex: 200,
              overflow: 'hidden',
            }}
            hiddenFrom="sm"
          >
            <Box p="md" h="100%">
              <Box mb="md">
                <TextInput
                  placeholder="Search capabilities..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.currentTarget.value)}
                />
              </Box>

              <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
                {filteredNavItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      href={item.path}
                      label={item.label}
                      description={item.description}
                      leftSection={<IconComponent size="1.2rem" />}
                      active={location.pathname === item.path}
                      mb="xs"
                      onClick={toggleMobile}
                    />
                  );
                })}
              </ScrollArea>

              {!isPresenterMode && (
                <Box mt="md" p="sm" style={(theme) => ({
                  backgroundColor: 'light-dark(var(--mantine-color-green-0), var(--mantine-color-dark-8))',
                  borderRadius: theme.radius.md,
                  border: '1px solid light-dark(var(--mantine-color-green-2), var(--mantine-color-dark-4))',
                })}>
                  <Group gap="xs">
                    <Box
                      w={8}
                      h={8}
                      style={{
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-green-6)',
                      }}
                    />
                    <Text size="sm" fw={500}>
                      All Systems Operational
                    </Text>
                  </Group>
                </Box>
              )}

              <Box mt="md">
                <PresenterModeToggle compact={isPresenterMode} showStats={!isPresenterMode} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Mobile Backdrop */}
        {mobileOpened && (
          <Box
            style={{
              position: 'fixed',
              top: 70,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 150,
            }}
            hiddenFrom="sm"
            onClick={toggleMobile}
          />
        )}

        {/* Main Content */}
        <Box
          style={{
            flex: 1,
            padding: 'var(--mantine-spacing-md)',
            overflow: 'auto',
            backgroundColor: 'var(--mantine-color-gray-0)',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Real-time Components (always rendered but visibility controlled) */}
      <RealTimeNotificationSystem 
        position="top-right" 
        isOpen={notificationPanelOpen}
        onToggle={setNotificationPanelOpen}
        onUnreadCountChange={setUnreadNotificationCount}
      />
      
      {isPresenterMode && (
        <>
          <PresenterControls position="bottom-right" />
          <ScenarioNavigator position="left" />
          <ScenarioTriggerSystem compact />
        </>
      )}
    </Box>
  );
};

export default Layout;