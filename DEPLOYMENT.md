# Deployment Guide

## Overview

The Cross Country Timer app is configured for static export and can be deployed to any static hosting platform. The build process creates an optimized static version in the `/out` directory.

## Build Configuration

### NextJS Configuration

- **Static Export**: Enabled for broad hosting compatibility
- **Image Optimization**: Disabled for static hosting
- **Bundle Optimization**: Webpack configured for optimal code splitting
- **Performance**: Console.log removal in production builds

### Deployment Files

- `next.config.mjs`: NextJS build configuration
- `vercel.json`: Vercel-specific deployment settings
- `.env.local`: Environment variables for build optimization

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to production
npm run deploy:vercel
```

### Option 2: Static Hosting (Netlify, GitHub Pages, etc.)

```bash
# Build and export static files
npm run build

# Deploy the /out directory to your static host
# The /out directory contains all necessary files
```

### Option 3: Manual Build and Deploy

```bash
# Run deployment test
npm run deploy:test

# Build for production
npm run build

# The /out directory is ready for deployment
```

## Build Scripts

- `npm run build` - Standard NextJS build
- `npm run build:analyze` - Build with bundle analysis
- `npm run deploy:test` - Run deployment verification tests
- `npm run deploy:vercel` - Deploy to Vercel production

## Performance Optimizations

### Bundle Size

- Current bundle size: ~169kB first load JS
- Vendor chunks optimized for caching
- Code splitting enabled for optimal loading

### Mobile Optimizations

- PWA-ready with mobile-web-app-capable meta tags
- Optimized for mobile viewport
- Touch-friendly interface with proper sizing

### Caching Strategy

- Static assets cached for 1 year
- HTML files with revalidation headers
- Optimal cache-control headers configured

## Verification

The deployment includes automated tests to verify:

- ✅ Clean build process
- ✅ Static export generation
- ✅ Essential files presence
- ✅ HTML content validation
- ✅ Mobile compatibility

## Troubleshooting

### Build Failures

- Check ESLint warnings (currently set to warn, not error)
- Verify all dependencies are installed
- Ensure Node.js version compatibility

### Deployment Issues

- Verify `/out` directory contains `index.html`
- Check that static assets are properly referenced
- Ensure hosting platform supports SPA routing

### Performance Issues

- Run `npm run build:analyze` to analyze bundle size
- Check network tab for loading performance
- Verify mobile performance on actual devices

## Environment Variables

### Build-time Variables

- `ANALYZE=true` - Enable bundle analysis
- `NODE_ENV=production` - Production optimizations
- `NEXT_TELEMETRY_DISABLED=1` - Disable NextJS telemetry

## Security Headers

The Vercel configuration includes security headers:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Proper cache-control headers

## Post-Deployment Testing

After deployment, verify:

1. App loads correctly on mobile devices
2. Timer functionality works as expected
3. Runner management operates properly
4. Split recording functions accurately
5. localStorage persistence works
6. Performance meets requirements

## Monitoring

Consider setting up:

- Performance monitoring (Core Web Vitals)
- Error tracking for production issues
- Usage analytics for optimization insights
