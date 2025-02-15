- Create a minimalist read-it-later application using SvelteKit and PocketBase with an emphasis on distraction-free reading.
  
  Tech Stack:
- Frontend: SvelteKit (latest)
- Backend: PocketBase
- Authentication: Built-in PocketBase auth
- Docker support for deployment
  
  Design Philosophy:
- Minimalist, clean interface with ample negative space
- Typography-focused design similar to Instapaper
- Distraction-free reading experience
- Neutral color palette with high contrast for readability
- Simple, intuitive navigation
  
  Core Features:
  1. User authentication (email/password)
  2. Save links with:
	- URL
	- Title (auto-extracted)
	- Description (optional)
	- Tags (optional)
	- Notes (optional)
	  3. Clean reading view that:
	- Removes ads, navigation, and other distractions
	- Focuses on article content
	- Uses comfortable reading margins
	- Provides high-contrast text
	  
	  UI Components:
	  1. Reading View:
	- Clean article presentation
	- Comfortable line length (around 65-75 characters)
	- Generous whitespace
	- Simple top navigation for basic controls
	  
	  2. Article List:
	- Minimal list view with titles and optional descriptions
	- Subtle metadata display
	- Clear visual hierarchy
	- Space between items for easy scanning
	  
	  3. Navigation:
	- Minimal header with essential functions
	- Simple sidebar or dropdown for additional options
	- Clear visual feedback for interactive elements
	  
	  Data Models:
	- ```typescript
	  Users {
	  id: string
	  email: string
	  created: datetime
	  updated: datetime
	  }
	  
	  SavedItems {
	  id: string
	  user: relation(Users)
	  url: string
	  title: string
	  description: string
	  tags: string[]
	  notes: string
	  content: string  // Stored clean version of article
	  created: datetime
	  updated: datetime
	  archived: boolean
	  logseq_sync_status: string
	  }
	  
	  ReadingPreferences {
	  id: string
	  user: relation(Users)
	  font_size: string
	  line_height: string
	  margins: string
	  theme: string  // light/dark
	  }
	  ```
	  
	  Technical Requirements:
	  1. Set up a basic SvelteKit project with PocketBase integration
	  2. Include Docker and docker-compose configurations
	  3. Implement user authentication flows
	  4. Create basic CRUD operations for saved items
	  5. Implement article content parsing and cleaning
	  6. Add reading preference customization
	  7. Include basic search functionality
	  8. Set up proper TypeScript types
	  9. Include environment variable configuration
- The application should be structured to eventually support Logseq integration via their plugin API, but that integration can be implemented later.
- UI Mockup
	- ```css
	  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
	    <!-- Background -->
	    <rect width="800" height="600" fill="#ffffff"/>
	    
	    <!-- Header -->
	    <rect width="800" height="60" fill="#fafafa"/>
	    <text x="40" y="38" font-family="Arial" font-size="24" fill="#333333">ReadLater</text>
	    <circle cx="720" cy="30" r="15" fill="#eee"/>
	    <text x="715" y="38" font-family="Arial" font-size="20" fill="#666" text-anchor="middle">U</text>
	    
	    <!-- Left Sidebar -->
	    <rect x="0" y="60" width="240" height="540" fill="#fafafa"/>
	    <text x="40" y="100" font-family="Arial" font-size="16" fill="#666666">Read Later (24)</text>
	    <text x="40" y="140" font-family="Arial" font-size="16" fill="#666666">Archive</text>
	    <text x="40" y="180" font-family="Arial" font-size="16" fill="#666666">Favorites</text>
	    <line x1="0" y1="220" x2="240" y2="220" stroke="#eee" stroke-width="1"/>
	    <text x="40" y="260" font-family="Arial" font-size="16" fill="#666666">Tags</text>
	    <text x="40" y="500" font-family="Arial" font-size="16" fill="#666666">Logseq Sync</text>
	    <circle cx="200" cy="500" r="8" fill="#4CAF50"/>
	    
	    <!-- Main Content Area -->
	    <rect x="240" y="60" width="560" height="540" fill="#ffffff"/>
	    
	    <!-- Article List -->
	    <g>
	      <!-- Article 1 -->
	      <text x="280" y="100" font-family="Arial" font-size="18" fill="#333333">The Future of Web Development</text>
	      <text x="280" y="125" font-family="Arial" font-size="14" fill="#666666">medium.com • 8 min read</text>
	      <line x1="280" y1="150" x2="760" y2="150" stroke="#eee" stroke-width="1"/>
	      
	      <!-- Article 2 -->
	      <text x="280" y="180" font-family="Arial" font-size="18" fill="#333333">Understanding Modern JavaScript</text>
	      <text x="280" y="205" font-family="Arial" font-size="14" fill="#666666">dev.to • 12 min read</text>
	      <line x1="280" y1="230" x2="760" y2="230" stroke="#eee" stroke-width="1"/>
	    </g>
	    
	    <!-- Reading View (overlaid, slightly transparent to show list beneath) -->
	    <rect x="240" y="60" width="560" height="540" fill="#ffffff" opacity="0.9"/>
	    <text x="320" y="120" font-family="Arial" font-size="28" fill="#333333">The Future of Web Development</text>
	    <text x="320" y="150" font-family="Arial" font-size="14" fill="#666666">By John Smith • March 15, 2024</text>
	    
	    <!-- Reading Controls -->
	    <circle cx="740" cy="100" r="15" fill="#fafafa"/>
	    <text x="735" y="105" font-family="Arial" font-size="14" fill="#666666">Aa</text>
	    
	    <!-- Content Preview -->
	    <rect x="320" y="180" width="400" height="8" fill="#333333" rx="2"/>
	    <rect x="320" y="200" width="380" height="8" fill="#333333" rx="2"/>
	    <rect x="320" y="220" width="390" height="8" fill="#333333" rx="2"/>
	    
	    <!-- Logseq Sync Button -->
	    <rect x="320" y="500" width="120" height="36" rx="4" fill="#fafafa"/>
	    <text x="340" y="524" font-family="Arial" font-size="14" fill="#666666">Sync to Logseq</text>
	  </svg>
	  ```
	- Preview Image
		- ![Screenshot from 2025-02-15 16-53-39.png](../assets/Screenshot_from_2025-02-15_16-53-39_1739660031675_0.png)
