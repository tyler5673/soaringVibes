# Mobile Throttle+Rudder Joystick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace separate throttle and rudder sliders with a unified square joystick widget on mobile that controls throttle (vertical, persists) and yaw/rudder (horizontal, auto-centers).

**Architecture:** Add new `.throttle-rudder-container` HTML element with touch event handlers in controls.js. Stick position maps to normalized X/Y values that update `touchInput.yaw` and `touchInput.throttle`. CSS transitions enable horizontal reset animation while preserving vertical position.

**Tech Stack:** Vanilla JavaScript (touch events), CSS3 (transforms, transitions), Three.js flight simulator context

---

## File Structure

| File | Changes |
|------|---------|
| `index.html` | Add throttle-rudder-zone HTML, remove throttle-zone and rudder-zone |
| `css/style.css` | Add joystick styles, remove slider styles |
| `js/controls.js` | Add joystick touch handlers, update touchInput state, remove slider handlers |

---

### Task 1: Update touchInput state structure

**Files:**
- Modify: `js/controls.js:7-12`

- [ ] **Step 1: Update touchInput object**

Replace current structure with new one that includes throttle as a value (not derived):

```javascript
const touchInput = {
    rightStick: { x: 0, y: 0, active: false },
    yaw: 0, // -1 to 1 for rudder (center = 0)
    throttle: 0.5, // 0 to 1, default = center position (50%)
    reset: false
};
```

- [ ] **Step 2: Verify no syntax errors**

Open browser console on mobile or use Chrome DevTools Device Mode. Expected: No JavaScript errors.

- [ ] **Step 3: Commit**

```bash
git add js/controls.js
git commit -m "feat: update touchInput state for throttle+rudder joystick"
```

---

### Task 2: Add HTML structure for new joystick widget

**Files:**
- Modify: `index.html:333-365` (inside `<div id="touch-controls">`)

- [ ] **Step 1: Locate touch-controls section**

Find the closing tag of existing throttle-zone div (around line 339).

- [ ] **Step 2: Replace throttle and rudder zones with new joystick**

Remove these blocks entirely:
```html
<div id="throttle-zone" class="throttle-container">
    <div class="throttle-track">
        <div id="throttle-handle" class="throttle-handle"></div>
    </div>
</div>
```

and

```html
<div id="rudder-zone" class="rudder-container">
    <div class="rudder-track">
        <div id="rudder-handle" class="rudder-handle"></div>
    </div>
</div>
```

Add new joystick widget right after `<div id="touch-controls" style="display: none;">`:
```html
<div id="throttle-rudder-zone" class="throttle-rudder-container">
    <div class="throttle-rudder-zone-bg">
        <div id="throttle-rudder-stick" class="throttle-rudder-stick"></div>
    </div>
</div>
```

- [ ] **Step 3: Validate HTML**

Run `npx serve` and open in mobile emulator. Expected: No console errors, touch controls visible on mobile.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add throttle+rudder joystick HTML structure"
```

---

### Task 3: Add CSS styles for joystick container and zone background

**Files:**
- Modify: `css/style.css` (add after line ~1120, after existing rudder styles)

- [ ] **Step 1: Add portrait mode styles**

Insert new CSS block after the `.rudder-container .touch-label` rule:

```css
/* Throttle+Rudder Joystick (square zone on left side) */
.throttle-rudder-container {
    position: absolute;
    left: 20px;
    bottom: 20px;
    width: 140px;
    height: 140px;
    pointer-events: auto;
    touch-action: none;
}

.throttle-rudder-zone-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    background: var(--color-bg-surface);
    border: 2px solid var(--color-border);
    border-radius: 15px;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.throttle-rudder-stick {
    position: absolute;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 15px var(--color-primary-glow-strong);
    transition: left 0.3s ease-out;
}

