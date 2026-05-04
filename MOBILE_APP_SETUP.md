# AppStudio Mobile App Setup Guide

## Project Structure

```
appstudio-mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── verify-email.tsx
│   ├── (app)/
│   │   ├── (tabs)/
│   │   │   ├── projects.tsx
│   │   │   ├── deployments.tsx
│   │   │   ├── analytics.tsx
│   │   │   └── profile.tsx
│   │   ├── project/
│   │   │   ├── [id].tsx
│   │   │   └── create.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── ProjectCard.tsx
│   ├── DeploymentStatus.tsx
│   ├── AnalyticsChart.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useSync.ts
│   └── useNotifications.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── sync.ts
│   ├── storage.ts
│   └── notifications.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── SyncContext.tsx
│   └── NotificationContext.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   └── validators.ts
├── app.json
├── package.json
├── tsconfig.json
└── eas.json
```

## Setup Instructions

### 1. Initialize React Native Project

```bash
npx create-expo-app appstudio-mobile
cd appstudio-mobile
npx expo install expo-router
npx expo install react-native-screens react-native-safe-area-context
```

### 2. Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @trpc/client @trpc/react-query
npm install @tanstack/react-query
npm install zustand
npm install axios
npm install react-native-async-storage
npm install react-native-push-notifications
npm install react-native-netinfo
npm install date-fns
npm install zod
```

### 3. Configure Firebase for Push Notifications

- Create Firebase project
- Add iOS and Android apps
- Download google-services.json (Android)
- Download GoogleService-Info.plist (iOS)

### 4. Build Configuration

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

### 5. Submit to App Stores

#### App Store (iOS)
```bash
eas submit --platform ios
```

#### Google Play (Android)
```bash
eas submit --platform android
```

## Key Features

### Authentication
- OAuth with Manus
- Email/Password login
- Biometric authentication
- Session persistence

### Project Management
- View all projects
- Create new projects
- Edit project settings
- Delete projects
- Real-time sync

### Deployments
- Monitor deployment status
- View deployment logs
- Rollback deployments
- View deployment history

### Analytics
- View key metrics
- Track usage statistics
- Performance monitoring
- Revenue tracking

### Notifications
- Push notifications for deployments
- In-app notifications
- Notification preferences
- Notification history

## Data Synchronization

### Offline Support
- Local caching with AsyncStorage
- Offline queue for mutations
- Automatic sync when online
- Conflict resolution

### Real-time Updates
- WebSocket connection
- Live deployment status
- Instant notifications
- Bi-directional sync

## Security

- Secure token storage
- HTTPS only
- Certificate pinning
- Encrypted local storage
- Biometric authentication

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Build for testing
npm run build:test
```

## Deployment

### Development
```bash
eas build --platform all --profile preview
```

### Production
```bash
eas build --platform all --profile production
eas submit --platform all
```

## Monitoring

- Sentry for crash reporting
- Firebase Analytics
- Custom event tracking
- Performance monitoring
