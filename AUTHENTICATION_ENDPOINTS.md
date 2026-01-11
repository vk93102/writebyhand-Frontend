# Authentication Endpoints - Updated with /api/ Prefix

## Overview
All authentication endpoints have been updated to use the `/api/` prefix and properly handle the new backend response format which includes user_id and token extraction.

## Authentication Endpoints

### 1. **User Registration / Signup**

**Endpoint:** `POST /api/auth/register/`

**Location:** [src/services/api.ts](src/services/api.ts#L649)

**Request:**
```json
{
  "username": "newuser1768079357",
  "email": "newuser1768079357@example.com",
  "password": "SecurePass123!",
  "full_name": "New Test User"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": 52,
    "username": "newuser1768079357",
    "email": "newuser1768079357@example.com",
    "full_name": "New Test User",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "created_at": "2026-01-10T21:09:18.772590+00:00"
  }
}
```

**Handler:** `registerUser(username, email, password, full_name)`

**What Happens:**
1. ✅ Extracts token from `data.token`
2. ✅ Extracts user_id from `data.user_id`
3. ✅ Stores token in AsyncStorage via `setAuthToken()`
4. ✅ Stores user_id via `setUserId()`
5. ✅ Returns response for UI to handle

**Console Logs:**
```
[Auth] POST /api/auth/register/ - Registering user: { username: "...", email: "...", full_name: "..." }
[Auth] Registration response: { success: true, data: {...} }
[Auth] Registration successful, token stored
```

---

### 2. **User Login**

**Endpoint:** `POST /api/auth/login/`

**Location:** [src/services/api.ts](src/services/api.ts#L684)

**Request (with email):**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request (with username):**
```json
{
  "username": "newuser1768079357",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 52,
    "username": "newuser1768079357",
    "email": "newuser1768079357@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "created_at": "2026-01-10T21:09:18.772590+00:00"
  }
}
```

**Handler:** `loginUser(usernameOrEmail, password)`

**What Happens:**
1. ✅ Auto-detects if input is email (contains @) or username
2. ✅ Sends appropriate payload
3. ✅ Extracts token and user_id
4. ✅ Stores both via `setAuthToken()` and `setUserId()`
5. ✅ Returns response for UI

**Console Logs:**
```
[Auth] POST /api/auth/login/ - Logging in user: { identifier: "email" }
[Auth] Login response: { success: true, data: {...} }
[Auth] Login successful, token and user ID stored
```

---

### 3. **Request Password Reset**

**Endpoint:** `POST /api/auth/request-password-reset/`

**Locations:**
- [src/services/api.ts](src/services/api.ts#L718)
- [src/services/pair-quiz/api.ts](src/services/pair-quiz/api.ts#L443)

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "email": "user@example.com",
    "reset_sent": true
  }
}
```

**Handler:** `requestPasswordReset(email)`

**What Happens:**
1. ✅ Validates and trims email input
2. ✅ Sends request to backend
3. ✅ Backend sends reset email to user
4. ✅ Returns confirmation response

**Console Logs:**
```
[Auth] POST /api/auth/request-password-reset/ - Requesting password reset for: user@example.com
[Auth] Password reset requested: { success: true, ... }
```

**Error Handling:**
- ✅ User not found → 404
- ✅ Invalid email format → 400
- ✅ Rate limited → 429

---

### 4. **Validate Reset Token**

**Endpoint:** `POST /api/auth/validate-reset-token/`

**Locations:**
- [src/services/api.ts](src/services/api.ts#L733)
- [src/services/pair-quiz/api.ts](src/services/pair-quiz/api.ts#L455)

**Request:**
```json
{
  "token": "reset_token_from_email"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "email": "user@example.com"
  }
}
```

**Handler:** `validateResetToken(token)`

**What Happens:**
1. ✅ Trims token
2. ✅ Validates token hasn't expired
3. ✅ Returns validity status and email

**Console Logs:**
```
[Auth] POST /api/auth/validate-reset-token/ - Validating reset token
[Auth] Reset token valid: { success: true, data: {...} }
```

**Error Handling:**
- ✅ Invalid token → 400
- ✅ Expired token → 401

---

### 5. **Reset Password**

**Endpoint:** `POST /api/auth/reset-password/`

**Locations:**
- [src/services/api.ts](src/services/api.ts#L747)
- [src/services/pair-quiz/api.ts](src/services/pair-quiz/api.ts#L467)

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "email": "user@example.com",
    "message": "Your password has been successfully reset"
  }
}
```

**Handler:** `resetPassword(token, newPassword)`

**What Happens:**
1. ✅ Trims token
2. ✅ Validates new password
3. ✅ Updates password in database
4. ✅ Returns success response

**Console Logs:**
```
[Auth] POST /api/auth/reset-password/ - Resetting password
[Auth] Password reset successful: { success: true, ... }
```

**Error Handling:**
- ✅ Invalid token → 400
- ✅ Weak password → 400
- ✅ Token expired → 401

---

## AuthService Implementation

### Email Signup
**Location:** [src/services/authService.ts](src/services/authService.ts#L101)

```typescript
async emailSignUp(name, email, password)
```

**What It Does:**
- Sends request to `/api/auth/signup/`
- Extracts token from response
- Stores token in SecureStore
- Returns user object

**Console Logs:**
```
[AuthService] POST /api/auth/signup/ - Signing up user: { name: "...", email: "..." }
[AuthService] Signup successful, user ID: 52
```

### Email Login
**Location:** [src/services/authService.ts](src/services/authService.ts#L132)

```typescript
async emailLogin(email, password)
```

**What It Does:**
- Sends request to `/api/auth/login/`
- Extracts token from response
- Stores token in SecureStore
- Returns authenticated user object

**Console Logs:**
```
[AuthService] POST /api/auth/login/ - Logging in user: { email: "..." }
[AuthService] Login successful, user ID: 52
```

---

## Token & User ID Storage

### Authentication Tokens
- **Stored in:** AsyncStorage / SecureStore
- **Key:** `ACCESS_TOKEN_KEY` (auth_token)
- **Used for:** API requests via Authorization header
- **Format:** Bearer token (JWT)

### User ID
- **Stored in:** AsyncStorage / SecureStore  
- **Key:** `USER_ID_KEY` (user_id)
- **Used for:** X-User-ID header in API requests
- **Extracted from:** Response `data.user_id`

### Storage Functions
```typescript
// Set token
await setAuthToken(token)  // Stores token + sets header

// Set user ID
await setUserId(userId.toString())  // Stores ID + sets X-User-ID header

// Retrieve
const token = await getAuthToken()
const userId = await getUserId()
```

---

## Response Format Handling

### New Backend Format
All authentication endpoints now return:
```json
{
  "success": true,
  "message": "...",
  "data": {
    "user_id": 52,
    "token": "eyJ...",
    "email": "user@example.com",
    ...
  }
}
```

### Token Extraction
```typescript
const token = data?.token || data?.data?.token || (data?.data && data?.data?.access_token);
```

### User ID Extraction
```typescript
const userId = data?.data?.user_id || data?.user_id;
```

### Fallback Handling
- ✅ If `data.token` exists, uses it
- ✅ If `data.data.token` exists, uses it
- ✅ If `data.data.access_token` exists, uses it
- ✅ Handles both wrapped and unwrapped formats

---

## API Configuration

### Base URL
```typescript
const PRODUCTION_API_URL = 'https://ed-tech-backend-tzn8.onrender.com/api';
```

### Auth Headers
All requests include:
- `Content-Type: application/json`
- `X-User-ID: {userId}` (added via interceptor)
- `Authorization: Bearer {token}` (added via interceptor)

### Timeout
- Default: 60 seconds
- Extended for AI operations: 120 seconds

---

## Error Handling

### Status Codes
- **200:** Success
- **400:** Invalid input / validation error
- **401:** Unauthorized / token expired / invalid token
- **404:** User not found
- **429:** Rate limited
- **500:** Server error

### Error Response Format
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "The email or password you entered is incorrect"
}
```

### Handler Error Logs
```
[Auth] Login error: {
  status: 401,
  message: "Invalid credentials",
  endpoint: "POST /api/auth/login/"
}
```

---

## Testing Checklist

### Test Signup
```
1. Open DevTools Console
2. Filter for [Auth] or [AuthService]
3. Click Sign Up button
4. Provide: username, email, password, full name
5. Should see:
   - POST /api/auth/register/ in Network tab
   - Token stored in AsyncStorage
   - User redirected to dashboard
```

### Test Login
```
1. Open DevTools Console
2. Filter for [Auth]
3. Enter email (or username) and password
4. Click Login button
5. Should see:
   - POST /api/auth/login/ in Network tab
   - Both token and user ID stored
   - User redirected to dashboard
```

### Test Forgot Password Flow
```
1. Click "Forgot Password"
2. Enter email
3. Should see: POST /api/auth/request-password-reset/ request
4. Check email for reset link
5. Click link → Should validate token
6. Should see: POST /api/auth/validate-reset-token/ request
7. Enter new password
8. Submit → Should see: POST /api/auth/reset-password/ request
9. Should be redirected to login
```

---

## Status

✅ **All authentication endpoints updated**
✅ **Token and user ID extraction working**
✅ **Comprehensive logging in place**
✅ **Error handling with detailed logs**
✅ **Zero TypeScript errors**
✅ **Ready for production use**
