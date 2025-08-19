# DigestTrack - IBS/Digestive Health Tracking Application

## Overview

DigestTrack is a comprehensive digestive health tracking application designed to help users monitor their food intake and symptoms to identify potential trigger patterns. The application allows users to log meals with ingredient detection, track symptoms using the Bristol Stool Scale, and analyze correlations between food consumption and digestive issues.

The system is built as a full-stack web application with a mobile-first React frontend and Express.js backend, designed to provide an intuitive interface for daily health tracking and pattern analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation and floating action buttons

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with organized route handlers
- **Middleware**: Custom logging, error handling, and JSON parsing
- **Storage Interface**: Abstract storage layer with in-memory implementation for development

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Development Storage**: In-memory storage implementation for rapid development
- **Connection**: Pool-based connections with environment-based configuration

### Key Data Models
- **Users**: Authentication and user management
- **Food Entries**: Meal logging with ingredient detection and trigger analysis
- **Symptom Entries**: Bristol Scale rating, symptom tracking, and severity scoring
- **Ingredients**: Database of known ingredients with trigger classifications

### Authentication and Authorization
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **User Context**: Simplified user system with demo user for development
- **Security**: Environment-based configuration for database credentials

### Business Logic Components
- **Trigger Detection**: Automated identification of common digestive triggers (gluten, dairy, FODMAP)
- **Pattern Analysis**: Correlation analysis between food consumption and symptom occurrence
- **Food Database**: Ingredient detection system for common meals and dishes
- **Symptom Classification**: Bristol Stool Scale integration with UC-specific additional symptoms (urgency, blood, bloating, gas, cramping, nausea, fatigue, constipation) and overall severity tracking (1-10 scale measuring impact on daily activities)

### Development Environment
- **Build Tool**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with custom middleware
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **CSS Processing**: PostCSS with Tailwind CSS and Autoprefixer

### Production Deployment
- **Build Process**: Separate client and server builds with esbuild for server bundling
- **Static Assets**: Vite-generated client bundle served as static files
- **Environment**: Node.js production server with optimized middleware stack

## External Dependencies

### Database and Storage
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **drizzle-kit**: Database migration and schema management tools
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Design System
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Component variant management
- **clsx**: Conditional CSS class utility

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation resolver integration
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

### Development Tools
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React support for Vite
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **tsx**: TypeScript execution for Node.js development

### Utilities and Helpers
- **date-fns**: Date manipulation and formatting utilities
- **wouter**: Lightweight React router
- **lucide-react**: Icon library for React applications
- **nanoid**: Unique ID generation for entities

### Third-Party Integrations
- **Food Database APIs**: Placeholder integration points for external food/ingredient databases (Edamam, Spoonacular)
- **Analytics Platform**: Ready for health data analytics integration
- **Export Functionality**: CSV and JSON data export capabilities