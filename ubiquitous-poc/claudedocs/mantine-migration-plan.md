# Ubiquitous Platform: Mantine Migration Plan

## Executive Summary

**Migration Goal:** Transform Ubiquitous from current CSS-based styling to Mantine UI framework
**Timeline:** 6-8 weeks (12-16 development sessions)
**Investment:** High-impact migration with significant long-term benefits
**ROI:** Enhanced development velocity, reduced maintenance overhead, enterprise-grade component library

---

## Migration Strategy Overview

### Phase 1: Foundation & Theming (Sessions 1-4)
**Goal:** Establish Mantine infrastructure with Capital Group design system

### Phase 2: Core Components Migration (Sessions 5-8) 
**Goal:** Replace existing CSS components with Mantine equivalents

### Phase 3: Advanced Features (Sessions 9-12)
**Goal:** Implement charts, data visualization, and advanced interactions

### Phase 4: Polish & Optimization (Sessions 13-16)
**Goal:** Performance optimization, testing, and final refinements

---

## Phase 1: Foundation & Theming (4 Sessions)

### Session 1: Mantine Installation & Theme Setup

#### Install Dependencies
```bash
npm install @mantine/core @mantine/hooks @mantine/charts @mantine/notifications @mantine/modals
npm install @tabler/icons-react
```

#### Core Theme Configuration
**File:** `frontend/src/theme/mantine-theme.ts`
```tsx
import { createTheme, MantineColorsTuple } from '@mantine/core';

// Capital Group color system
const cgNavy: MantineColorsTuple = [
  '#e6f2ff', '#b3d9ff', '#80bfff', '#4da6ff', 
  '#1a8cff', '#001f3f', '#001933', '#00122b',
  '#000c1f', '#000813'
];

const cgBlue: MantineColorsTuple = [
  '#e6f7ff', '#b3ebff', '#80dfff', '#4dd2ff',
  '#1ac6ff', '#0d47a1', '#0a3d91', '#073381',
  '#052971', '#021f61'
];

export const mantineTheme = createTheme({
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '600',
  },
  colors: {
    'cg-navy': cgNavy,
    'cg-blue': cgBlue,
  },
  primaryColor: 'cg-navy',
  defaultRadius: 'md',
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      styles: (theme) => ({
        root: {
          fontWeight: 600,
        },
      }),
    },
    Card: {
      styles: (theme) => ({
        root: {
          border: '1px solid',
          borderColor: theme.colors.gray[2],
        },
      }),
    },
  },
});
```

#### Global Styles Setup
**File:** `frontend/src/styles/global.scss`
```scss
// Import Mantine styles
@import '@mantine/core/styles.css';
@import '@mantine/charts/styles.css';
@import '@mantine/notifications/styles.css';
@import '@mantine/modals/styles.css';

// Capital Group global styles
:root {
  --cg-gradient: linear-gradient(135deg, var(--mantine-color-cg-navy-5) 0%, var(--mantine-color-cg-blue-5) 100%);
  --cg-card-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
}

// Professional financial services styling
body {
  background: light-dark(
    var(--mantine-color-gray-0),
    var(--mantine-color-dark-7)
  );
  font-family: var(--mantine-font-family);
  line-height: var(--mantine-line-height);
}
```

### Session 2: Layout Architecture Migration

#### Header Component Transformation
**Current:** `frontend/src/components/Layout/Layout.tsx`
**Target:** Mantine AppShell with Header

```tsx
import { AppShell, Group, Title, TextInput, ActionIcon } from '@mantine/core';
import { IconSearch, IconNotification } from '@tabler/icons-react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: true } }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Title order={2} c="white">Ubiquitous</Title>
          <Group gap="sm">
            <TextInput
              placeholder="Search infrastructure..."
              leftSection={<IconSearch size={16} />}
              w={250}
            />
            <ActionIcon variant="subtle" color="white">
              <IconNotification size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>
    </AppShell>
  );
}
```

#### Sidebar Navigation Migration
**Target:** Mantine NavLink components

```tsx
import { AppShell, NavLink, ScrollArea } from '@mantine/core';
import { 
  IconNetwork, IconCurrencyDollar, IconShield, 
  IconChartLine, IconReport, IconAlertTriangle 
} from '@tabler/icons-react';

const navigationItems = [
  { icon: IconNetwork, label: 'Network Protocol Analysis', path: '/network-analysis' },
  { icon: IconCurrencyDollar, label: 'FinOps Analyzer', path: '/finops' },
  { icon: IconShield, label: 'Security Scanner', path: '/security' },
  // ... more items
];

export function Sidebar() {
  return (
    <AppShell.Navbar p="md">
      <ScrollArea h="100%">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            href={item.path}
            label={item.label}
            leftSection={<item.icon size="1rem" />}
          />
        ))}
      </ScrollArea>
    </AppShell.Navbar>
  );
}
```