.throttle-rudder-stick.at-boundary {
    border-color: var(--color-primary-glow);
    box-shadow: 0 0 20px var(--color-primary-glow-strong), 0 0 10px var(--color-primary);
}
```

- [ ] **Step 2: Add landscape mode responsive styles**

Find the landscape media query (around line 1166) and add inside it:

```css
.throttle-rudder-container {
    width: 180px;
    height: 180px;
    bottom: 40px;
}

.throttle-rudder-zone-bg {
    width: 160px;
    height: 160px;
}

.throttle-rudder-stick {
    width: 70px;
    height: 70px;
}
```

- [ ] **Step 3: Verify CSS loads**

Run `npx serve` and check in DevTools that styles are applied. Expected: Joystick zone visible on left side with square background and centered circular stick.

- [ ] **Step 4: Commit**

```bash
git add css/style.css
git commit -m "feat: add CSS for throttle+rudder joystick widget"
```

---

### Task 4: Implement joystick touch event handlers in controls.js

**Files:**
- Modify: `js/controls.js` (add after existing right-stick handlers, around line ~160)

- [ ] **Step 1: Add helper function for clamping**

Add near the top of the file with other utility functions (after line ~25):

```javascript
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
```

- [ ] **Step 2: Add joystick initialization and handlers**

Insert after the right-stick touch event handlers (find the closing brace of `rightStickZone.addEventListener('touchcancel', ...)` around line ~158):

```javascript
// Throttle+Rudder Joystick (square zone on left)
const throttleRudderZone = document.getElementById('throttle-rudder-zone');
const throttleRudderStick = document.getElementById('throttle-rudder-stick');
const throttleRudderZoneBg = throttleRudderZone?.querySelector('.throttle-rudder-zone-bg');
let trTouchId = null;

if (throttleRudderZone && throttleRudderStick && throttleRudderZoneBg) {
    const updateFromPosition = (clientX, clientY) => {
        const zoneRect = throttleRudderZoneBg.getBoundingClientRect();
        const centerX = zoneRect.left + zoneRect.width / 2;
        const centerY = zoneRect.top + zoneRect.height / 2;
        const stickWidth = throttleRudderStick.offsetWidth;
        const maxDistance = (zoneRect.width - stickWidth) / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        const normalizedX = clamp(dx / maxDistance, -1, 1);
        const normalizedY = clamp(dy / maxDistance, -1, 1);

        touchInput.yaw = normalizedX;
        touchInput.throttle = clamp(0.5 - (normalizedY * 0.5), 0, 1);

        const stickLeft = 50 + (normalizedX * maxDistance);
        const stickTop = 50 - (normalizedY * maxDistance);

        throttleRudderStick.style.left = stickLeft + '%';
        throttleRudderStick.style.top = stickTop + '%';
        throttleRudderStick.style.transform = 'translate(0, 0)';

        if (Math.abs(normalizedX) >= 0.95 || Math.abs(normalizedY) >= 0.95) {
            throttleRudderStick.classList.add('at-boundary');
        } else {
            throttleRudderStick.classList.remove('at-boundary');
        }
    };

    const resetYawToCenter = () => {
        const currentTop = throttleRudderStick.style.top;
        touchInput.yaw = 0;
        throttleRudderStick.style.left = '50%';
        throttleRudderStick.style.transform = 'translate(-50%, -50%)';
        if (currentTop) {
            throttleRudderStick.style.top = currentTop;
            throttleRudderStick.style.transform = 'translate(0, 0)';
        }
        throttleRudderStick.classList.remove('at-boundary');
    };

    throttleRudderZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        trTouchId = touch.identifier;
        updateFromPosition(touch.clientX, touch.clientY);
    }, { passive: false });

    throttleRudderZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === trTouchId) {
                updateFromPosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                break;
            }
        }
    }, { passive: false });

    throttleRudderZone.addEventListener('touchend', resetYawToCenter);
    throttleRudderZone.addEventListener('touchcancel', resetYawToCenter);
}
```

- [ ] **Step 3: Initialize stick at center position**

Add right after the declaration of `throttleRudderStick` (line added in Step 2):

```javascript
if (throttleRudderStick) {
    throttleRudderStick.style.left = '50%';
    throttleRudderStick.style.top = '50%';
    throttleRudderStick.style.transform = 'translate(-50%, -50%)';
}
```

- [ ] **Step 4: Test touch interaction**

Run `npx serve`, open in mobile emulator, drag stick. Expected: Stick moves with finger, yaw updates horizontally (resets on release), throttle updates vertically (persists).

- [ ] **Step 5: Commit**

```bash
git add js/controls.js
git commit -m "feat: implement throttle+rudder joystick touch handlers"
```

---

### Task 5: Remove old throttle slider code from controls.js

**Files:**
- Modify: `js/controls.js` (lines ~28-160)

- [ ] **Step 1: Locate and remove throttle slider section**

Find and delete the entire block starting with:
```javascript
// Throttle slider
const throttleZone = document.getElementById('throttle-zone');
const throttleHandle = document.getElementById('throttle-handle');
let throttleTouchId = null;
```

Delete through the end of its touch event handlers (find `throttleZone.addEventListener('touchcancel', ...)` and remove everything including that block).

- [ ] **Step 2: Verify removal**

Search for remaining references to `throttle-zone`, `throttleHandle`, `throttleTouchId`. Expected: No matches except in comments if any.

- [ ] **Step 3: Commit**

```bash
git add js/controls.js
git commit -m "refactor: remove old throttle slider code"
```

---

### Task 6: Remove old rudder slider code from controls.js

**Files:**
- Modify: `js/controls.js` (lines ~162-232)

- [ ] **Step 1: Locate and remove rudder slider section**

Find and delete the entire block starting with:
```javascript
// Rudder slider (horizontal, below joystick)
const rudderZone = document.getElementById('rudder-zone');
const rudderHandle = document.getElementById('rudder-handle');
let rudderTouchId = null;
```

Delete through `resetRudderToCenter()` function and all associated event handlers.

- [ ] **Step 2: Verify removal**

Search for remaining references to `rudder-zone`, `rudderHandle`, `rudderTouchId`, `resetRudderToCenter`. Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add js/controls.js
git commit -m "refactor: remove old rudder slider code"
```

