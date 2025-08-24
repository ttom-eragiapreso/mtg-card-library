# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MTG Card Library is a Next.js 15 application for managing Magic: The Gathering card collections. It integrates with the MTG API for card data, uses MongoDB for data persistence, Google OAuth for authentication, and provides camera-based card scanning capabilities.

## Quick Development Commands

```bash
# Development with Turbopack (faster builds)
npm run dev

# Production build with Turbopack
npm run build
npm start

# Linting
npm run lint

# Install dependencies
npm install
```

## Environment Setup

The application requires a `.env.local` file with:
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` for NextAuth.js
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth
- `MONGODB_URI` for database connection
- `MTG_API_BASE_URL` (optional, defaults to official MTG API)

Generate NextAuth secret: `openssl rand -base64 32`

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS with DaisyUI theme framework
- **Authentication**: NextAuth.js with Google OAuth and MongoDB adapter
- **Database**: MongoDB with collections for cards and user collections
- **External API**: Scryfall API (10 requests/second, more current data)
- **Camera**: HTML5 Camera API with react-camera-pro

### Core Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   └── cards/         # Card search/filter endpoints
│   ├── layout.js          # Root layout with session provider
│   └── page.js            # Homepage with search/scan interface
├── components/            # Reusable UI components
│   ├── MTGCard.js        # Main card display (default & compact variants)
│   ├── CardSearch.js     # Card search interface
│   ├── AdvancedCardSearch.js # Advanced filtering
│   ├── CameraScanner.js  # Mobile camera scanning
│   ├── ManaCost.js       # Mana symbol display
│   └── Navigation.js     # App navigation with auth
└── lib/                   # Server utilities and configurations
    ├── auth.js            # NextAuth configuration
    ├── mongodb.js         # Database connection
    ├── models.js          # Database collections and schemas
    ├── mtg-api.js         # MTG API integration with rate limiting
    └── collection-actions.js # Server actions for collection management
```

### Database Schema

**Cards Collection** (cached MTG API data):
- Card data from MTG API with indexes on name, set, types, colors, rarity, cmc
- Text search index on name and card text

**UserCollections Collection**:
- User-specific card data with quantity, condition, foil status, notes, acquisition info
- Supports foil tracking for value estimation
- Indexed by userId and cardId for fast lookups

## Key Architectural Patterns

### Authentication Flow
- Uses NextAuth.js with MongoDB adapter for session storage
- Google OAuth provider with custom callbacks for user ID management
- Server-side session checking via `getServerSession(authOptions)`

### Server Actions Pattern
All collection management uses Next.js server actions in `collection-actions.js`:
- `addCardToCollection()` - Handles card addition with duplicate checking
- `removeCardFromCollection()` - Safe removal with user verification
- `getUserCollection()` - Enriched collection data with card details
- Auto-revalidation of affected routes

### MTG API Integration
Rate-limited API client with:
- Request counting (5000/hour limit)
- Error handling for timeouts and rate limits
- Axios interceptors for automatic error translation
- Multiple search methods (by name, filters, card ID)

### Component Variants
MTGCard component supports multiple display modes:
- `default` - Full card view with image, details, and add button
- `compact` - Condensed list view for search results
- Automatic image fallback from MTG API to Gatherer images

## Development Patterns

### State Management
- Client components use useState for local state
- Server actions handle all database operations
- Session state managed by NextAuth provider

### Styling Approach
- TailwindCSS with DaisyUI component framework
- Uses "fantasy" theme as default
- Responsive design with mobile-first camera scanning
- Semantic color classes for card rarity display

### Error Handling
- Server actions return `{ success, error }` objects
- Client components handle loading states with DaisyUI loading classes
- API routes use standardized error responses

### Mobile Optimization
- Camera scanning designed for mobile devices
- Responsive navigation with hamburger menu
- Touch-friendly card interaction

## Common Development Tasks

### Adding New Card Filters
1. Update `searchCardsWithFilters()` in `mtg-api.js`
2. Add filter parameters to `advanced-search/route.js`
3. Extend AdvancedCardSearch component UI
4. Update database indexes if needed

### Modifying Collection Data
1. Update schema in `models.js`
2. Modify server actions in `collection-actions.js`
3. Update relevant components (MTGCard, collection views)
4. Consider migration scripts for existing data

### Adding New Routes
1. Create route files in `src/app/` following App Router conventions
2. Add navigation links in `Navigation.js`
3. Implement server-side authentication checks
4. Update `revalidatePath` calls in server actions

### Database Maintenance
Run `createIndexes()` from `models.js` to ensure optimal query performance.

## API Rate Limiting

The MTG API has a 5000 requests/hour limit. The app implements:
- Request counting with automatic reset
- Graceful error handling for rate limit exceeded
- Efficient caching of card data in MongoDB

## Testing Notes

The application uses:
- ESLint for code linting
- No formal testing framework currently implemented
- Manual testing recommended for camera functionality on actual mobile devices

## Deployment Considerations

- Designed for Vercel deployment
- Requires MongoDB Atlas or equivalent for production
- Environment variables must be configured in deployment platform
- Google OAuth redirect URIs must include production domain
