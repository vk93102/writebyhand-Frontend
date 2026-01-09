# Flashcard Component - Visual Design Reference

## Component Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER SECTION                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │ Title (h1 - Bold, 32px line-height)                     │
│  │ [Category Badge] (Rounded, Primary Color)               │
│  └─────────────────────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────┤
│  PROGRESS SECTION (#F9FAFB background)                     │
│  ┌─────────────────────────────────────────────────────────┤
│  │ Progress      │ 1 of 10 cards           │      25%      │
│  │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Progress Bar) │
│  └─────────────────────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────┤
│  STATISTICS ROW                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ ✓ Known              │  │ 🎓 Learning          │        │
│  │   5 cards            │  │   3 cards            │        │
│  │ (Green bg #F0FDF4)   │  │ (Amber bg #FFFBEB)   │        │
│  └──────────────────────┘  └──────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  CARD CONTAINER (Interactive Flip Card)                    │
│  ┌─────────────────────────────────────────────────────────┐
│  │ ◉ QUESTION                                              │
│  │ ─────────────────────────────────────────────────────── │
│  │                                                         │
│  │   What is photosynthesis?                              │
│  │                                                         │
│  │ ─────────────────────────────────────────────────────── │
│  │ Touch to reveal answer                                  │
│  └─────────────────────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────┤
│  ACTION BUTTONS                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ ✕ Still Learning     │  │ ✓ I Know This        │        │
│  │ (Amber/Warning)      │  │ (Green/Success)      │        │
│  └──────────────────────┘  └──────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  NAVIGATION FOOTER (#F9FAFB background)                    │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ ← Previous           │  │ Next →               │        │
│  │ (Outlined)           │  │ (Filled Primary)     │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| **Header Background** | White (#FFFFFF) | Top section background |
| **Progress Background** | Light Gray (#F9FAFB) | Progress section |
| **Card Background** | White (#FFFFFF) | Main card content |
| **Card Border** | Light Gray (#F3F4F6) | Card definition |
| **Known Stat Background** | Light Green (#F0FDF4) | Known cards stat box |
| **Learning Stat Background** | Light Amber (#FFFBEB) | Learning cards stat box |
| **Navigation Background** | Light Gray (#F9FAFB) | Footer section |
| **Primary Action** | Theme Primary | Buttons, icons, accents |
| **Success** | Theme Success (Green) | Known button, check icon |
| **Warning** | Theme Warning (Amber) | Learning button, help icon |
| **Text** | Theme Text | Primary text |
| **Text Muted** | Theme TextMuted | Secondary text |

## Typography Hierarchy

```
Header Section:
  Title: h1 (Bold 700, line-height 32px)
  Category: small (600, rounded badge)

Progress Section:
  Label: small (600, muted)
  Count: body (600, text)
  Percentage: h3 (700, primary)

Stats:
  Label: small (600, muted)
  Number: h3 (700, text)

Card:
  Card Label: h4 (700, primary)
  Card Text: 18-24px (600, text, centered)
  Tap Hint: small (500, muted)

Buttons:
  Knowledge Button: h4 (700, white)
  Navigation Button: h4 (700)
  Nav Disabled: small (muted)
```

## Spacing Scale

```
Extra Small (xs)      = 4px
Small (sm)            = 8px
Medium (md)           = 12px
Large (lg)            = 16px
Extra Large (xl)      = 20px
Double XL (xl * 2)    = 40px
Triple XL (xl * 3)    = 60px
```

## Border Radius

```
Full (pill shaped)    = 9999px
Large (lg)            = 12px
XL                    = 16px
12px                  = 12px (stats icon)
24px                  = 24px (header icon)
```

## Shadows

- **Small (sm)**: Subtle elevation for headers and sections
- **Medium (md)**: Button and interactive element depth
- **Large (lg)**: Card elevation for main content

## Responsive Breakpoints

```
Desktop/Web:
  - isWeb: true
  - isMobile: false
  - Card Height: 450px
  - Margins: 60px (xl * 3)

Tablet/Mobile:
  - isWeb: false
  - isMobile: true (width < 768)
  - Card Height: 350px
  - Margins: 16px (lg)
```

## Interactive States

### Button States:
- **Enabled**: Full color, normal shadows
- **Disabled**: Opacity 0.5, light gray background
- **Active**: Scale, shadow increase (implicit)

### Card States:
- **Question**: Front of card with blue icon
- **Answer**: Back of card (flipped) with success icon
- **Flipping**: Animated rotation with opacity fade

### Knowledge Tracking:
- **Selected (Known)**: Green button highlighted, card marked
- **Selected (Learning)**: Amber button highlighted, card marked
- **Unselected**: Both buttons available

## Animation Specifications

| Animation | Duration | Type | Easing |
|-----------|----------|------|--------|
| Card Flip | 300ms | Rotate (0-180°) | useNativeDriver |
| Progress Fill | Smooth | Width animation | Animated |
| Button Press | Instant | Opacity reduction | useNativeDriver |

## Accessibility Features

✅ **Text Contrast**: WCAG AA compliant
✅ **Touch Targets**: Minimum 44x44px for buttons
✅ **Visual Feedback**: Color changes for interactive elements
✅ **Icons + Text**: All icons accompanied by text labels
✅ **Spacing**: Adequate padding for readability
✅ **Typography**: Proper heading hierarchy

## Component Features

### 1. **Input Methods**
   - Text input for topic-based flashcard generation
   - Image upload for content-based flashcards
   - Tab switching between methods

### 2. **Study Interface**
   - Flip animation for question/answer reveal
   - Progress bar showing completion percentage
   - Knowledge tracking (Known/Learning cards)
   - Previous/Next navigation

### 3. **Statistics**
   - Real-time tracking of known cards
   - Real-time tracking of learning cards
   - Progress percentage display
   - Summary statistics at session end

### 4. **Visual Feedback**
   - Animated card flipping
   - Button state changes
   - Progress bar animation
   - Loading states

## Best Practices Used

✅ **Semantic HTML/Components**: Clear visual hierarchy
✅ **Consistent Spacing**: Regular use of spacing scale
✅ **Color System**: Strategic use of theme colors
✅ **Typography**: Clear heading hierarchy
✅ **Shadows**: Subtle elevation for depth
✅ **Responsive Design**: Works across all screen sizes
✅ **Performance**: Optimized animations with native driver
✅ **Accessibility**: Full accessibility support

---

This design system creates a professional, modern flashcard study interface that's both beautiful and highly functional.