---

### Task 7: Remove old slider CSS styles

**Files:**
- Modify: `css/style.css` (throttle styles around line ~1040, rudder styles around line ~1083)

- [ ] **Step 1: Remove throttle slider styles**

Find and delete these CSS blocks:
```css
/* Throttle Slider */
.throttle-container { ... }
.throttle-track { ... }
.throttle-handle { ... }
.throttle-container .touch-label { ... }
```

- [ ] **Step 2: Remove rudder slider styles**

Find and delete these CSS blocks:
```css
/* Rudder Slider (horizontal, below joystick) */
.rudder-container { ... }
.rudder-track { ... }
.rudder-handle { ... }
.rudder-container .touch-label { ... }
```

- [ ] **Step 3: Remove landscape slider styles**

In the `@media (max-width: 768px) and (orientation: landscape)` block, remove:
```css
#throttle-zone { ... }
.throttle-track { ... }
.throttle-handle { ... }
.rudder-container { ... }
.rudder-track { ... }
.yaw-button { ... }
.yaw-container { ... }
```

- [ ] **Step 4: Verify no broken references**

Run `npx serve` and check console. Expected: No "undefined class" warnings or similar errors.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "refactor: remove old slider CSS styles"
```

---

### Task 8: Fix isTouchOnControlElement to include new joystick

**Files:**
- Modify: `js/controls.js` (find the function, around line ~419)

- [ ] **Step 1: Locate isTouchOnControlElement function**

Find the function that checks if touch is on control elements.

- [ ] **Step 2: Update element list**

Add `'throttle-rudder-zone'` to the list of control element IDs checked in the function. The exact change depends on implementation, but ensure the new joystick zone is recognized as a control element.

Example if using ID check:
```javascript
const controlElements = ['right-stick-zone', 'throttle-rudder-zone', 'reset-btn-touch', ...];
```

- [ ] **Step 3: Commit**

```bash
git add js/controls.js
git commit -m "fix: update isTouchOnControlElement for new joystick"
```

---

### Task 9: Test and verify all functionality

**Files:**
- Test in browser with `npx serve`

- [ ] **Step 1: Visual test (portrait)**

Open on mobile or Chrome DevTools Device Mode (iPhone 12 portrait). Check:
- Joystick appears on left side, bottom-aligned
- Square zone with rounded corners visible
- Stick centered at rest position
- No throttle/rudder sliders visible

- [ ] **Step 2: Visual test (landscape)**

Rotate to landscape. Check:
- Joystick resizes correctly (larger)
- Position adjusts to avoid conflicts
- All elements remain visible and properly sized

- [ ] **Step 3: Interaction test - vertical axis**

Drag stick up and down only. Check:
- Throttle value changes (0 at bottom, 1 at top, 0.5 at center)
- Stick stays at new vertical position after release
- Aircraft responds to throttle changes

- [ ] **Step 4: Interaction test - horizontal axis**

Drag stick left and right only. Check:
- Yaw value changes (-1 left, +1 right, 0 center)
- Stick smoothly animates back to center horizontally on release
- Vertical position is preserved during reset
- Aircraft responds to rudder input

- [ ] **Step 5: Interaction test - diagonal**

Drag stick diagonally (e.g., up-right). Check:
- Both throttle and yaw update simultaneously
- Release preserves throttle, resets yaw
- No visual glitches or snapping issues

- [ ] **Step 6: Multi-touch test**

Touch both left joystick (throttle/rudder) and right joystick (pitch/roll) simultaneously. Check:
- Both joysticks respond independently
- No touch ID conflicts
- All four inputs (pitch, roll, yaw, throttle) work together

- [ ] **Step 7: Boundary visual feedback test**

Drag stick to edges of zone. Check:
- `at-boundary` class applies when near edge
- Visual highlight/glow intensifies at boundaries
- Stick cannot be dragged outside zone bounds

- [ ] **Step 8: Console error check**

Open DevTools console. Expected: No JavaScript errors, no warnings about missing elements or undefined variables.

---

### Task 9: Final cleanup and commit

**Files:** All modified files

- [ ] **Step 1: Run git status**

```bash
git status
```

Expected: Modified `index.html`, `css/style.css`, `js/controls.js`

- [ ] **Step 2: Review changes**

```bash
git diff --stat
```

Verify reasonable line counts (should be net reduction due to removing old code).

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete throttle+rudder joystick implementation

- Added square joystick widget on left side for mobile
- Vertical axis controls throttle (persists)
- Horizontal axis controls yaw/rudder (auto-centers)
- Removed old slider widgets and their code
- Full multi-touch support with right joystick"
```

---

## Rollback Plan

If issues arise, rollback in reverse order:

1. Revert latest commits: `git revert HEAD~n..HEAD` (where n = number of commits made)
2. Or restore from specific commit: `git reset --hard <commit-before-changes>`

---

## Success Criteria Checklist

After all tasks complete, verify:

- [ ] Joystick appears on left side of mobile screens only
- [ ] Square zone with rounded corners, matching existing visual style  
- [ ] Vertical movement adjusts throttle (persists when released)
- [ ] Horizontal movement adjusts rudder (auto-centers when released)
- [ ] Diagonal movement works for combined inputs
- [ ] Smooth CSS animation on horizontal reset (~0.3s ease-out)
- [ ] No throttle/rudder sliders visible or functional
- [ ] Responsive sizing in landscape orientation
- [ ] Multi-touch works with right joystick (pitch/roll)
- [ ] Boundary visual feedback when stick reaches edges
- [ ] No console errors or warnings
