# Admin Set Mobile Endpoint - Quick Test Guide

## Endpoint Added ✅
**PUT /api/admin/set-mobile**

## Security
Protected by `ADMIN_BOOTSTRAP_SECRET` environment variable.

## How to Use

### 1. Set Admin Secret (if not already set)
In your Render dashboard or `.env` file:
```
ADMIN_BOOTSTRAP_SECRET=your-secret-key-here
```

### 2. Test with Postman

**Request:**
```
PUT https://school-management-system-w7cw.onrender.com/api/admin/set-mobile
```

**Headers:**
```
Content-Type: application/json
x-admin-secret: your-secret-key-here
```

**Body (JSON):**
```json
{
  "email": "principal@demo.school",
  "mobile": "+918799760471"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "email": "principal@demo.school",
  "mobile": "+918799760471"
}
```

### 3. Test with cURL
```bash
curl -X PUT https://school-management-system-w7cw.onrender.com/api/admin/set-mobile \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secret-key-here" \
  -d '{"email":"principal@demo.school","mobile":"+918799760471"}'
```

### 4. Test with PowerShell
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = "your-secret-key-here"
}
$body = @{
    email = "principal@demo.school"
    mobile = "+918799760471"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://school-management-system-w7cw.onrender.com/api/admin/set-mobile" -Method Put -Headers $headers -Body $body
```

## Error Responses

### 403 - Invalid Admin Secret
```json
{
  "error": "Invalid admin secret"
}
```

### 400 - Missing Parameters
```json
{
  "error": "Missing email or mobile"
}
```

### 404 - User Not Found
```json
{
  "error": "User not found"
}
```

### 404 - Admin Endpoint Disabled
```json
{
  "error": "Admin endpoint disabled"
}
```
(Happens when ADMIN_BOOTSTRAP_SECRET is not set)

## After Setting Mobile

Once mobile is set, you can login normally:
1. Enter credentials at login
2. OTP will be sent to the mobile number you just set
3. Verify OTP and complete login

## Files Modified
- ✅ `backend/src/controllers/adminController.js` - Added `setMobile` function
- ✅ `backend/src/routes/admin.js` - Added PUT route

## Important Notes
- This endpoint does NOT create new users
- It only updates existing users' mobile numbers
- Email matching is case-insensitive
- Works for any role (principal, teacher, student, etc.)
- Protected by the same secret as bootstrap endpoint
