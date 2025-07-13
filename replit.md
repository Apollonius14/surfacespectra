# Phonetic Wave Visualizer

## Overview

This is a full-stack web application that visualizes phonetic sounds as interactive wave patterns using Three.js. The application features a React frontend with a phonetic keyboard interface and a Node.js/Express backend with PostgreSQL database support. Users can trigger different phonetic types (vowels, trills, fricatives, plosives) to generate corresponding wave visualizations with unique frequency characteristics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 13, 2025 - Complete Polar Field System Implementation
- **Major Architecture Change:** Abandoned grid-based wedge system for polar field geometry
- **New System Components:**
  - **PolarField class:** Handles coordinate transformation between polar and cartesian systems
  - **PolarThreeSetup class:** Creates Olympic field-style visualization with concentric arcs
  - **PolarWaveEngine class:** Generates authentic spectrogram sequences for phonetic types
- **Key Features:**
  - 40-degree total field span (20° each side) for narrow javelin-like wedge
  - 1,000 time intervals × 100 frequency bins (100Hz to 8kHz) data structure
  - Bilateral symmetry: Single spectrogram creates mirrored radial displays
  - Crisp concentric arcs and radial grid lines for athletic field appearance
  - Portrait mobile orientation with field positioned bottom-third to top-third
- **Status:** New polar system fully implemented and functional
- **Next:** Test and refine spectrogram visualization and wave propagation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **3D Graphics**: Three.js for wave visualization and rendering

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution in development

## Key Components

### Frontend Components
1. **PhoneticVisualizer**: Main visualization component managing Three.js canvas and wave engine
2. **PhoneticKeyboard**: Interactive keyboard for triggering phonetic sounds
3. **WaveEngine**: Core engine for generating and managing wave patterns
4. **ThreeJSSetup**: Three.js scene configuration and rendering management

### Backend Components
1. **Express Server**: Main application server with middleware setup
2. **Storage Interface**: Abstraction layer for database operations
3. **Route Registration**: Centralized route management system
4. **Vite Integration**: Development server integration for hot reloading

### Wave System
- **Phonetic Types**: Four distinct sound categories (vowel, trill, fricative, plosive)
- **Coordinate System**: Logical coordinates (frequency 0-1, time 0-1) mapped to shell display coordinates
- **Bilateral Symmetry**: Each half-wedge represents full spectrum with mirror wave effects
- **Geometry**: 60-degree wedge with finite mouth width to prevent singularity
- **Visual Representation**: Waves rendered as 3D geometric patterns with color coding
- **Real-time Animation**: Dynamic wave propagation and decay effects with debounced input

## Data Flow

1. **User Interaction**: User presses phonetic keys on the keyboard interface
2. **Wave Generation**: WaveEngine creates wave objects with phonetic-specific parameters
3. **3D Rendering**: Three.js renders waves as animated 3D geometry
4. **State Management**: React Query manages application state and server communication
5. **Database Operations**: Drizzle ORM handles PostgreSQL interactions through storage interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **three**: 3D graphics library for wave visualization
- **@radix-ui/react-***: Headless UI components for accessibility
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library

### Development Tools
- **Vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **Tailwind CSS**: Utility-first CSS framework
- **esbuild**: JavaScript bundler for production builds

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Migration**: Drizzle handles schema migrations via `drizzle-kit`

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution with hot reloading
- **Production**: Compiled JavaScript execution with static file serving
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable

### Scripts
- `dev`: Development server with hot reloading
- `build`: Production build for both frontend and backend
- `start`: Production server execution
- `db:push`: Database schema synchronization

### Replit Integration
- **Cartographer Plugin**: Development environment integration
- **Runtime Error Overlay**: Enhanced error handling in development
- **Banner Script**: Replit development mode indicator

The application is designed for easy deployment on Replit with integrated development tools and can be extended with additional phonetic types, visual effects, and user management features.