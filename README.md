# Recipe App - React Native

Mobile recipe management app built with React Native and Firebase.

## Features

- User authentication (Email/Password)
- Search and filter recipes
- View recipe details
- Create, edit, and delete recipes
- Add recipes to favorites
- Image upload for recipes

## Tech Stack

- React Native 0.82+
- React 19+
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- React Navigation 6
- React Native Gesture Handler
- React Native Reanimated

## Requirements

- Node.js >= 20
- iOS: Xcode, CocoaPods
- Android: Android Studio, JDK
- Firebase project with configured services

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Enable Storage
   - Copy `.env.example` to `.env` and add your Firebase credentials
4. iOS setup:
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```
5. Run the app:
   ```bash
   npm start
   npm run ios    # or npm run android
   ```

## Project Structure

```
src/
├── components/      # Reusable components
├── config/          # Configuration
├── context/         # React Context
├── navigation/      # Navigation
├── screens/         # Screens
└── types/           # TypeScript types
```

## Firebase Setup

### Firestore Collections

- **users**: User information
- **recipes**: Recipe data

### Security Rules

Configure Firestore and Storage security rules in Firebase Console to allow authenticated users to read/write their own data.


