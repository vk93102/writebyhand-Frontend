// ============================================================================
// BACKEND REQUIREMENTS FOR PROFILE LOCK SYSTEM
// ============================================================================

// Endpoint Required:
// GET /subscription/check/:userId

// Request:
// --------
// Headers:
//   X-User-ID: <userId>
//   Content-Type: application/json

// Response (Success - 200 OK):
// ────────────────────────────
// {
//   "isPremium": true
// }
// or
// {
//   "isPremium": false
// }

// Response (Error - Handle gracefully):
// ─────────────────────────────────────
// Default to isPremium = false if request fails
// This allows users to see "Upgrade" option as fallback

// Integration Flow:
// ─────────────────
// 1. App loads profile page → RenderProfilePage called
// 2. RenderProfilePage makes GET request to /subscription/check/:userId
// 3. Backend checks user subscription status in database
// 4. Backend returns { isPremium: true/false }
// 5. App shows lock icon or premium features based on response

// Lock System Behavior:
// ─────────────────────
// FREE USER (isPremium: false):
//  - Red lock badge on avatar
//  - "Free User" status
//  - "Subscribe to unlock" card shows
//  - 4 features listed for upgrade
//  - Pricing info displayed (₹1 first month, then ₹99/month)

// PREMIUM USER (isPremium: true):
//  - NO lock badge on avatar
//  - Green checkmark badge (✓)
//  - "Premium Member" status
//  - "Subscribe to unlock" card HIDDEN
//  - Premium benefits section shows (5 benefits)
//  - All features accessible

// Refresh Behavior:
// ─────────────────
// - Profile page checks every 3 seconds for subscription updates
// - Allows users to see lock disappear after purchase
// - No need for page refresh

// Error Handling:
// ───────────────
// If /subscription/check fails:
//  - defaulted to isPremium = false
//  - Shows "Upgrade" option
//  - User can still click "Subscribe Now"
//  - Graceful degradation

// Database Fields Needed:
// ──────────────────────
// User collection/table should have:
//  - userId: string (primary key)
//  - isPremium: boolean
//  - subscriptionStatus: 'active' | 'expired' | 'canceled'
//  - subscriptionExpiryDate: ISO 8601 timestamp
//  - planName: string (e.g., 'Premium', 'Basic')
//  - paymentMethod: string (for tracking - optional)

// Update Subscription Flow:
// ────────────────────────
// When user completes payment:
//  1. Razorpay webhook received
//  2. Backend updates user document:
//     {
//       isPremium: true,
//       subscriptionStatus: 'active',
//       subscriptionExpiryDate: future_date,
//       planName: 'Premium'
//     }
//  3. Next profile page refresh → GET /subscription/check/:userId
//  4. Returns { isPremium: true }
//  5. Lock icon disappears automatically
