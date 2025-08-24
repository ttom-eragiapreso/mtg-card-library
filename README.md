# MTG Card Library 🃏

A modern web application for managing your Magic: The Gathering card collection. Built with Next.js, featuring Google OAuth authentication, camera-based card scanning, and comprehensive collection management.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with your Google account
- 🔍 **Card Search** - Search through all Magic: The Gathering cards using the official MTG API
- 📱 **Camera Scanning** - Scan physical cards using your mobile camera (mobile-first design)
- 📚 **Collection Management** - Add, remove, and organize your card collection
- 🏷️ **Advanced Filters** - Filter cards by type, color, rarity, mana cost, and more
- 💾 **MongoDB Storage** - Persistent storage for user collections and card data
- 🎨 **Beautiful UI** - Built with TailwindCSS and DaisyUI components
- 📊 **Collection Stats** - Track your collection size, value, and statistics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, DaisyUI
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB with MongoDB Adapter
- **API Integration**: Magic: The Gathering API
- **Camera**: HTML5 Camera API with image processing
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)
- Google OAuth credentials

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd mtg-proj
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-a-random-string

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mtg-library
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mtg-library

# MTG API
MTG_API_BASE_URL=https://api.magicthegathering.io/v1
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env.local`

### 5. MongoDB Setup

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/mtg-library`

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and add to `.env.local`
4. Whitelist your IP address

### 6. Generate NextAuth Secret

```bash
# Generate a random secret
openssl rand -base64 32
```

Add the generated secret to `NEXTAUTH_SECRET` in your `.env.local`

### 7. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   │   ├── auth/        # NextAuth endpoints
│   │   └── cards/       # Card search endpoints
│   ├── layout.js        # Root layout
│   ├── page.js          # Homepage
│   └── providers.js     # Session provider
├── components/          # React components
│   ├── AdvancedCardSearch.js
│   ├── CameraScanner.js
│   ├── CardSearch.js
│   ├── ManaCost.js
│   ├── ManaSymbol.js
│   ├── MTGCard.js
│   └── Navigation.js
└── lib/                 # Utilities and configurations
    ├── auth.js          # NextAuth configuration
    ├── collection-actions.js # Server actions
    ├── models.js        # Database models
    ├── mongodb.js       # MongoDB connection
    └── mtg-api.js       # MTG API integration
```

## Key Features Explained

### Card Search
- Real-time search through the MTG API
- Support for partial name matching
- Display of multiple card versions/printings
- Integration with collection status

### Camera Scanning
- Mobile-optimized camera interface
- Image capture and processing
- Automatic card recognition (demo implementation)
- Fallback to manual entry

### Collection Management
- Add cards with quantity, condition, and notes
- Update existing entries
- Remove cards from collection
- Server-side data persistence

### Advanced Filtering
- Filter by card colors, types, subtypes
- Mana cost range filtering
- Rarity and set filtering
- Combines multiple filter criteria

## API Integration

The app integrates with the [Magic: The Gathering API](https://docs.magicthegathering.io/):

- Rate limit: 5000 requests/hour
- No API key required
- Comprehensive card database
- Real-time card information

## Database Schema

**Users Collection** (managed by NextAuth)
- User authentication data
- Google profile information

**Cards Collection**
- MTG card data from API
- Cached for performance
- Indexed for fast searching

**UserCollections Collection**
- User-specific card collections
- Quantity, condition, notes
- Purchase information

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

1. Build the application: `npm run build`
2. Upload to your hosting provider
3. Set environment variables
4. Start with `npm start`

## Future Enhancements

- [ ] Advanced card image recognition with OCR
- [ ] Collection value tracking and price updates
- [ ] Deck builder integration
- [ ] Trading features with other users
- [ ] Collection statistics and analytics
- [ ] Export/import functionality
- [ ] Mobile app (React Native)
- [ ] Wishlist management
- [ ] Collection sharing and social features

---

Built with ❤️ by the MTG community
