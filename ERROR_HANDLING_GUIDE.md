# AinaAi Production-Grade Error Handling & Retry Logic

## Overview

This document describes the comprehensive error handling, retry logic, and rate limiting system implemented in AinaAi Cloud Functions and frontend to ensure production-grade reliability and user experience.

## Architecture

### Backend Components (Cloud Functions)

#### 1. **Logger Utility** (`functions/utils/logger.js`)
Centralized error logging system that captures, classifies, and stores errors.

**Features:**
- **Error Codes**: Standardized error codes for client-side handling
  - `INVALID_IMAGE_MIME` - Wrong image format
  - `INVALID_IMAGE_SIZE` - Image exceeds max size
  - `INVALID_IMAGE_DIMENSIONS` - Image too small for face detection
  - `API_TIMEOUT` - YouCam API timeout
  - `API_RATE_LIMITED` - API rate limit exceeded
  - `QUOTA_EXCEEDED` - User daily quota exceeded
  - `UNAUTHENTICATED` - User not logged in
  - And more...

- **Severity Levels**: `low`, `medium`, `high` for operational monitoring
- **Firestore Logging**: All errors logged to `error_logs` collection with:
  - User ID for tracking per-user issues
  - Error code and message
  - Stack traces for debugging
  - Metadata (context, original error)
  - Timestamp for trend analysis

**Usage:**
```javascript
await logError({
  userId: context.auth.uid,
  errorCode: ERROR_CODES.API_TIMEOUT,
  message: "YouCam API timeout after retries",
  context: "analyzeSkin",
  severity: SEVERITY.HIGH,
  error: originalError,
  metadata: { attempts: 4, lastError: "..." }
});
```

#### 2. **Validation Utility** (`functions/utils/validation.js`)
Pre-flight validation for image inputs before calling YouCam API.

**Validations:**
- **MIME Type**: Only JPG and PNG allowed
- **File Size**: Maximum 10MB (checked in bytes)
- **Image Dimensions**: Minimum 300x300px for reliable face detection

**Error Messages**: User-friendly messages explaining what's wrong and how to fix it

**Usage:**
```javascript
const validation = validateImage({
  mimeType: file.type,
  size: file.size,
  width: 1920,
  height: 1080
});

if (!validation.valid) {
  throw new Error(validation.error); // "Image too large (15.5MB). Maximum size is 10MB."
}
```

#### 3. **Rate Limiter** (`functions/utils/rateLimiter.js`)
Per-user quota enforcement to prevent abuse and manage API costs.

**Quotas:**
- **Analyses**: 10 per user per day
- **Outfit Try-ons**: 20 per user per day
- **Reset**: Daily at midnight (24-hour window)

**Implementation:**
- Stores last activity timestamp and count in `users` collection
- Increments counter on successful analysis
- Returns remaining quota and reset time
- Returns HTTP 429 when exceeded

**Functions:**
- `checkAnalysisRateLimit(userId)` - Check if user can analyze
- `incrementAnalysisCount(userId)` - Increment after success
- `checkOutfitRateLimit(userId)` - Check outfit quota
- `incrementOutfitCount(userId)` - Increment after success

#### 4. **Retry Logic** (`functions/utils/retry.js`)
Exponential backoff retry mechanism for transient failures.

**Configuration:**
- **Max Retries**: 3 attempts
- **Initial Backoff**: 2 seconds
- **Backoff Multiplier**: 2x (exponential)
- **Pattern**: 2s, 4s, 8s between retries
- **Max Backoff**: 32 seconds

**Error Classification:**
- **Transient**: Network timeouts, 5xx errors, rate limits (retried)
- **Permanent**: Auth errors, bad requests, invalid input (not retried)

**Functions:**
```javascript
// Retry a function with backoff
await retryWithBackoff(
  () => callYouCamAPI(payload),
  { context: "analyzeSkin", userId, maxRetries: 3 }
);

// Retry polling for long-running tasks
await retryPolling(
  async () => pollYouCamStatus(taskId),
  { context: "YouCam polling", maxPollSeconds: 300 }
);
```

**Logging:**
- Logs each retry attempt with backoff delay
- Logs final failure with total attempts
- Tracks which errors are transient vs permanent

### Enhanced Cloud Functions

All four main functions (`analyzeSkin`, `tryOnApparel`, `getAnalysisHistory`, `getOutfitHistory`) now include:

