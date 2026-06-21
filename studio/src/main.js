
/*
 * TESSEL VS — DEFERRED FEATURES (roadmap, not yet implemented)
 *
 * These were part of the larger tessel-studio.html but are intentionally
 * excluded here until they can be cleanly integrated:
 *
 * - Accessibility audit panel (WCAG 2.1/2.2, Section 508, EN 301 549)
 * - Ribbon toolbar docking (top/bottom/left/right positions)
 * - Toolbar customization (per-user show/hide of ribbon buttons)
 * - Edit history time-travel panel (visual snapshot browser)
 * - Find/Replace panel
 * - Document statistics (word/char/field counts)
 * - Pagination preview mode for compiled output
 * - PDF/UA compositing
 * - Preference export/import
 * - Mobile/touch layout optimizations
 * - Mode pill toggle to merge with Tessel Studio Markdown (split-pane IDE view)
 * - Inline richtext formatting toolbar (bold/italic/link in paragraph blocks)
 * - YAML front-matter header in .md files (--- fences at top): standard fields
 *   (title, author, created, modified, description, tags) + author-defined custom
 *   typed fields (text, number, integer, date, datetime, boolean); front-matter
 *   is stripped before HTML rendering so it never appears in compiled output;
 *   round-tripped on open so the editor restores all header values; compatible
 *   with Jekyll/Hugo/GitHub tooling by convention
 * - File metadata dialog (File menu): UI for viewing and editing the front-matter
 *   block — standard fields pre-populated, plus an "Add field" row for custom
 *   author-defined header fields with a type selector
 * - Filename / document-title state variable driven by front-matter `title:`
 *   (editor title bar and _filename both reflect it); md header variable
 *   constructor for templating metadata into block content at export time
 *   (e.g. {{title}}, {{author}}, {{date}})
 * - Undo history sidecar: persist undo/redo stacks to a <name>.undo file
 *   alongside the .md (editor state, not document content — kept separate to
 *   preserve content hash); inside ZIP packages stored as _tessel/<name>.undo;
 *   schema: JSON { schemaVersion, undoStack, redoStack, savedAt }; loaded
 *   automatically when the matching .md or .zip is opened, silently ignored if absent
 * - Multi-document ZIP package support: index.json manifest auto-generated from
 *   each .md's YAML front-matter `title:` field (not the filename); manifest
 *   records title, source filename, and order; ZIP open/save treats the full set
 *   as a project; batch HTML export derives page titles and inter-page <a href>
 *   links from the manifest (slugified from title, not filename)
 * - Contents badge button (upper-left toolbar): for single docs shows heading
 *   outline; for multi-doc packages shows a project-level table of contents
 *   auto-built from each document's front-matter title; in exported HTML the
 *   badge becomes a collapsible sidebar nav with relative-path links between
 *   sibling pages, all titles sourced from front-matter not filesystem names
 * - PWA packaging: add a web app manifest (manifest.json) and minimal service
 *   worker to make Tessel VS installable as a Progressive Web App in Chrome/Edge;
 *   once installed it gets its own window, taskbar/dock icon, launches offline, and
 *   registerProtocolHandler becomes available for the tessel:// edit-in-place badge
 *   feature on exported HTML; the service worker caches the single HTML file so the
 *   app works fully offline after first load; File System Access API native save
 *   dialogs work without any additional changes; this is the lowest-friction path
 *   to a native-feeling desktop experience with no packaging infrastructure, no
 *   code signing requirement, and no distribution overhead; Tauri is deferred as a
 *   later option if OS-level protocol registration, code-signed installers, or
 *   per-type save path control beyond what the browser permits become necessary
 * - Filename suggestion toggle: a preference controlling whether the save dialog
 *   pre-populates the filename automatically from the state variable compositor
 *   (deriving the name from front-matter title, date, document ID, or other
 *   metadata fields via a template e.g. "{{title}}-{{date}}") or leaves the
 *   filename blank and requires the user to name the file manually every time;
 *   when auto-suggestion is on, the compositor result is editable before confirm
 *   so it serves as a smart default rather than a forced name; the compositor
 *   template itself is configurable per file type (the .md draft may want a
 *   different naming convention than the .zip package or exported .html);
 *   lives in Options > Preferences > Export
 * - Customizable default save path: a preference setting for the directory that
 *   silent-download saves target, overriding the browser's default download folder;
 *   in the browser context this is advisory only (browsers restrict programmatic
 *   path control) but in an Electron wrapper it becomes fully functional via
 *   app.getPath / dialog.showSaveDialog with a remembered last-used directory;
 *   the setting lives in Options > Preferences > Export alongside the existing
 *   file-picker vs. silent-download toggle; per-file-type path overrides (e.g.
 *   .zip packages always go to a project folder, .md drafts go elsewhere) are a
 *   natural extension of this setting
 * - Field type audit: methodical per-type review of all field types (text, area,
 *   date, datetime, number, email, phone, url, select, radio, check, credential,
 *   totp, filename, dir, parse, image, richtext, computed, signature, attachment)
 *   covering: canvas preview fidelity vs. compiled HTML output, available
 *   properties and whether any are missing per type, label/placeholder/description
 *   consistency, validation options and their serialization, masking behavior for
 *   credential and totp, expression syntax and evaluation for computed, options
 *   management UX for radio/check/select, stub completeness for signature, and
 *   whether each type round-trips correctly through serialize → parse → render;
 *   also establish a per-field `description` / hint text property (secondary line
 *   below the label, visible in both canvas and compiled output) as a standard
 *   property across all field types
 * - Multi-column / multiple blocks per line: allow blocks to be placed side by
 *   side on the same row rather than strictly stacking vertically; authored via a
 *   row container block type that holds a set of child blocks laid out in a CSS
 *   grid or flexbox row; each child block retains its own independent properties,
 *   selection, and formatting; column widths are settable per child (fixed px,
 *   fractional fr units, or auto); row containers participate in multi-block
 *   selection, branch dimming, and section completion like any other block;
 *   in compiled HTML output the row renders as a responsive grid that collapses
 *   to single-column at narrow viewport widths; the block insertion UI gains an
 *   "add column" affordance when the cursor is inside a row container
 * - Text alignment controls: horizontal (left/center/right/justify) and vertical
 *   (top/center/bottom) alignment per block; both axes are set simultaneously via
 *   a 3×3 grid widget in the right pane — nine clickable cells representing every
 *   combination of vertical × horizontal alignment, with the active combination
 *   highlighted; clicking a cell sets both axes at once without requiring two
 *   separate controls; horizontal alignment maps to CSS text-align on the block
 *   content; vertical alignment maps to flexbox align-items on the block container;
 *   both properties are included in multi-block selection and apply to all eligible
 *   blocks in the set; the 3×3 grid is also a natural candidate for the multi-select
 *   pane since it communicates mixed state clearly (no cell highlighted = mixed)
 * - Multi-block selection in the canvas editor: shift+click selects a contiguous
 *   range of blocks, ctrl/cmd+click toggles individual blocks into or out of the
 *   selection set; selected blocks each show a distinct selection ring distinct from
 *   the single active-block highlight; the right pane reflects the union of all
 *   selected blocks — controls that apply to at least one block in the selection are
 *   shown normally and apply only to the eligible subset when fired; controls that
 *   apply to none of the selected block types are dimmed (not hidden) so the pane
 *   layout stays stable and the user understands what would be available on a
 *   different selection; controls with mixed values across the selection show an
 *   indeterminate state (dimmed or "—") and writing a new value snaps all eligible
 *   blocks to that value simultaneously; properties that cleanly apply across block
 *   types include indentation, alignment, width, styling class/theme variant,
 *   visibility, and conditional branch membership; inline text formatting (bold,
 *   italic, etc.) applies only to the eligible text/paragraph blocks in the set and
 *   no-ops silently on incompatible types; destructive type changes are not available
 *   in multi-select; the Delete key or toolbar delete action in multi-select triggers
 *   a mass delete of all selected blocks with a single undo entry covering the full
 *   set — this is a first-class workflow for quickly clearing large sections of
 *   content without clicking block by block
 * - Section completion state: when all required inputs within a section or major
 *   partition are satisfied with at least the minimum valid input (one checkbox
 *   checked from a set, a radio option selected, a text field passing its type
 *   validation — e.g. valid IP address, non-empty required text, date in range),
 *   the section header gains a green dashed border and a ✓ badge in its upper-right
 *   corner; this is the positive complement to branch dimming and uses the same
 *   design language — dashed border + corner badge — so the two states form a
 *   coherent visual vocabulary: green/✓ = satisfied and complete, grey/⊘ = ruled
 *   out by a prior decision; together they give the user a spatial map of process
 *   progress without requiring them to scroll to verify; completion state is
 *   recomputed live as inputs change and reverts if a previously valid field is
 *   cleared or invalidated
 * - Conditional branch dimming: when a form user makes a decision that renders
 *   a branch of the walkbook inapplicable, the transition is immediate and overt
 *   at the point of decision — the affected blocks animate-collapse to their
 *   topmost section heading, dim to reduced opacity, gain a dashed border, and
 *   display a "not applicable" watermark (⊘ symbol + text overlay) centered over
 *   the collapsed region; the intentional visibility of the contraction is the UX
 *   signal — the user sees the document responding to their input and understands
 *   why content disappeared and that the remaining content is what applies to them;
 *   collapsed branches are not deleted — they remain in the document model and
 *   restore if the decision is reversed; branch conditions are authored as a
 *   block-level property linking a block group to a specific field block's value
 *   or option selection
 */

import './lib/ThemeManager.js';
import './lib/EditorDatePicker.js';
import { initApp } from './lib/AppInit.js';

// Detect rendering engine and expose as data-engine attribute on <html>.
// Used by CSS [data-engine] selectors for engine-specific tweaks.
// Chromium check must come first — Chrome UA includes "AppleWebKit" too.
(function() {
  var ua = navigator.userAgent;
  var engine = /Chrome\/|Chromium\/|EdgA?\/|OPR\//.test(ua) ? 'chromium'
             : /AppleWebKit/.test(ua)                        ? 'webkit'
             : 'other';
  document.documentElement.setAttribute('data-engine', engine);
})();

initApp();
