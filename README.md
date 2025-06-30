# RelationshipOps Dashboard

A comprehensive contact management dashboard for tracking and managing business relationships.

## Features

- **Contact Management**: View and manage all your business contacts in one place
- **Lead Scoring**: Automatic lead scoring and categorization
- **Multi-Account Support**: Filter contacts by different client accounts
- **Interaction Tracking**: Track all interactions, meetings, and communications
- **Real-time Data**: Live updates from your connected data sources

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/relationshipops-dashboard.git
cd relationshipops-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── ContactCard.tsx  # Individual contact display
│   ├── ContactsList.tsx # List of contacts with pagination
│   ├── CustomDropdown.tsx # Custom dropdown component
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── Header.tsx       # Application header
│   ├── Pagination.tsx   # Pagination controls
│   └── StatsCards.tsx   # Statistics display cards
├── lib/
│   └── supabase.ts     # Supabase client configuration
├── types/
│   └── Contact.ts      # TypeScript type definitions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Database Schema

The application uses the following main tables:
- `icp_contacts_tracking_in_progress` - Main contacts table
- `client_details` - Client account information
- `onboarding_google_tokens` - Authentication tokens

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.