1. **Authentication Check** - Verify user is logged in
2. **Input Validation** - Check required parameters
3. **Rate Limiting** - Check daily quota
4. **API Call with Retry** - Call YouCam API with exponential backoff
5. **Error Handling** - Map errors to user-friendly messages
6. **Logging** - Log all errors to Firestore for monitoring

**Error Response Mapping:**
```javascript
- Timeout → "Analysis took too long. Please try with a clearer photo."
- Rate Limited → "API rate limited. Please wait and try again."
- Invalid Image → "Invalid image. Please ensure photo is JPG or PNG."
- Quota Exceeded → "You've reached your daily limit. Try again tomorrow."
- Authentication → "You must be logged in."
```

### Frontend Components

#### 1. **Error Boundary** (`src/components/ErrorBoundary.jsx`)
React Error Boundary that catches component-level errors.

**Features:**
- Catches React rendering errors
- Shows user-friendly error UI
- Displays error details in development mode
- Provides retry and home navigation options
- Logs errors for debugging

**Usage:**
```jsx
<ErrorBoundary onRetry={handleRetry}>
  <YourComponent />
</ErrorBoundary>
```

#### 2. **Error Display Component** (`src/components/ErrorDisplay.jsx`)
Reusable component for displaying operation errors with helpful guidance.

**Features:**
- Maps error codes to user-friendly titles and guidance
- Shows helpful icons and messages
- Retry and dismiss buttons
- Development mode shows error codes
- Responsive design

**Error Code Mapping:**
- `INVALID_IMAGE_MIME` → "Invalid Image Format"
- `API_TIMEOUT` → "Analysis Taking Too Long"
- `QUOTA_EXCEEDED` → "Daily Limit Reached"
- And more...

**Usage:**
```jsx
<ErrorDisplay 
  error={error}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  context="skin analysis"
/>
```

#### 3. **Enhanced useSkinAnalysis Hook** (`src/hooks/useSkinAnalysis.js`)
Hook with comprehensive error handling and retry capability.

**Features:**
- Pre-flight validation (auth, file type, size)
- Error parsing and classification
- Retry counter tracking
- Clear error function
- Reset functionality

**Returned State:**
```javascript
{
  loading,        // Boolean: is operation in progress
  result,         // Analyzed skin data or null
  error,          // Error object with code and message or null
  retryCount,     // Number of retry attempts
  analyze,        // Main analysis function
  retry,          // Retry with same file
  clearError,     // Clear error state
  reset           // Reset all state
}
```

**Error Object Structure:**
```javascript
{
  code: "QUOTA_EXCEEDED",
  message: "You've reached your daily analysis limit",
  userFriendly: true
}
```

#### 4. **Enhanced Upload Section** (`src/components/UploadSection.jsx`)
Updated to use new error handling components.

**Enhancements:**
- Integrates `ErrorDisplay` component
- Supports retry on error with same file
- Combines validation and analysis errors
- Shows loading state with details
- Clear separation between validation and API errors

## Error Handling Flow

### Skin Analysis Flow

```
1. User selects image
   ↓
2. Frontend validation (MIME type, size)
   ↓ (Pass)
3. Upload to Firebase Storage
   ↓
4. Call analyzeSkin Cloud Function
   ├─ Auth check
   ├─ Rate limit check
   ├─ Call YouCam API (with retry: 3x with backoff)
   │  ├─ Exponential backoff: 2s, 4s, 8s
   │  ├─ On transient error: retry
   │  └─ On permanent error: fail immediately
   ├─ Save to Firestore
   └─ Return result
   ↓
5. Display results or error
   ├─ User-friendly error message
   ├─ Retry button (if retryable)
   └─ Helpful guidance
```

### Error Recovery by Type

**Transient Errors (Retried with Backoff):**
- Network timeouts → Retry
- 5xx server errors → Retry
- Rate limits (429) → Retry with longer backoff
- Temporary unavailability → Retry

**Permanent Errors (Not Retried):**
- Authentication (401, 403) → Show login prompt
- Bad request (400) → Show validation error
- Not found (404) → Show error message
- Invalid API key → Alert admin

**User-Facing Errors:**
- Validation errors → Show immediately, don't retry
- Rate limit exceeded → Show reset time, disable button
- Quota exceeded → Show daily limit message
- Timeout after retries → Suggest clearer photo

## Firestore Collections for Monitoring

### `error_logs` Collection
Stores all errors for monitoring and debugging:
```javascript
{
  userId: string,              // User ID or "anonymous"
  errorCode: string,           // Standardized error code
  message: string,             // User-friendly message
  context: string,             // Where error occurred
  severity: "low|medium|high", // Error severity
  timestamp: Timestamp,        // When error occurred
  stack: string,               // Stack trace
  originalError: string,       // Original error message
  metadata: object,            // Additional context
  userAgent: string            // Browser info
}
```

### `users` Collection
Stores rate limiting counters:
```javascript
{
  analysisCount: number,              // Analyses this period
  lastAnalysisTime: Timestamp,        // Last analysis time
  outfitCount: number,                // Outfit tries this period
  lastOutfitTime: Timestamp,          // Last outfit try time
  // ... other user data
}
```

## Monitoring & Operations

### Key Metrics to Track

1. **Error Rate by Code**
   - Query: `error_logs where severity = 'high'`
   - Alert on: Unexpected spikes

2. **Timeout Percentage**
   - Query: `error_logs where errorCode = 'API_TIMEOUT'`
   - Target: < 1% of all requests

3. **Rate Limit Hits**
   - Query: `error_logs where errorCode = 'QUOTA_EXCEEDED'`
   - Indicates: User demand or abuse

4. **Retry Success Rate**
   - Query: `error_logs where metadata.attempts > 1`
   - Indicates: Transient error frequency

### Firestore Rules for Error Logs

```javascript
// Allow only authenticated users to read their own errors
match /error_logs/{document=**} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth != null;
}
```

## Best Practices

### For Developers

1. **Always log errors** with appropriate context
   ```javascript
   await logError({
     userId,
     errorCode: ERROR_CODES.SPECIFIC_ERROR,
     message: "User-friendly message",
     context: "functionName",
     severity: SEVERITY.MEDIUM,
     error: originalError
   });
   ```

2. **Classify errors correctly**
   - Use `isTransientError()` to check if should retry
   - Use `isPermanentError()` to fail fast

3. **Provide helpful error messages**
   - Explain what went wrong
   - Suggest how to fix it
   - Don't expose technical details to users

4. **Test error scenarios**
   - Timeout after max retries
   - Rate limits and quotas
   - Invalid input validation
   - Authentication failures

### For Operations

1. **Monitor error logs regularly**
   - Set up alerts for high-severity errors
   - Watch error rates by type
   - Correlate with traffic patterns

2. **Scale rate limits based on usage**
   - Adjust daily quotas if needed
   - Add premium tiers if needed

3. **Track retry effectiveness**
   - Measure success rate after retries
   - Adjust backoff times if needed
   - Consider increasing max retries

## Future Enhancements

1. **Circuit Breaker Pattern**
   - Stop retrying if service is consistently failing
   - Auto-recover when service stabilizes

2. **Adaptive Backoff**
   - Adjust backoff based on error type
   - Longer backoff for rate limits
   - Shorter backoff for network timeouts

3. **Error Analytics Dashboard**
   - Real-time error trends
   - Error heatmaps by time/region
   - User impact analysis

4. **Automatic Error Recovery**
   - Auto-retry failed analyses at different times
   - Notify users when retry succeeds

5. **A/B Testing Error Messages**
   - Test different messages for conversion
   - Optimize for user action (retry vs abandon)

## Testing Checklist

- [ ] Test with invalid image format (BMP, GIF, etc.)
- [ ] Test with oversized image (> 10MB)
- [ ] Test with too-small image (< 300x300)
- [ ] Simulate network timeout → verify retry
- [ ] Simulate rate limit (429) → verify backoff
- [ ] Verify quota exceeded error after 10 analyses
- [ ] Test error boundary catches React errors
- [ ] Verify error messages are user-friendly
- [ ] Check Firestore logs for error entries
- [ ] Test retry button in error state
- [ ] Verify rate limit resets daily
- [ ] Test in slow network (2G) conditions
- [ ] Test with auth token expiration
- [ ] Verify error codes in development mode

## Summary

This production-grade error handling system provides:

✅ **Reliability** - Automatic retry with exponential backoff for transient failures
✅ **User Experience** - Clear, actionable error messages with retry capability
✅ **Observability** - Comprehensive error logging to Firestore for monitoring
✅ **Security** - Rate limiting and quota enforcement
✅ **Scalability** - Configurable retry logic and rate limits
✅ **Maintainability** - Centralized error handling with clear abstractions

The system balances automatic recovery (retries) with user control (error display and manual retry), ensuring both reliability and good UX.