### Session 3: Core Component System

#### Card Components Migration
**Replace:** Custom CSS cards → Mantine Card + Paper

```tsx
import { Card, Group, Text, Badge, ActionIcon } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';

export function MetricCard({ title, value, change, status }) {
  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Card.Section inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>{title}</Text>
          <ActionIcon variant="subtle" color="gray">
            <IconDots size="1rem" />
          </ActionIcon>
        </Group>
      </Card.Section>
      
      <Text size="xl" fw={700} mt="md">{value}</Text>
      <Text size="sm" c="dimmed">{change}</Text>
      <Badge color={status === 'healthy' ? 'green' : 'red'} variant="light" mt="sm">
        {status}
      </Badge>
    </Card>
  );
}
```

#### Button System Migration
**Replace:** Custom CSS buttons → Mantine Button variants

```tsx
import { Button, Group } from '@mantine/core';

// Primary actions
<Button color="cg-navy" variant="filled">Primary Action</Button>

// Secondary actions  
<Button color="cg-navy" variant="outline">Secondary Action</Button>

// Subtle actions
<Button color="gray" variant="subtle">Tertiary Action</Button>
```

### Session 4: Form Components & Inputs

#### Input System Migration
```tsx
import { TextInput, Select, NumberInput, Group } from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';

export function FilterForm() {
  return (
    <Group grow>
      <TextInput
        placeholder="Search resources..."
        leftSection={<IconSearch size={16} />}
      />
      <Select
        placeholder="Filter by service"
        data={['EKS', 'RDS', 'EC2', 'Lambda']}
        leftSection={<IconFilter size={16} />}
      />
      <NumberInput
        placeholder="Cost threshold"
        min={0}
        step={100}
        prefix="$"
      />
    </Group>
  );
}
```

---

## Phase 2: Core Components Migration (4 Sessions)

### Session 5: Data Tables & Lists

#### Replace Custom Tables → Mantine Table
**Current:** `frontend/src/components/DataTable/`
**Target:** Mantine Table with enhanced features

```tsx
import { Table, ScrollArea, Text, Badge, ActionIcon, Group } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';

export function ResourceTable({ data }) {
  const rows = data.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>
        <Group gap="sm">
          <Text fw={500}>{row.name}</Text>
          <Badge color={row.status === 'healthy' ? 'green' : 'red'} size="sm">
            {row.status}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>{row.type}</Table.Td>
      <Table.Td>${row.cost}</Table.Td>
      <Table.Td>
        <ActionIcon variant="subtle" color="blue">
          <IconExternalLink size="1rem" />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Resource</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Cost</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
```

### Session 6: Modal & Overlay System

#### Replace Custom Modals → Mantine Modal + Drawer
```tsx
import { Modal, Drawer, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export function ResourceDetails() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>View Details</Button>
      <Modal 
        opened={opened} 
        onClose={close}
        title="Resource Configuration"
        size="xl"
        transitionProps={{ transition: 'fade', duration: 200 }}
      >
        <Text>Resource configuration details...</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button color="cg-navy">Save Changes</Button>
        </Group>
      </Modal>
    </>
  );
}
```

### Session 7: Notification & Feedback System

#### Replace Custom Notifications → Mantine Notifications
```tsx
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

export const notificationService = {
  success: (message: string) => {
    notifications.show({
      title: 'Success',
      message,
      color: 'green',
      icon: <IconCheck size="1rem" />,
    });
  },
  
  error: (message: string) => {
    notifications.show({
      title: 'Error',
      message,
      color: 'red',
      icon: <IconX size="1rem" />,
    });
  },
  
  warning: (message: string) => {
    notifications.show({
      title: 'Warning', 
      message,
      color: 'yellow',
      icon: <IconAlertTriangle size="1rem" />,
    });
  },
};
```

### Session 8: Loading & Progress States

#### Replace Custom Loading → Mantine Skeleton + LoadingOverlay
```tsx
import { Skeleton, LoadingOverlay, Progress, Group, Stack } from '@mantine/core';

export function DashboardSkeleton() {
  return (
    <Stack gap="md">
      <Group grow>
        <Skeleton height={120} radius="md" />
        <Skeleton height={120} radius="md" />
        <Skeleton height={120} radius="md" />
      </Group>
      <Skeleton height={300} radius="md" />
      <Group grow>
        <Skeleton height={200} radius="md" />
        <Skeleton height={200} radius="md" />
      </Group>
    </Stack>
  );
}

export function ProcessingOverlay({ visible, progress }) {
  return (
    <LoadingOverlay
      visible={visible}
      overlayProps={{ backgroundOpacity: 0.7 }}
      loaderProps={{ color: 'cg-navy', size: 'xl' }}
    />
  );
}
```

