# Google Maps Secure Integration Setup

## 🔒 Security Implementation

The Contact page now uses a **secure server-side approach** that completely hides your Google Maps API key from the frontend. This prevents:
- API key exposure in page source
- Unauthorized usage of your API key
- Potential cost abuse by malicious users

## 🚀 Setup Steps

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Static Maps API**
   - **Geocoding API**
4. Create credentials (API Key)
5. **IMPORTANT**: Set up API key restrictions:
   - HTTP referrers: Add your domain (e.g., `localhost:3000`, `yourdomain.com`)
   - API restrictions: Limit to only the APIs you enabled

### 2. Configure Environment Variables

1. **Edit your existing `backend/env.config` file**
2. **Add your API key** (replace the placeholder):
   ```bash
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

**Example `env.config` file:**
```bash
# BogartFashion Email Configuration
EMAIL_USER=dev.ocean159@gmail.com
EMAIL_PASS=aajz alrk aiah zomt
EMAIL_FROM=noreply@bogartfashion.com

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=AIzaSyB_Your_Actual_API_Key_Here
```

### 3. Restart Backend Server

After adding the API key to `env.config`, restart your backend server for the changes to take effect.

## 🏗️ How It Works

### **Before (Insecure):**
```javascript
// ❌ API key visible in frontend source
<iframe src="https://maps.googleapis.com/maps/embed/v1/place?key=YOUR_API_KEY&q=...">
```

### **After (Secure):**
```javascript
// ✅ Frontend calls backend
fetch('/api/contact/map-data')

// ✅ Backend securely uses API key from env.config
const mapData = await fetchGoogleMapsData(process.env.GOOGLE_MAPS_API_KEY)

// ✅ Frontend receives data without API key
<img src={mapData.staticMapUrl} />
```

## 🔧 Technical Details

### **Backend Endpoint:**
- **Route**: `GET /api/contact/map-data`
- **Security**: API key stored in `env.config` file
- **Response**: Map data including static map URL and location info

### **Frontend Features:**
- **Dynamic data**: Contact info loaded from backend
- **Static maps**: High-quality map images without API key exposure
- **Fallback**: Graceful degradation if map service unavailable
- **Loading states**: Professional user experience

### **Map Types Available:**
1. **Static Maps**: High-quality images (requires API key)
2. **Direct Links**: Direct Google Maps links (no API key needed)
3. **Fallback**: Basic location display if services unavailable

## 🛡️ Security Benefits

- ✅ **API key hidden** from frontend source code
- ✅ **Referrer restrictions** limit usage to your domain
- ✅ **Rate limiting** controlled by Google Cloud Console
- ✅ **Cost monitoring** through Google Cloud billing
- ✅ **No client-side exposure** of sensitive credentials

## 📱 User Experience

- **Interactive maps** with professional appearance
- **Responsive design** works on all devices
- **Fast loading** with optimized static images
- **Clear navigation** to Google Maps for directions
- **Professional branding** with Bogart Fashion styling

## 🔍 Troubleshooting

### **Map Not Loading:**
1. Check if API key is set in `env.config` file
2. Verify API key restrictions in Google Cloud Console
3. Check backend logs for error messages
4. Ensure required APIs are enabled

### **API Key Errors:**
1. Verify API key format and validity
2. Check billing status in Google Cloud Console
3. Ensure API quotas haven't been exceeded
4. Verify referrer restrictions match your domain

## 💰 Cost Considerations

- **Static Maps API**: $2.00 per 1,000 requests
- **Maps JavaScript API**: $7.00 per 1,000 requests
- **Geocoding API**: $5.00 per 1,000 requests

**Typical usage**: Less than $1/month for most websites

## 🎯 Best Practices

1. **Always restrict API keys** to specific domains
2. **Monitor usage** through Google Cloud Console
3. **Set up billing alerts** to prevent unexpected charges
4. **Use static maps** for better performance and lower costs
5. **Implement caching** for frequently accessed map data

---

**Result**: Your Contact page now has professional, secure Google Maps integration that protects your API key while providing an excellent user experience! 🎉

**Note**: The system uses your existing `env.config` file, so no additional environment setup is needed.
