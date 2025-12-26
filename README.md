# Collectables

A mobile-friendly Progressive Web App for cataloging physical collectible items. Built with Next.js 15, TypeScript, Tailwind CSS, Supabase, and OpenAI.

## Features

- **User Authentication**: Secure email-based authentication with Supabase
- **Collection Management**: Create and organize collections (e.g., "Baseball Cards", "Hallmark 2024")
- **Item Cataloging**: Add items with photos, descriptions, and metadata
- **Image Upload**: Capture and upload images directly from mobile devices
- **Tag System**: Organize items with custom tags
- **Responsive Design**: Mobile-first UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collectables
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migration:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the migration

3. Create a storage bucket:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `item-images`
   - Set it to **Public** (or configure RLS policies as needed)

4. Configure Row Level Security (RLS):
   - The migration includes RLS policies, but verify they're enabled
   - Ensure all tables have RLS enabled in the Supabase dashboard

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
collectables/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes (for future phases)
│   ├── collections/        # Collection pages
│   └── ...
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── collections/        # Collection components
│   ├── items/              # Item components
│   ├── tags/               # Tag components
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client configuration
│   ├── storage/            # Storage utilities
│   └── utils/              # Helper functions
├── types/                  # TypeScript type definitions
└── supabase/               # Database migrations
```

## Development Phases

### Phase 1: Auth + Basic CRUD ✅
- User authentication
- Collections and items CRUD
- Image upload
- Tag management

### Phase 2: AI Draft Item Generation (Future)
- OpenAI Vision API integration
- Automatic metadata suggestions from images

### Phase 3: Optional "Identify Online" (Future)
- Search API integration
- Web scraping and metadata extraction

### Phase 4: Optional PWA / Offline / Export (Future)
- Progressive Web App features
- Offline support
- Data export functionality

## Database Schema

The application uses the following main tables:
- `collections` - User collections
- `items` - Individual collectible items
- `item_images` - Images associated with items
- `tags` - User-defined tags
- `item_tags` - Many-to-many relationship between items and tags

All tables have Row-Level Security (RLS) enabled to ensure users can only access their own data.

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT
