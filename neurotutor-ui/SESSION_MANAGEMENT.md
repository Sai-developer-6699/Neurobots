# Session Management & Token Expiry Handling

## Overview

This document explains the session management system implemented to handle token expiry gracefully and provide a smooth user experience when sessions expire.

## Problem Understanding

### Browser Extension Errors
The `content.js:11 Uncaught Error: Extension context invalidated` errors you're seeing are **browser extension related**, not application errors. These typically occur when:
- Browser extensions are updated/disabled
- Developer tools extensions have issues
- Extension context becomes invalid

**Solution**: These errors can be safely ignored as they don't affect your application functionality.

### Application Token Expiry
The real issue is handling JWT token expiry when users are inactive or tokens expire naturally.

## Implementation Details

### 1. Enhanced AuthContext (`src/context/AuthContext.jsx`)

#### New Features:
- **Session Expiry State**: `sessionExpired` flag to track expiry status
- **Token Renewal**: `renewSession()` function to refresh tokens
- **Graceful Logout**: `logout(redirect)` parameter to control redirect behavior
- **Expiry Detection**: Automatic detection of 401/token_not_valid errors

#### Key Methods:
```javascript
// Handle session expiry
const handleSessionExpired = () => {
    setSessionExpired(true);
    logout(false); // Clear tokens but don't redirect
};

// Attempt to renew session
const renewSession = async () => {
    try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
            const response = await authAPI.login({ refresh_token: refreshToken });
            // Update tokens and reset expiry state
            return true;
        }
    } catch (error) {
        return false;
    }
};
```

### 2. Session Expired Modal (`src/components/SessionExpiredModal.jsx`)

#### Features:
- **User-Friendly UI**: Clear messaging about session expiry
- **Dual Actions**: Option to renew session or login again
- **Loading States**: Visual feedback during renewal attempts
- **Error Handling**: Graceful fallback when renewal fails

#### User Flow:
1. Modal appears when session expires
2. User can click "Renew Session" to attempt automatic renewal
3. If renewal fails, user can click "Login Again" to re-authenticate
4. Progress is preserved, so user doesn't lose work

### 3. Enhanced API Service (`src/services/api.js`)

#### Token Refresh Interceptor:
```javascript
// Enhanced error handling for 401 responses
if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
        // Attempt token refresh
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
        });
        
        if (response.status === 200) {
            // Retry original request with new token
            return api(originalRequest);
        }
    } catch (e) {
        // Clear tokens and trigger session expiry event
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.dispatchEvent(new CustomEvent('sessionExpired'));
    }
}
```

#### Event-Driven Architecture:
- Uses custom events to communicate token expiry
- Decouples API layer from UI components
- Allows multiple components to react to session expiry

### 4. Dashboard Integration (`src/pages/Dashboard.jsx`)

#### Event Listener:
```javascript
useEffect(() => {
    const handleSessionExpiredEvent = () => {
        handleSessionExpired();
    };

    window.addEventListener('sessionExpired', handleSessionExpiredEvent);
    return () => {
        window.removeEventListener('sessionExpired', handleSessionExpiredEvent);
    };
}, [handleSessionExpired]);
```

#### Modal Integration:
```javascript
<SessionExpiredModal
    isOpen={sessionExpired}
    onClose={() => navigate('/login')}
    onLogin={() => navigate('/login')}
    onRenew={renewSession}
/>
```

## User Experience Flow

### Normal Operation
1. User logs in → Tokens stored in cookies
2. User interacts with app → API calls work normally
3. Token refresh happens automatically in background

### Token Expiry Scenario
1. Token expires during API call → 401 error
2. API interceptor attempts automatic refresh
3. If refresh fails → Triggers `sessionExpired` event
4. Dashboard shows Session Expired Modal
5. User chooses to renew or login again

### Session Renewal Flow
1. User clicks "Renew Session"
2. System attempts to refresh using refresh token
3. If successful → Modal closes, user continues working
4. If failed → User prompted to login again

## Error Types & Handling

### 1. Browser Extension Errors
```
content.js:11 Uncaught Error: Extension context invalidated.
```
- **Cause**: Browser extension issues
- **Impact**: None on application
- **Action**: Ignore these errors

### 2. Token Expiry Errors
```
POST /api/submit-answer/ 401 (Unauthorized)
```
- **Cause**: JWT token expired
- **Impact**: API calls fail
- **Action**: Automatic token refresh or session expiry modal

### 3. Network Errors
```
ERR_NETWORK_CONNECTION_FAILED
```
- **Cause**: Network connectivity issues
- **Impact**: API calls fail
- **Action**: Show network error message, retry functionality

## Configuration

### Token Settings
```javascript
// JWT Token expiration (backend)
ACCESS_TOKEN_LIFETIME = 15 minutes
REFRESH_TOKEN_LIFETIME = 7 days

// Cookie settings (frontend)
Cookies.set('access_token', token, { expires: 1 }); // 1 day
Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
```

### API Timeouts
```javascript
// API request timeouts
api.create({
    timeout: 30000, // 30 seconds
});

// Token refresh timeout
axios.post('/auth/token/refresh/', {}, { timeout: 10000 }); // 10 seconds
```

## Testing Scenarios

### 1. Manual Token Expiry Testing
```javascript
// Clear tokens manually to simulate expiry
Cookies.remove('access_token');
Cookies.remove('refresh_token');

// Make an API call to trigger expiry handling
questionAPI.submitAnswer({ question_id: 1, submitted_answer: 'test' });
```

### 2. Session Renewal Testing
```javascript
// Test renewal functionality
const { renewSession } = useAuth();
const success = await renewSession();
console.log('Renewal successful:', success);
```

### 3. Network Failure Testing
```javascript
// Disable network to test error handling
// Should show appropriate error messages
```

## Best Practices

### 1. Token Storage
- Use httpOnly cookies for production
- Consider localStorage for development only
- Implement secure cookie flags in production

### 2. Error Handling
- Always provide user-friendly error messages
- Implement retry mechanisms for transient failures
- Log errors for debugging but don't expose to users

### 3. User Experience
- Preserve user progress during session renewal
- Provide clear feedback during loading states
- Offer multiple recovery options (renew vs login)

### 4. Security
- Clear tokens on logout
- Implement token blacklisting on server
- Use short access token lifetimes
- Validate refresh tokens rigorously

## Troubleshooting

### Common Issues

#### 1. Modal Not Appearing
- Check if `sessionExpired` state is being set
- Verify event listener is properly attached
- Ensure AuthContext is properly initialized

#### 2. Renewal Always Failing
- Verify refresh token exists and is valid
- Check backend token refresh endpoint
- Ensure refresh token hasn't expired

#### 3. Infinite Loop
- Make sure `originalRequest._retry` flag is set
- Verify event listeners are properly cleaned up
- Check for circular dependencies in useEffect

### Debug Steps

1. **Check Console Logs**: Look for session expiry events
2. **Verify Cookies**: Ensure tokens are present and valid
3. **Test API Endpoints**: Verify backend is responding correctly
4. **Check Network Tab**: Monitor API calls and responses

## Future Enhancements

### 1. Idle Detection
- Implement user activity tracking
- Show warning before session expires
- Auto-logout after inactivity period

### 2. Multi-Tab Support
- Sync session state across browser tabs
- Handle tab closure and reopening
- Implement shared session management

### 3. Offline Support
- Cache user progress locally
- Sync when connection restored
- Provide offline indicators

## Conclusion

The session management system provides a robust, user-friendly approach to handling token expiry. By combining automatic token refresh, graceful error handling, and clear user communication, the system ensures users have a smooth experience even when sessions expire.

The browser extension errors you're seeing are unrelated to your application and can be safely ignored. Focus on the application-level session handling which is now properly implemented.
