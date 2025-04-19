# Easy Diagram AI

A web application for creating and managing diagrams using natural language with AI assistance.

## Features

- Create and edit diagrams using Mermaid syntax
- AI-powered diagram updates through natural language commands
- Folder organization for diagrams
- Email and password authentication
- Password reset functionality
- Responsive design

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/easy-diagram-ai.git
cd easy-diagram-ai/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the Supabase configuration with your project details:
     - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase project anonymous key
   - Update API configuration if needed:
     - `REACT_APP_API_HOST`: Backend API host (default: 127.0.0.1)
     - `REACT_APP_API_PORT`: Backend API port (default: 5001)

4. Start the development server:
```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Authentication

The application uses Supabase for authentication. Users can:
- Sign up with email and password
- Sign in with email and password
- Reset their password via email
- Update their password

## Development

### Project Structure

```
src/
  ├── components/
  │   ├── auth/           # Authentication components
  │   ├── common/         # Shared components
  │   ├── diagram/        # Diagram-related components
  │   ├── editor/         # Code editor components
  │   ├── layout/         # Layout components
  │   └── storage/        # Storage-related components
  ├── contexts/           # React contexts
  ├── hooks/              # Custom hooks
  ├── services/           # API and service integrations
  └── App.tsx            # Main application component
```

### Key Technologies

- React
- TypeScript
- Supabase (Authentication)
- Mermaid.js (Diagram rendering)
- Material-UI (UI components)
- Axios (API client)

## License

[MIT License](LICENSE)
