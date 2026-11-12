---
name: סל קניות
description: Clear Hebrew RTL household shopping with comfortable in-store controls.
colors:
  background: "hsl(210 25% 98%)"
  foreground: "hsl(222 28% 15%)"
  card: "hsl(0 0% 100%)"
  primary: "hsl(218 82% 48%)"
  primary-foreground: "hsl(0 0% 100%)"
  primary-soft: "hsl(218 85% 95%)"
  success: "hsl(151 65% 32%)"
  warning: "hsl(36 90% 40%)"
  destructive: "hsl(0 72% 55%)"
  muted-foreground: "hsl(215 16% 42%)"
  border: "hsl(214 25% 91%)"
typography:
  display:
    fontFamily: "Sora, Manrope, Arial, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "0"
  body:
    fontFamily: "Manrope, Arial, system-ui, sans-serif"
    fontSize: "16px"
    letterSpacing: "0"
rounded:
  card: "8px"
  control: "4px"
spacing:
  content-inset: "20px"
  section-gap: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.control}"
    height: "48px"
  button-purchase:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.card}"
    height: "64px"
  list-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: סל קניות

## Overview
Clear household wayfinding: retain the Cloud White identity while making product names and the next purchase action more prominent. Planning stays in a grouped feed; execution remains a dedicated full-screen product view.

## Colors
Global CSS HSL channels are authoritative. Cobalt identifies navigation and primary actions; green identifies completion; amber marks warnings. White cards sit on a cool near-white canvas. Use semantic tokens for dark-mode compatibility, never literal component colors.

## Typography
Sora display and Manrope interface typography retain Arial/system Hebrew fallbacks. Screen headings are 24px, list names 18px, product rows 16px and secondary labels 12–14px. Focus titles are 36px with 1.25 line-height and unrestricted wrapping; narrow/short screens use 28–30px.

## Layout
RTL throughout, centered 42rem app shell with 20px content insets. Four equal bottom-navigation tabs remain fixed with safe-area support. Focus actions use a 32rem maximum width and safe-area bottom spacing. On screens shorter than 650px, the product visual shrinks from 176px to 112px.

## Elevation & Depth
Cards use borders without shadows; data sections use dividers rather than floating panels. Existing semantic shadow tokens remain available for genuinely elevated controls and overlays.

## Shapes
Repeated cards and purchase controls use 8px corners; avatars, product visual and progress tracks remain circular. Avoid decorative nested cards.

## Components
Default actions are 48px tall, small/icon actions 44px, and the focus purchase button 64px. List-open/purchase controls are siblings of edit/menu controls, never nested buttons. Inputs in authentication are 48px tall with 16px text. Password validation stays inline in the signup form rather than obscuring the page with a toast. Bottom navigation is 76px; the inherited navigation spacing token remains 68px plus the existing page clearance.

## Do's and Don'ts
- Keep product names, purchase state and the next action prominent.
- Preserve Hebrew RTL and reduced-motion behavior.
- Keep all existing data access and shopping actions intact.
- Do not clip long focus product names or introduce decorative chrome.
- Do not represent isolated presentation checks as authenticated data verification.