---

## Phase 3: Advanced Features (4 Sessions)

### Session 9: Chart Migration - Core Visualizations

#### Replace D3.js Charts → Mantine Charts
**Priority:** Network topology, latency heatmaps, cost trends

```tsx
import { LineChart, BarChart, AreaChart } from '@mantine/charts';

export function CostTrendChart({ data }) {
  return (
    <LineChart
      h={300}
      data={data}
      dataKey="date"
      gridColor="gray.3"
      textColor="gray.7"
      withLegend
      series={[
        { name: 'Compute Costs', color: 'cg-navy.5' },
        { name: 'Storage Costs', color: 'cg-blue.5' },
        { name: 'Network Costs', color: 'cyan.5' },
      ]}
    />
  );
}

export function ResourceUtilizationChart({ data }) {
  return (
    <AreaChart
      h={250}
      data={data}
      dataKey="time"
      type="stacked"
      series={[
        { name: 'CPU', color: 'red.6' },
        { name: 'Memory', color: 'blue.6' },
        { name: 'Network', color: 'green.6' },
      ]}
    />
  );
}
```

### Session 10: Advanced Chart Components

#### Specialized Dashboard Charts
```tsx
import { CompositeChart, DonutChart, RadialBarChart } from '@mantine/charts';

export function ServiceHealthOverview({ data }) {
  return (
    <CompositeChart
      h={300}
      data={data}
      dataKey="service"
      maxBarWidth={30}
      series={[
        { name: 'Uptime', color: 'green.6', type: 'bar' },
        { name: 'Response Time', color: 'blue.6', type: 'line' },
        { name: 'Error Rate', color: 'red.6', type: 'area' },
      ]}
    />
  );
}

export function CostDistribution({ data }) {
  return (
    <DonutChart
      data={data}
      h={250}
      withLabels
      withTooltip
      strokeColor="white"
    />
  );
}

export function SecurityScoreRadial({ data }) {
  return (
    <RadialBarChart
      data={data}
      dataKey="score"
      h={280}
      withLabels
    />
  );
}
```

### Session 11: Interactive Data Components

#### Enhanced Table with Mantine Features
```tsx
import { Table, TextInput, MultiSelect, Pagination, Group } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

export function AdvancedResourceTable({ data }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [filters, setFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  return (
    <Stack gap="md">
      <Group grow>
        <TextInput
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftSection={<IconSearch size={16} />}
        />
        <MultiSelect
          placeholder="Filter by type"
          data={['EKS', 'RDS', 'EC2', 'Lambda']}
          value={filters}
          onChange={setFilters}
        />
      </Group>
      
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          {/* Table content */}
        </Table>
      </Table.ScrollContainer>
      
      <Pagination value={page} onChange={setPage} total={10} />
    </Stack>
  );
}
```

### Session 12: Executive Dashboard Components

#### Multi-Level Dashboard Components
```tsx
import { Grid, Card, Group, Stack, Title, Text, RingProgress } from '@mantine/core';

export function ExecutiveDashboard({ level }: { level: 'ceo' | 'cio' | 'director' }) {
  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={1}>
          {level.toUpperCase()} Infrastructure Dashboard
        </Title>
        <Badge color="green" size="lg">Live</Badge>
      </Group>
      
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="xl">
            <Group justify="center">
              <RingProgress
                size={120}
                thickness={8}
                sections={[
                  { value: 85, color: 'green' },
                  { value: 10, color: 'yellow' },
                  { value: 5, color: 'red' },
                ]}
              />
            </Group>
            <Text ta="center" fw={500} mt="md">Infrastructure Health</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="xl">
            <LineChart
              h={200}
              data={costData}
              dataKey="month"
              series={[{ name: 'Total Cost', color: 'cg-navy.5' }]}
            />
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
```

---

## Phase 4: Polish & Optimization (4 Sessions)

### Session 13: Advanced Theming & Customization

#### Component Extensions
```tsx
import { createTheme, Button, Card, Table } from '@mantine/core';

export const advancedTheme = createTheme({
  components: {
    Button: Button.extend({
      classNames: {
        root: 'ubiquitous-button',
      },
      styles: (theme, props) => ({
        root: {
          fontSize: props.size === 'compact' ? theme.fontSizes.sm : undefined,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows.md,
          },
        },
      }),
      defaultProps: {
        radius: 'md',
      },
    }),
    
    Card: Card.extend({
      styles: (theme) => ({
        root: {
          border: '1px solid',
          borderColor: light-dark(theme.colors.gray[2], theme.colors.dark[3]),
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.colors['cg-navy'][3],
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows.lg,
          },
        },
      }),
    }),
  },
});
```

