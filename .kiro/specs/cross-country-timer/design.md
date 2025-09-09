# Design Document

## Overview

The Cross Country Timer is a single-page NextJS web application optimized for mobile use. It features a master stopwatch at the top and a dynamic table below showing runners and their split times. The design prioritizes simplicity, large touch targets, and real-time updates to ensure coaches can effectively time multiple runners during races.

## Architecture

### Technology Stack

- **Framework**: NextJS 14 with App Router
- **Styling**: Tailwind CSS for responsive design and mobile optimization
- **State Management**: React useState and useEffect hooks for local state
- **Timing**: JavaScript setInterval for stopwatch functionality
- **Storage**: Browser localStorage for session persistence
- **Deployment**: Vercel (NextJS native platform)

### Application Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with mobile viewport
│   ├── page.tsx            # Main timer page
│   └── globals.css         # Tailwind imports
├── components/
│   ├── Stopwatch.tsx       # Master stopwatch component
│   ├── RunnerTable.tsx     # Runners and splits table
│   ├── AddRunner.tsx       # Runner input form
│   └── SplitButton.tsx     # Individual split recording button
├── hooks/
│   └── useTimer.tsx        # Custom hook for timing logic
└── types/
    └── index.ts            # TypeScript interfaces
```

## Components and Interfaces

### Core Data Types

```typescript
interface Runner {
  id: string;
  name: string;
  splits: {
    mile1?: number;
    mile2?: number;
    mile3?: number;
  };
}

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
}
```

### Stopwatch Component

- Large, prominent display at top of screen
- Start/Stop button with clear visual states
- Real-time elapsed time display in MM:SS format
- Controls master timing state for all runners

### RunnerTable Component

- Responsive table showing runner names and split columns
- Each row contains runner name + 3 split buttons/times
- Split buttons become disabled after recording
- Mobile-optimized with proper touch targets

### AddRunner Component

- Simple text input with "Add Runner" button
- Validates for duplicate names
- Adds runners to active session

### SplitButton Component

- Large, touch-friendly buttons for each mile split
- Shows "Record" when available, displays time when recorded
- Disabled state after split is captured
- Color coding for visual feedback

## Data Models

### Timer Management

The application uses a custom `useTimer` hook that manages:

- Master stopwatch state (running/stopped/elapsed time)
- Individual runner timing calculations
- Split time recording relative to start time

### Runner Management

- Runners stored in component state as array
- Each runner has unique ID for React key management
- Split times stored as milliseconds from race start
- Persistent storage in localStorage for session recovery

### State Flow

1. User starts master stopwatch
2. Individual runner timers begin automatically
3. Coach taps split buttons to record mile times
4. Split times calculated as current elapsed time
5. UI updates immediately with recorded splits

## Error Handling

### Input Validation

- Prevent duplicate runner names
- Require non-empty runner names
- Validate split recording only when timer is running

### Timer Edge Cases

- Handle browser tab switching (timer continues)
- Prevent multiple simultaneous timer starts
- Graceful handling of rapid button presses

### Mobile Considerations

- Prevent accidental zoom on double-tap
- Handle screen orientation changes
- Maintain state during brief network interruptions

## Testing Strategy

### Unit Tests

- Timer hook functionality and state transitions
- Split time calculation accuracy
- Runner addition/removal logic
- Component rendering with various states

### Integration Tests

- Complete timing workflow from start to finish
- Multiple runner management scenarios
- Split recording accuracy across different timing scenarios

### Mobile Testing

- iPhone Safari compatibility testing
- Touch interaction responsiveness
- Screen size adaptation (iPhone SE to iPhone Pro Max)
- Performance testing with 10+ runners

### User Acceptance Testing

- Real-world timing scenario simulation
- Coach workflow validation
- Error recovery testing
- Performance under race conditions

## Mobile Optimization

### Responsive Design

- Mobile-first CSS approach using Tailwind
- Large touch targets (minimum 44px)
- Readable font sizes without zoom
- Optimized for portrait orientation

### Performance

- Minimal JavaScript bundle size
- Efficient re-rendering with React.memo
- Optimized timer updates (100ms intervals)
- Fast initial page load

### User Experience

- Immediate visual feedback for all interactions
- Clear visual hierarchy with stopwatch prominence
- Intuitive button states and colors
- No horizontal scrolling required

## Deployment Configuration

### NextJS Configuration

- Static export capability for broad hosting compatibility
- Optimized build with automatic code splitting
- PWA capabilities for offline functionality
- Mobile viewport meta tags

### Hosting Requirements

- Static hosting compatible (Vercel, Netlify, GitHub Pages)
- HTTPS for mobile browser compatibility
- Fast CDN for quick loading
- No backend dependencies required
