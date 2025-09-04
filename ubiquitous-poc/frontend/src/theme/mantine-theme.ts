import { createTheme, MantineColorsTuple, Button, Card, Table } from '@mantine/core';

// Capital Group color system - Professional financial services palette
const cgNavy: MantineColorsTuple = [
  '#e6f2ff', // Lightest navy for backgrounds
  '#b3d9ff', // Light navy for hover states
  '#80bfff', // Medium-light navy
  '#4da6ff', // Medium navy
  '#1a8cff', // Active navy
  '#001f3f', // Primary navy (brand color)
  '#001933', // Dark navy
  '#00122b', // Darker navy
  '#000c1f', // Very dark navy
  '#000813'  // Darkest navy
];

const cgBlue: MantineColorsTuple = [
  '#e6f7ff', // Lightest blue
  '#b3ebff', // Light blue
  '#80dfff', // Medium-light blue
  '#4dd2ff', // Medium blue
  '#1ac6ff', // Active blue
  '#0d47a1', // Primary blue
  '#0a3d91', // Dark blue
  '#073381', // Darker blue
  '#052971', // Very dark blue
  '#021f61'  // Darkest blue
];

const cgGray: MantineColorsTuple = [
  '#fafafa', // Background gray
  '#f5f5f5', // Light background
  '#eeeeee', // Border gray
  '#e0e0e0', // Divider gray
  '#bdbdbd', // Text gray
  '#9e9e9e', // Muted text
  '#757575', // Secondary text
  '#616161', // Primary text
  '#424242', // Dark text
  '#212121'  // Darkest text
];

export const mantineTheme = createTheme({
  // Typography - Professional financial services
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.625rem', lineHeight: '1.35' },
      h3: { fontSize: '1.375rem', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', lineHeight: '1.45' },
      h5: { fontSize: '1rem', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', lineHeight: '1.5' },
    },
  },

  // Color system
  colors: {
    'cg-navy': cgNavy,
    'cg-blue': cgBlue,
    'cg-gray': cgGray,
  },
  primaryColor: 'cg-navy',
  
  // Spacing system
  spacing: { 
    xs: 8, 
    sm: 12, 
    md: 16, 
    lg: 20, 
    xl: 24,
    xxl: 32,
  },
  
  // Border radius
  defaultRadius: 'md',
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // Shadows - Professional depth
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },

  // Component customizations
  components: {
    Button: Button.extend({
      styles: (theme, props) => ({
        root: {
          fontWeight: 600,
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
          borderColor: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-3))',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'var(--mantine-color-cg-navy-3)',
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows.lg,
          },
        },
      }),
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
      },
    }),

    Table: Table.extend({
      styles: (theme) => ({
        root: {
          borderRadius: theme.radius.md,
          overflow: 'hidden',
        },
        th: {
          backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
          fontWeight: 600,
          color: 'var(--mantine-color-cg-navy-6)',
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        },
        td: {
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          borderBottom: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))',
        },
      }),
      defaultProps: {
        striped: true,
        highlightOnHover: true,
      },
    }),

    // Navigation styling
    NavLink: {
      styles: (theme) => ({
        root: {
          borderRadius: theme.radius.md,
          margin: `0 0 ${theme.spacing.xs}px 0`,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'light-dark(var(--mantine-color-cg-navy-0), var(--mantine-color-dark-6))',
            transform: 'translateX(4px)',
          },
          '&[data-active="true"]': {
            backgroundColor: 'var(--mantine-color-cg-navy-5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'var(--mantine-color-cg-navy-6)',
            },
          },
        },
        label: {
          fontWeight: 500,
        },
      }),
    },

    // Modal enhancements
    Modal: {
      styles: (theme) => ({
        content: {
          borderRadius: theme.radius.lg,
        },
        header: {
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
          borderBottom: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))',
          padding: theme.spacing.lg,
        },
        title: {
          fontWeight: 600,
          color: 'var(--mantine-color-cg-navy-6)',
        },
      }),
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
        transitionProps: { transition: 'fade', duration: 200 },
      },
    },
  },

  // Respect reduced motion
  respectReducedMotion: false,

  // Focus ring styling
  focusRing: 'auto',
  
  // Other settings
  cursorType: 'pointer',
  
  // CSS Variables customization
  other: {
    // Capital Group specific design tokens
    cgGradient: 'linear-gradient(135deg, var(--mantine-color-cg-navy-5) 0%, var(--mantine-color-cg-blue-5) 100%)',
    cgCardShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    
    // Chart color palette for data visualizations
    chartColors: {
      primary: 'var(--mantine-color-cg-navy-5)',
      secondary: 'var(--mantine-color-cg-blue-5)',
      success: 'var(--mantine-color-green-6)',
      warning: 'var(--mantine-color-yellow-6)',
      danger: 'var(--mantine-color-red-6)',
      info: 'var(--mantine-color-cyan-6)',
    },
  },
});

// Theme extension for testing environment
export const testTheme = createTheme({
  ...mantineTheme,
  components: {
    ...mantineTheme.components,
    Modal: {
      ...mantineTheme.components?.Modal,
      defaultProps: {
        ...mantineTheme.components?.Modal?.defaultProps,
        transitionProps: { duration: 0 },
      },
    },
  },
});