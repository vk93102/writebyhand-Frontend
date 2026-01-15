#!/bin/bash
# Unity Ads Implementation - Command Reference
# Copy and paste these commands in order

echo "======================================"
echo "Unity Ads Implementation Commands"
echo "======================================"

# STEP 1: Verify app.json exists
echo ""
echo "STEP 1: Update app.json"
echo "========================"
echo "Edit app.json and add to expo.plugins section:"
echo ""
echo '  "plugins": ['
echo '    ['
echo '      "react-native-unity-ads",'
echo '      {'
echo '        "iosGameId": "6018265",'
echo '        "androidGameId": "6018264"'
echo '      }'
echo '    ]'
echo '  ]'
echo ""
echo "Press ENTER when done..."

# STEP 2: Test on web
echo ""
echo "STEP 2: Test on Web"
echo "==================="
echo "Running command: npm start"
echo ""
echo "Then:"
echo "  1. Press 'w' for web"
echo "  2. Open browser console (F12)"
echo "  3. Look for logs like: [Premium] Initializing context"
echo "  4. Look for logs like: [AdsManager] Initialization successful"
echo ""
echo "Press ENTER to continue..."

# STEP 3: Example feature integration
echo ""
echo "STEP 3: Feature Integration"
echo "============================"
echo ""
echo "Example: Daily Quiz Submit"
echo ""
echo "1. Open src/components/DailyQuizScreen.tsx"
echo ""
echo "2. Add import:"
echo "   import { useFeatureWithAd } from '../hooks/useFeatureWithAd';"
echo ""
echo "3. In component, add:"
echo "   const { executeFeature } = useFeatureWithAd();"
echo ""
echo "4. Wrap your submit function:"
echo "   await executeFeature("
echo "     async () => { /* existing code */ },"
echo "     { featureName: 'daily-quiz-submit', delayBeforeAd: 1000 }"
echo "   );"
echo ""
echo "See FEATURE_AD_INTEGRATION_GUIDE.md for all examples"
echo ""
echo "Press ENTER when done with features..."

# STEP 4: Build commands
echo ""
echo "STEP 4: Build for Device"
echo "========================="
echo ""
echo "For iOS:"
echo "  eas build --platform ios"
echo ""
echo "For Android:"
echo "  eas build --platform android"
echo ""
echo "Then install on devices and test"
echo ""
echo "Press ENTER when ready to build..."

# STEP 5: Verification
echo ""
echo "STEP 5: Verification"
echo "===================="
echo ""
echo "On iOS Device:"
echo "  ✓ Complete a feature"
echo "  ✓ Should see real Unity Ads"
echo "  ✓ App resumes after ad"
echo ""
echo "On Android Device:"
echo "  ✓ Complete a feature"
echo "  ✓ Should see real Unity Ads"
echo "  ✓ App resumes after ad"
echo ""
echo "Test Premium User:"
echo "  ✓ Temporarily return premium: true from API"
echo "  ✓ Should see NO ads"
echo ""
echo "Test Rate Limiting:"
echo "  ✓ Complete feature, watch ad"
echo "  ✓ Try another feature immediately"
echo "  ✓ Should see NO ad (rate limited)"
echo "  ✓ Wait 30+ seconds"
echo "  ✓ Try again, should see ad"
echo ""
echo "======================================"
echo "All steps complete! 🎉"
echo "======================================"

# Additional useful commands
echo ""
echo "Useful commands:"
echo "  npm start              - Start dev server"
echo "  eas build --status     - Check build status"
echo "  eas build --platform ios --profile preview"
echo "  eas build --platform android --profile preview"
echo ""
echo "View detailed logs:"
echo "  UNITY_ADS_VERIFICATION_GUIDE.md"
echo ""
echo "Code examples:"
echo "  FEATURE_AD_INTEGRATION_GUIDE.md"
echo ""