- Additional views and provide detailed typography/spacing specifications.
	- ```css
	  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900">
	    <!-- Settings View -->
	    <rect y="0" width="800" height="400" fill="#ffffff"/>
	    <text x="40" y="38" font-family="Arial" font-size="24" fill="#333333">Settings</text>
	    
	    <!-- Settings Sections -->
	    <rect x="40" y="70" width="720" height="100" fill="#fafafa" rx="4"/>
	    <text x="60" y="100" font-family="Arial" font-size="16" fill="#333333">Reading Preferences</text>
	    <!-- Font Size Control -->
	    <text x="60" y="130" font-family="Arial" font-size="14" fill="#666666">Font Size</text>
	    <rect x="200" y="115" width="200" height="24" fill="#eee" rx="12"/>
	    <circle cx="250" cy="127" r="10" fill="#333"/>
	    
	    <!-- Logseq Settings -->
	    <rect x="40" y="190" width="720" height="140" fill="#fafafa" rx="4"/>
	    <text x="60" y="220" font-family="Arial" font-size="16" fill="#333333">Logseq Integration</text>
	    <text x="60" y="250" font-family="Arial" font-size="14" fill="#666666">Auto-sync</text>
	    <rect x="200" y="235" width="40" height="24" fill="#4CAF50" rx="12"/>
	    <circle cx="225" cy="247" r="10" fill="#fff"/>
	    <text x="60" y="280" font-family="Arial" font-size="14" fill="#666666">Template</text>
	    <rect x="200" y="265" width="300" height="24" fill="#fff" stroke="#eee"/>
	    
	    <!-- Tag Management View -->
	    <rect y="450" width="800" height="450" fill="#ffffff"/>
	    <text x="40" y="488" font-family="Arial" font-size="24" fill="#333333">Tags</text>
	    
	    <!-- Tag List -->
	    <rect x="40" y="520" width="720" height="340" fill="#fafafa" rx="4"/>
	    <!-- Tag 1 -->
	    <text x="60" y="560" font-family="Arial" font-size="16" fill="#333333">research (12)</text>
	    <text x="680" y="560" font-family="Arial" font-size="16" fill="#666666">×</text>
	    <!-- Tag 2 -->
	    <text x="60" y="600" font-family="Arial" font-size="16" fill="#333333">javascript (8)</text>
	    <text x="680" y="600" font-family="Arial" font-size="16" fill="#666666">×</text>
	    <!-- Tag 3 -->
	    <text x="60" y="640" font-family="Arial" font-size="16" fill="#333333">productivity (5)</text>
	    <text x="680" y="640" font-family="Arial" font-size="16" fill="#666666">×</text>
	    
	    <!-- Add Tag -->
	    <rect x="60" y="780" width="200" height="40" fill="#eee" rx="4"/>
	    <text x="80" y="805" font-family="Arial" font-size="14" fill="#666666">+ Add new tag</text>
	  </svg>
	  ```
	- Preview Image
	  collapsed:: true
		- ![Screenshot from 2025-02-15 16-49-22.png](../assets/Screenshot_from_2025-02-15_16-49-22_1739659786086_0.png)
- # Typography and Spacing Specification
- ## Typography System
- ### Font Families
  ```css
  --font-primary: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
  --font-reading: 'Charter', 'Georgia', serif;
  ```
- ### Font Sizes
  ```css
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  ```
- ### Line Heights
  ```css
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  ```
- ### Font Weights
  ```css
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  ```
- ## Spacing System
  ```css
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  ```
- ## Reading View Specifications
- ### Content Width
  ```css
  --content-width-narrow: 36rem;  /* ~680px */
  --content-width-wide: 42rem;    /* ~760px */
  ```
- ### Margins
  ```css
  --margin-reading: clamp(1rem, 5vw, 3rem);
  ```
- ## Component-Specific Typography
- ### Headers
  ```css
  .app-header {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  }
  
  .article-title {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  }
  ```
- ### List Items
  ```css
  .list-item-title {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
  }
  
  .list-item-meta {
  font-size: var(--text-sm);
  color: var(--color-gray-600);
  }
  ```
- ### Reading View
  ```css
  .article-content {
  font-family: var(--font-reading);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  padding: var(--space-8) var(--margin-reading);
  }
  
  .article-content p {
  margin-bottom: var(--space-6);
  }
  ```
- ## Grid System
  ```css
  --grid-gap: var(--space-4);
  --sidebar-width: 240px;
  --header-height: 60px;
  ```
- ## Component Spacing
  ```css
  --card-padding: var(--space-4);
  --section-spacing: var(--space-8);
  --list-item-spacing: var(--space-4);
  ```