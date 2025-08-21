# Vercel Deployment Guide for CivicLens AI

## Pre-deployment Setup

### 1. Environment Variables
Set these environment variables in your Vercel dashboard:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Your Google Gemini API key for AI analysis

**Optional:**
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI instead of Gemini)
- `SENDGRID_API_KEY` - For email notifications

### 2. Database Setup
1. Create a Neon PostgreSQL database
2. Run `npm run db:push` to create tables
3. Update `DATABASE_URL` in Vercel environment variables

### 3. Authentication Setup
**Important:** Replit Auth won't work on Vercel. You'll need to implement alternative authentication:

Options:
1. **NextAuth.js** - Most popular choice
2. **Auth0** - Enterprise solution
3. **Supabase Auth** - Simple integration
4. **Custom JWT** - Full control

### 4. Object Storage Setup
Replit's object storage won't work on Vercel. Replace with:

1. **AWS S3** (recommended)
2. **Google Cloud Storage**
3. **Cloudinary**
4. **Vercel Blob Storage**

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
- Add all required environment variables
- Redeploy after setting variables

## Code Changes Needed

### 1. Update Authentication
Replace Replit Auth in `server/auth.ts` with your chosen provider.

### 2. Update Object Storage
Replace `ObjectStorageService` calls with your chosen storage provider.

### 3. Update File Upload Component
Update `ObjectUploader` component to work with new storage provider.

## Production Checklist

- [ ] Database configured and connected
- [ ] Environment variables set
- [ ] Authentication provider implemented
- [ ] Object storage provider configured
- [ ] API routes tested
- [ ] Frontend builds successfully
- [ ] All features working in production

## Troubleshooting

### Common Issues:
1. **Serverless Function Timeout** - Set in vercel.json (currently 30s)
2. **Database Connection** - Ensure connection pooling is enabled
3. **Environment Variables** - Check all required vars are set
4. **Build Errors** - Check build logs in Vercel dashboard

### Performance Optimization:
1. Enable database connection pooling
2. Implement request caching where appropriate
3. Optimize image uploads and processing
4. Use CDN for static assets

## Support
- Vercel Documentation: https://vercel.com/docs
- Neon Database: https://neon.tech/docs
- Your chosen auth provider's documentation