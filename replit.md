# Overview

CivicLens AI is a multimodal AI platform that empowers citizens to report civic infrastructure issues (potholes, graffiti, broken streetlights, trash overflow, unsafe sidewalks) with just a photo or video upload. The system uses AI to automatically detect and classify issues, generate structured professional reports, and route them to the appropriate city departments. Citizens can track their reports in real-time while city officials manage issues through dedicated dashboards with role-based access control.

The platform aims to reduce reporting latency, increase accuracy, and improve civic engagement while providing city governments with actionable, real-time data for infrastructure maintenance and urban planning.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern SPA built with React 18 and TypeScript for type safety
- **Vite**: Fast build tool and development server with hot module replacement
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built component library
- **Wouter**: Lightweight client-side routing library
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates

## Backend Architecture
- **Express.js**: Node.js web framework handling API routes and middleware
- **TypeScript**: End-to-end type safety across client and server
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect
- **Session-based Authentication**: Using connect-pg-simple for PostgreSQL session storage
- **RESTful API Design**: Standard HTTP methods with JSON payloads

## Data Storage
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Google Cloud Storage**: Object storage for image/video uploads with ACL-based access control
- **Session Store**: PostgreSQL-backed session storage for authentication persistence

## Authentication & Authorization
- **Replit Auth**: OpenID Connect integration for seamless authentication
- **Role-Based Access Control (RBAC)**: Three user roles - citizen, official, admin
- **Session Management**: Secure session handling with HTTP-only cookies
- **Object-Level Permissions**: Fine-grained access control for uploaded media files

## AI Integration
- **OpenAI GPT-4o**: Latest multimodal model for image analysis and issue classification
- **Automated Issue Detection**: AI analyzes uploaded images to detect issue type, priority, and generate descriptions
- **Structured Response Format**: AI returns JSON with confidence scores, repair estimates, and recommendations

## File Upload System
- **Uppy Integration**: Modern file upload library with drag-drop support
- **Direct-to-Cloud Uploads**: Presigned URLs for secure direct uploads to Google Cloud Storage
- **ACL Management**: Custom access control layer for uploaded files
- **Multi-format Support**: Images and videos with size and type validation

# External Dependencies

## Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage with global CDN and fine-grained ACL
- **Replit Infrastructure**: Authentication, hosting, and development environment

## AI Services
- **OpenAI API**: GPT-4o model for multimodal image analysis and text generation
- **Custom AI Pipeline**: Image preprocessing and structured prompt engineering for civic issue detection

## UI Libraries
- **Radix UI**: Headless component primitives for accessibility and customization
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide Icons**: Comprehensive icon set with React components
- **FontAwesome**: Additional icon library for specific civic-related icons

## Development Tools
- **Vite Plugin Ecosystem**: Runtime error overlays and development enhancements
- **ESBuild**: Fast JavaScript bundling for production builds
- **TypeScript Compiler**: Type checking and code generation

## Data Management
- **Drizzle Kit**: Database migration and schema management tools
- **Date-fns**: Modern date manipulation and formatting library
- **Zod**: Runtime type validation and schema definition