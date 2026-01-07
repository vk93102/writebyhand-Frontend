# ED Tech Solver - React Native Mobile App

A cross-platform mobile application for solving educational questions using AI, web search, and YouTube tutorials. Built with React Native (Expo) and TypeScript.

## Features

- 📝 **Text Input**: Enter questions directly
- 📸 **Image Upload**: Scan questions from photos using camera or gallery
- 🤖 **AI Solutions**: Get instant AI-generated answers
- 🔍 **Web Search**: Relevant search results from the web
- 🎥 **Video Tutorials**: YouTube videos related to your question
- 📊 **Confidence Scoring**: AI confidence level for each answer
- 🎨 **Modern UI**: Clean white and blue theme with smooth animations

## Platforms

- ✅ iOS (Native)
- ✅ Android (Native)
- ✅ Web (via React Native Web)

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode 14+ (macOS only)
- For Android: Android Studio with Android SDK
- Backend API running on `http://localhost:8003`

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd EdTechMobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend API**
   Navigate to the backend directory and start the FastAPI server:
   ```bash
   cd ../backend
   python manage.py runserver 8003
   ```

## Running the App

### Start Development Server
```bash
npm start
```

This will open Expo Dev Tools in your browser.

### Run on Specific Platforms

**iOS (macOS only)**
```bash
npm run ios
```
Or press `i` in the terminal after running `npm start`

**Android**
```bash
npm run android
```
Or press `a` in the terminal after running `npm start`

**Web**
```bash
npm run web
```
Or press `w` in the terminal after running `npm start`

### Using Expo Go App (Physical Devices)

1. Install Expo Go on your device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run `npm start`

3. Scan the QR code:
   - **iOS**: Use Camera app to scan
   - **Android**: Use Expo Go app to scan

## Project Structure

```
EdTechMobile/
├── App.tsx                    # Main app component with navigation
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript configuration
└── src/
    ├── components/
    │   ├── TextInput.tsx     # Text question input component
    │   ├── ImageUpload.tsx   # Image picker with camera/gallery
    │   └── Results.tsx       # Display results (AI, web, YouTube)
    ├── services/
    │   └── api.ts            # API client for backend communication
    └── styles/
        └── theme.ts          # Design system (colors, spacing, typography)
```

## Configuration

### API Endpoint

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8003/api';
```

**Note for Physical Devices**: Replace `localhost` with your computer's local IP address:
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:8003/api';
```

Find your IP:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`
- Linux: `ip addr show`

### Permissions

The app requires the following permissions:

**iOS** (configured in `app.json`):
- Camera access
- Photo library access

**Android** (configured in `app.json`):
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### Web
```bash
npm run build
```

## Components Overview

### TextInput Component
- Multiline text input with character counter
- Submit button with loading state
- Character limit display

### ImageUpload Component
- Camera capture support
- Gallery selection
- Image preview with remove option
- Automatic permission requests

### Results Component
- Extracted text display
- AI-generated solution
- Web search results (top 3)
- YouTube video links (top 3)
- Confidence score badge

## Styling

The app uses a centralized theme system (`src/styles/theme.ts`):

- **Colors**: White (#FFFFFF) and Blue (#3B82F6) palette
- **Spacing**: 8pt grid system
- **Typography**: Consistent font sizes and weights
- **Shadows**: Platform-specific elevation
- **Border Radius**: Consistent rounding (4px, 8px, 12px, 16px)

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --clear
```

### iOS Build Errors
```bash
cd ios && pod install && cd ..
```

### Android Build Errors
```bash
cd android && ./gradlew clean && cd ..
```

### Network Errors
- Ensure backend is running on correct port
- Check firewall settings
- For physical devices, use local IP instead of localhost

## Development Tips

1. **Hot Reload**: Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS) for dev menu
2. **Debug**: Use React Native Debugger or Chrome DevTools
3. **Logs**: Check terminal output or device logs in Expo Dev Tools
4. **API Testing**: Test backend endpoints with Postman before mobile testing

## Next Steps

- [ ] Add user authentication
- [ ] Implement history/saved questions
- [ ] Add offline support
- [ ] Support multiple languages
- [ ] Add dark mode theme
- [ ] Implement push notifications

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please contact the development team.
# Frontend-Edtech
