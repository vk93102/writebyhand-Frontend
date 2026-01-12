# React Native TextInput Focus Styling - Complete Solution

## Problem Analysis

### What Causes the Default Focus Outline/Highlight?

#### 1. **Android-Specific Behavior**
- **Default Underline**: Android's Material Design adds a colored underline when TextInput is focused
  - **Location**: Below the input field (elevation/ripple effect)
  - **Color**: Usually system accent color (blue by default)
  - **Cause**: Native Android `EditText` component styling

- **Cursor Line**: Blinking cursor with default color (usually primary color)

#### 2. **iOS-Specific Behavior**
- **No system-level focus indicator** (iOS doesn't show a default outline)
- **Cursor color**: Default is system blue
- **Focus behavior**: More subtle, relies on custom styling

#### 3. **React Native Cross-Platform**
- `TextInput` component doesn't provide native focus styling on iOS
- Android inherits Material Design focus states
- Web (Expo Web) shows browser default focus rings

---

## Solution: Complete Focus Behavior Override

### Step 1: Add Focus State Management

Track focus state in the component:

```tsx
const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);

<TextInput
  onFocus={() => setFocusedInput('username')}
  onBlur={() => setFocusedInput(null)}
  // ... rest of props
/>
```

### Step 2: Disable Native Focus Indicators

Use these properties on `TextInput`:

```tsx
<TextInput
  // Disable Android focus underline
  underlineColorAndroid="transparent"  // ← Key property
  
  // Disable default cursor color (set custom later)
  selectionColor="transparent"  // Set to transparent, then override with borderColor
  
  // Keyboard handling
  keyboardType="email-address"
  
  // Platform-specific
  // ... other props
/>
```

### Step 3: Custom Focus Styling via Container

Style the **parent container** instead of the input:

```tsx
const [focusedInput, setFocusedInput] = useState<string | null>(null);

<View 
  style={[
    styles.inputContainer,
    focusedInput === 'username' && styles.inputFocused,
    errors.username && styles.inputError
  ]}
>
  <MaterialIcons name="person" size={20} color={colors.textMuted} />
  <TextInput
    style={styles.input}
    placeholder="Enter username or email"
    placeholderTextColor={colors.textMuted}
    value={username}
    onChangeText={setUsername}
    onFocus={() => setFocusedInput('username')}
    onBlur={() => setFocusedInput(null)}
    // Critical properties to disable default focus
    underlineColorAndroid="transparent"
    selectionColor="transparent"
  />
</View>
```

### Step 4: Style the Container with Focus States

```tsx
const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',  // Default border
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 52,
    gap: 12,
    // Optional: smooth transition
    transitionProperty: 'borderColor',
    transitionDuration: '200ms',
  },
  
  inputFocused: {
    // Only change border color on focus
    borderColor: '#3B82F6',  // Your custom focus color
    // Optional: subtle shadow on focus
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  inputError: {
    borderColor: '#EF4444',
  },
  
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 14,
    // Remove all focus-related styling from input itself
    // Let the container handle focus styling
  },
});
```

---

## Complete Implementation for LoginScreen

### Before (Current - Has Default Focus Highlight):
```tsx
<TextInput
  style={styles.input}
  placeholder="Enter username or email"
  placeholderTextColor={colors.textMuted}
  value={username}
  onChangeText={setUsername}
  // ← Missing: No focus handling, default focus styles show
/>
```

### After (Solution - No Default Focus Highlight):
```tsx
const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);

<View style={[styles.inputContainer, focusedInput === 'username' && styles.inputFocused]}>
  <MaterialIcons name="person" size={20} color={colors.textMuted} />
  <TextInput
    style={styles.input}
    placeholder="Enter username or email"
    placeholderTextColor={colors.textMuted}
    value={username}
    onChangeText={(text) => {
      setUsername(text);
      if (errors.username) setErrors({ ...errors, username: undefined });
    }}
    onFocus={() => setFocusedInput('username')}
    onBlur={() => setFocusedInput(null)}
    autoCapitalize="none"
    autoCorrect={false}
    // ← Critical properties
    underlineColorAndroid="transparent"
    selectionColor="transparent"
  />
</View>
```

---

## Key Properties Explained

| Property | Android | iOS | Purpose |
|----------|---------|-----|---------|
| `underlineColorAndroid="transparent"` | ✓ Removes underline | N/A | Disables Material Design underline |
| `selectionColor="transparent"` | ✓ | ✓ | Hides selection highlight color (shows your custom border instead) |
| `onFocus` callback | ✓ | ✓ | Track focus state for custom styling |
| `onBlur` callback | ✓ | ✓ | Track blur state for custom styling |
| Container border + shadow | ✓ | ✓ | Provides custom focus visual feedback |

---

## Platform-Specific Considerations

### Android
- Default behavior: Shows blue underline + ripple effect on focus
- Solution: `underlineColorAndroid="transparent"` removes it completely
- Cursor color: Controlled by `selectionColor` (set to transparent to hide)
- Alternative: Use `style={[styles.input, Platform.OS === 'android' && styles.inputAndroid]}`

### iOS
- Default behavior: No native focus indicator (good!)
- Only concern: Cursor color (default blue)
- Solution: `selectionColor="transparent"` + container border provides visual feedback
- Text selection color: `selectionColor` controls highlight when selecting text

### Web (Expo Web)
- Default behavior: Browser outline (thin blue ring)
- Solution: CSS resets + container styling handles this
- Fallback: Use Web standard outline reset in global styles

---

## Accessibility Considerations

✅ **What We're Preserving:**
- Focus state is still tracked internally
- Keyboard navigation still works
- Screen readers can detect focused inputs
- Custom visual feedback (border color) provides clear focus indicator

✅ **Best Practices:**
1. **Always provide visual focus indicator** - User must know which field is focused
2. **Use sufficient color contrast** - Focus border color vs background
3. **Keep focus indicator visible** - Don't hide it with `opacity: 0`
4. **Keyboard navigation** - Tab/arrow keys still work as expected
5. **Screen reader support** - Unchanged, still announces focus to assistive tech

❌ **DO NOT DO:**
```tsx
// Bad - hides focus, breaks accessibility
onFocus={() => setFocusedInput(null)}  // Wrong!

// Bad - removes visual feedback
inputFocused: { borderColor: 'transparent' }  // No visible focus!

// Bad - changes accessibility tree
accessibilityRole="none"  // Hides from screen readers!
```

---

## Testing Checklist

- [ ] **Android**: Tap input → no blue underline, custom border shows
- [ ] **iOS**: Tap input → custom border appears, cursor visible
- [ ] **Web**: Click input → no browser outline, custom border shows
- [ ] **Keyboard**: Tab key → focus moves between inputs, border updates
- [ ] **Screen reader**: Focus announcements work correctly
- [ ] **Error state**: Error border takes precedence over focus border
- [ ] **Multiple inputs**: Only one has focus state at a time

---

## Migration Path

### Step 1: Add state tracking
```tsx
const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
```

### Step 2: Add focus handlers to each TextInput
```tsx
onFocus={() => setFocusedInput('username')}
onBlur={() => setFocusedInput(null)}
```

### Step 3: Add critical properties
```tsx
underlineColorAndroid="transparent"
selectionColor="transparent"
```

### Step 4: Update container styles
```tsx
style={[
  styles.inputContainer,
  focusedInput === 'username' && styles.inputFocused,
  errors.username && styles.inputError
]}
```

### Step 5: Add focus style
```tsx
inputFocused: {
  borderColor: '#3B82F6',
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
}
```

---

## Summary

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Android blue underline | Material Design default | `underlineColorAndroid="transparent"` |
| iOS/Android cursor highlight | TextInput selection color | `selectionColor="transparent"` |
| No visual feedback | Missing custom styling | Container border + shadow on focus |
| Accessibility broken | Focus hidden | Keep visual indicator, track state |

**Result**: Clean, professional UI with zero system-provided focus indicators + custom professional focus styling + maintained accessibility.