### Session 14: Performance Optimization

#### Lazy Loading & Code Splitting
```tsx
import { lazy, Suspense } from 'react';
import { LoadingOverlay } from '@mantine/core';

const NetworkAnalysis = lazy(() => import('./pages/NetworkAnalysis'));
const FinOps = lazy(() => import('./pages/FinOps'));
const Security = lazy(() => import('./pages/Security'));

export function App() {
  return (
    <MantineProvider theme={mantineTheme}>
      <Router>
        <Routes>
          <Route path="/network-analysis" element={
            <Suspense fallback={<LoadingOverlay visible />}>
              <NetworkAnalysis />
            </Suspense>
          } />
          {/* More routes */}
        </Routes>
      </Router>
    </MantineProvider>
  );
}
```

### Session 15: Testing Integration

#### Test Setup with Mantine
```tsx
// test-utils.tsx
import { render as testingLibraryRender } from '@testing-library/react';
import { createTheme, MantineProvider, Modal } from '@mantine/core';
import { mantineTheme } from '../theme/mantine-theme';

const testTheme = createTheme({
  ...mantineTheme,
  components: {
    Modal: Modal.extend({
      defaultProps: {
        transitionProps: { duration: 0 },
      },
    }),
  },
});

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  });
}
```

### Session 16: Final Integration & Deployment

#### Production Optimizations
- Bundle size analysis and optimization
- CSS-in-JS performance optimization
- Chart rendering performance tuning
- Accessibility compliance validation
- Cross-browser compatibility testing

---

## Migration Benefits Analysis

### Development Velocity Improvements
- **Component Development Speed:** 60-80% faster with pre-built components
- **Design Consistency:** Automatic design system compliance
- **Maintenance Overhead:** 50% reduction through shared component library
- **TypeScript Integration:** Enhanced type safety with built-in TypeScript support

### Enterprise Features Gained
- **Professional Chart Library:** 8 chart types with Recharts foundation
- **Accessibility Compliance:** WCAG 2.1 AA compliance built-in
- **Theme System:** Robust theming with CSS variables
- **Responsive Design:** Mobile-first responsive components
- **Dark Mode Support:** Enterprise-grade dark/light mode switching

### Technical Debt Reduction
- **CSS Architecture:** Replace 2,000+ lines of custom CSS with component props
- **Browser Compatibility:** Eliminate cross-browser styling issues
- **Performance:** Optimized component rendering and bundle splitting
- **Testing:** Enhanced testing capabilities with built-in test utilities

---

## Risk Assessment & Mitigation

### High Risk Areas
1. **D3.js Visualizations:** Complex network topology charts
   - **Mitigation:** Gradual migration, keep D3.js for specialized charts
   
2. **Real-time Performance:** WebSocket data rendering
   - **Mitigation:** Performance testing with large datasets
   
3. **Chart Complexity:** Advanced financial visualizations
   - **Mitigation:** Use Mantine Charts + custom Recharts when needed

### Low Risk Areas
- Basic UI components (buttons, inputs, cards)
- Layout structure (header, sidebar, navigation)
- Form components and validation
- Modal and notification systems

---

## Success Metrics

### Quantitative Targets
- **Bundle Size:** <20% increase (offset by removed custom CSS)
- **Component Count:** 80%+ using Mantine components
- **Development Time:** 50% reduction for new features
- **CSS Lines:** 70% reduction in custom CSS

### Qualitative Improvements
- Enhanced professional appearance matching Capital Group standards
- Improved accessibility and keyboard navigation
- Better mobile responsiveness across all devices
- Consistent design language across all platform areas

---

## Next Steps

1. **Executive Approval:** Review migration plan and resource allocation
2. **Team Preparation:** Developer training on Mantine components and patterns
3. **Staging Environment:** Set up migration testing environment
4. **Gradual Rollout:** Begin with Phase 1 foundation work
5. **User Testing:** Validate design changes with stakeholder feedback

---

**Migration Complexity:** Moderate to High
**Business Impact:** High value - enhanced user experience and development efficiency
**Technical Risk:** Low to Medium - well-documented migration path with proven enterprise adoption

*This migration plan leverages Mantine's enterprise-grade component library while preserving the Capital Group professional aesthetic and Ubiquitous platform functionality.*