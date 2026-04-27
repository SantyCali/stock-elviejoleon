# El Viejo León — Stock & Orders App

## Overview
React Native (Expo) app for managing stock and supplier orders for the business "El Viejo León". Supports two roles — **jefe** (boss) and **empleado** (employee) — with different feature access. Providers are filtered by delivery day on the home screen. Orders can be created, reviewed, and shared as PDF.

## Tech Stack
- **React Native 0.81.5** + **Expo 54**
- **Firebase 12** — Firestore (data) + Auth (authentication)
- **expo-sqlite 16** — local persistence for orders and products
- **React Navigation 7** — native-stack (full-screen flows) + drawer (main nav)
- **expo-print** + **expo-sharing** — generate and share order PDFs

## Project Structure
```
src/
├── config/          # Firebase initialization
├── navigation/      # AppNavigator.js (stack) + DrawerNavigator.js (drawer)
├── screens/         # All 12 screens
├── services/        # Data layer (Firebase + SQLite)
├── theme/           # Shared color palette (COLORS)
├── utils/           # Date helpers (getTodayName, getTodayLabel)
└── data/            # Static reference data
```

## Screens
| Screen | Purpose |
|---|---|
| LoginScreen / RegisterScreen | Auth flow |
| HomeScreen | Today's providers filtered by delivery day |
| ProvidersListScreen | All providers list |
| ProviderScreen | Provider detail + products grouped by category |
| StockScreen | Input stock quantities per product |
| NewOrderScreen / AddProductScreen | Create an order |
| OrderDetailScreen / ShareOrderScreen | View and export orders as PDF |
| OrderHistoryScreen | All past orders |
| ProviderOrderHistoryScreen | Last 5 orders for a specific provider |

## Services
| Service | Responsibility |
|---|---|
| `authService.js` | Firebase Auth: sign in, register, get/observe user, profile |
| `providerService.js` | Firestore CRUD for providers |
| `productService.js` | Firestore read for products by provider |
| `productAdminService.js` | Firestore write for adding products (jefe only) |
| `orderService.js` | Orders in Firestore + SQLite |
| `stockService.js` | Stock snapshots in Firestore |

## User Roles
Roles are stored in Firestore under each user's profile document and fetched with `getUserProfile(uid)`.

- **jefe**: create orders, add products, view full order history, last 5 orders per provider
- **empleado**: load stock only

Role checks are done in component state — fetch profile on mount, gate UI conditionally.

## Key Patterns
- `useFocusEffect` to reload data when navigating back to a screen
- `useMemo` to group products by category (sorted alphabetically)
- Day normalization with NFD + remove diacritics for reliable day-of-week matching (handles accented Spanish day names like "miércoles")
- Firebase Auth state observed in `AppNavigator` to conditionally render auth vs main stack — no manual token management needed

## Development
```bash
npm start        # Expo dev server (scan QR with Expo Go app)
npm run android  # Launch on Android emulator
npm run ios      # Launch on iOS simulator (Mac only)
npm run web      # Web preview (limited native features)
```

## Theme
Brand colors are defined in `src/theme/index.js`. The accent color is warm amber (`#D97706`) representing the lion brand. Use `COLORS` from this file instead of hardcoding hex values in screens.
