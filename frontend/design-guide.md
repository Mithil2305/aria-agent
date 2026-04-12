1. Global Design Principles & Vibe
   The design language is analytical yet approachable. It leverages generous whitespace, rounded geometry, and a sophisticated, unified color story to prevent data fatigue. The custom palette shifts the vibe toward a modern, slightly futuristic, and highly cohesive aesthetic, ensuring that even dense data feels lightweight and premium.

2. Master Color System
   The entire interface is now driven by a specific four-color analogous palette, utilized strategically to build depth, hierarchy, and data visualization.

The Core Palette:

Primary Deep (#4E56C0): Used for primary text, deep chart values (highest density/volume), primary call-to-action buttons, and active text states.

Vibrant Accent (#9B5DE0): Used for key metrics, active icon highlights, primary progress indicators (like the gauge chart), and positive trend visuals.

Soft Accent (#D78FEE): Used for secondary chart elements, subtle borders, inactive icon states, and secondary hover effects.

Pastel Base (#FDCFFA): Used for active menu background pills, very subtle global background tints (replacing standard gray), and low-density chart fills.

Structural Neutrals (Required for Contrast):

Surfaces/Cards: Pure White (#FFFFFF) to allow the custom palette to pop without overwhelming the user.

Secondary Text: A muted, low-opacity version of the Primary Deep (e.g., rgba(78, 86, 192, 0.6)) to maintain thematic consistency.

3. Advanced Typography System
   The interface utilizes a highly legible, geometric Sans-Serif font (recommendations: Inter, Plus Jakarta Sans, or SF Pro Display). Hierarchy is strictly managed.

Display & KPIs (e.g., "$7,85421"): \* Weight: Bold (700)

Size: 28px - 32px

Letter-spacing: -0.02em (tightened for numerical cohesion)

Color: #4E56C0

Page Titles (e.g., "Dashboard"): \* Weight: Semi-Bold (600)

Size: 24px

Color: #4E56C0

Section Headers (e.g., "Sales Figures"): \* Weight: Medium (500)

Size: 16px - 18px

Color: #4E56C0

Body & Table Data: \* Weight: Regular (400)

Size: 14px

Line-height: 1.5 (for readability)

Microcopy & Labels (e.g., "Previous year"): \* Weight: Medium (500)

Size: 12px

Color: rgba(78, 86, 192, 0.5)

4. Spacing, Grid & Elevation Geometry
   The layout strictly adheres to an 8pt Baseline Grid, ensuring visual rhythm and mathematical precision across all viewports.

Border Radius System:

Large Surfaces (Cards, Modals): 16px

Interactive Elements (Buttons, Inputs, Active Menu Pills): 8px or fully rounded (999px for pills/avatars).

Padding Hierarchy:

Cards Internal Padding: 24px universally.

List Items / Table Rows: 12px top and bottom.

Elevation & Shadows:
To maintain the Soft UI feel while integrating the new palette, shadows are tinted with the primary color to avoid muddy grays.

Default Card Shadow: box-shadow: 0px 8px 24px rgba(78, 86, 192, 0.06);

Hover State Elevation (for interactive cards): box-shadow: 0px 12px 32px rgba(78, 86, 192, 0.12); transform: translateY(-2px);

5. Granular Component Breakdown
   A. Sidebar Navigation
   Structure: Fixed left rail (approx. 260px wide).

Active State: "Overview" features a background pill of #FDCFFA with text and icon heavily contrasted in #4E56C0.

Inactive State: Text and icons utilize #D78FEE, shifting to #9B5DE0 on hover with a slight background tint (rgba(253, 207, 250, 0.3)).

Toggle Switch (Light/Dark): The active mode indicator pill uses #9B5DE0 as the background with white text/icon.

B. Top Header & Search
Search Bar: \* Background: #FFFFFF

Border: 1px solid #FDCFFA

Focus State: border-color: #9B5DE0; box-shadow: 0 0 0 3px rgba(155, 93, 224, 0.2);

Icon & Placeholder Text: #D78FEE

C. Data Visualizations (The Palette in Action)
Heatmap / Scatter Plot ("Sales Figures"): This chart perfectly maps the custom palette to data density.

Zero/Empty: Light gray/white.

Low Density: #FDCFFA

Medium Density: #D78FEE

High Density: #9B5DE0

Maximum Density: #4E56C0

Gauge Chart ("Average Total Sales"): \* The progress arc uses a gradient flowing from #9B5DE0 to #4E56C0.

The background/unfilled track uses a muted #FDCFFA.

The target badge uses a #FDCFFA background with #4E56C0 text.

Geo-Map ("Countries"): \* The base map is filled with #FDCFFA.

Active/High-volume regions are highlighted using #9B5DE0 and #4E56C0.

D. Data Tables ("Transaction History")
Row Styling: Clean, borderless design.

Hover Interaction: When a user hovers over a specific transaction row, the row background transitions to #FDCFFA at a very low opacity (0.4) to aid the eye across the columns without adding clutter.

Amount Formatting: Monetary values are bolded (#4E56C0) to establish a clear focal point at the end of the reading pattern.

6. Micro-Interactions & Transitions
   Global Transitions: All interactive elements (buttons, links, row hovers) utilize a standard CSS transition for a buttery smooth feel: transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);.

Tooltips: Hovering over charts or truncated text reveals a dark tooltip (Background: #4E56C0, Text: #FFFFFF) with a 4px border radius and a fast fade-in animation (0.15s).

7. Responsive Matrix
   Desktop (1200px+): Fluid 12-column grid. Sidebar fixed. Gutter width: 24px. Max-width container for ultra-wide screens to prevent data spreading too far.

Laptop/Tablet Landscape (992px - 1199px): Sidebar remains fixed. KPI cards scale down slightly in typography size. Gutter width reduces to 20px.

Tablet Portrait (768px - 991px): Sidebar collapses to an icon-only rail (approx. 80px wide). Main grid shifts to 8 columns. The "Sales Figures" chart spans all 8 columns. Gauge chart and Map stack in a 2x2 grid below.

Mobile (320px - 767px): \* Sidebar converts to an off-canvas drawer accessed via a hamburger menu.

Layout collapses to a single column (100% width).

Card padding reduces to 16px.

Complex charts (Heatmap) become swipeable/horizontally scrollable containers with a subtle inset shadow indicating more content.
