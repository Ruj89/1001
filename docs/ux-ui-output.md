# UX/UI Designer Output - Offline-first PWA archive derived from `1001.ods`

## 1. User Problem Frame

The user is the sole owner and operator of a personal archive currently maintained in an ODS workbook. The primary usage context is Android, with occasional desktop use for broader review.

What is difficult today is not storing the data, but working with it. The spreadsheet forces the user into a row-based, office-style interaction model that is slow to browse, awkward to filter, hard to edit safely on a phone, and cognitively heavier because one logical title may span multiple rows and some rows inherit the title implicitly.

This change matters because the archive is useful only if it can be maintained frequently and with low friction. The MVP needs to replace spreadsheet-centric daily work with a mobile-usable local archive that is fast to consult, easy to update, and still exportable back to an operationally familiar ODS format.

## 2. Current Flow Summary

Today the user works directly inside the spreadsheet, mainly through the `Lista` sheet as the operational source. They scan rows manually, interpret repeated titles across multiple rows, and mentally resolve blank-title continuation rows through fill-down behavior.

Derived sheets such as `Appoggio` and `Risultati` help operationally, but they are still spreadsheet outputs rather than a purpose-built browsing experience. This means the user is switching between dense row data and derived summaries without a clear mobile-first navigation model.

The main friction points are concentrated in browsing and comprehension. Finding a title, understanding its variants, checking its status, and making small edits all require spreadsheet interaction patterns that are particularly poor on Android. Import and export exist only as file handling concerns, not as guided product flows.

## 3. Target Flow Summary

The target flow should remain browsing first and title first, but the first screen should be a dashboard rather than the archive list itself. On opening the app, the user should land on a mobile-optimized dashboard with the search bar in primary position, quick actions for the most important archive operations, and a clear way to move into the full title list.

From the dashboard, the user should be able to move quickly into the list view, search results, or a specific title. The list should still act as the main browsing surface, but it is entered from the dashboard rather than serving as the home screen. Status filtering should preserve the full explicit status vocabulary of the archive, while making the 3-4 most frequent statuses faster to access than the less common ones.

From the list, the user should be able to open a title detail view that clearly separates title-level identity from its ordered sub-variants. The detail view should be read-first and scan-first, with editing initiated intentionally through explicit actions rather than presenting the whole screen as always-editable. Each sub-variant should expose the four required fields (`platform`, `edition/version`, `support`, `status`) in a way that is easy to scan and then edit from a phone. The flow should reduce cognitive load by making the grouped model explicit instead of forcing the user to infer it from raw rows.

Secondary flows should stay available but visually subordinate to browsing: importing a new ODS with explicit overwrite confirmation, creating a new title record, exporting the current archive back to ODS, and viewing basic archive status metadata. The product should feel like a practical offline archive tool, not like a spreadsheet replica.

## 4. UX Constraints

The design is constrained by Android-first usability. Core flows must work well on a phone-sized viewport, with touch interaction and software keyboard usage treated as first-class conditions.

The MVP is strictly offline-first and local-only. There is no backend, no sync, and no multi-user behavior to design around. The app must respect the normalized `title + sub-variants` model and must not reintroduce spreadsheet mechanics unless required for operational continuity.

Import uses only the first ODS sheet, `Lista`, and replaces the entire local archive only after explicit confirmation. Export must remain operationally close to the current workbook, including the presence of `Lista`, `Risultati`, and `Appoggio`, but the UI should not expand into spreadsheet-clone territory in order to satisfy that continuity requirement.

The UI must support all explicit real-world status values already present in the archive. UX simplification can happen through prioritization and faster access to common statuses, but not by hiding or collapsing the full status set out of the MVP interaction model.

## 5. Assumptions and Unknowns

Assumption: the primary user is also the decision-maker, so the MVP can optimize hard for a single-user Android workflow without accommodating broader organizational needs.

Assumption: the main usability win will come from improving browse, search, filter, detail, and edit flows rather than from making import/export prominent in the primary navigation.

Assumption: sub-variant order must remain visible and preserved because source order is part of the confirmed data behavior and may matter operationally.

Assumption: the home screen should be a dashboard with search in primary position, quick actions, and access to the full list, rather than the list itself as the landing screen.

Assumption: the title detail view should prioritize readability first, with edit actions entered deliberately from that surface.

Assumption: status selection should use a hybrid interaction model, with the 3-4 most common statuses immediately available and the full set still reachable through explicit lookup or manual text entry.

Unknown: the exact fidelity expectations for exported ODS formulas versus static derived values are still open technically, but this should not block MVP flow design because export remains a secondary flow in the interaction model.

## 6. Recommended Design Artifact

`wireframe`

A low-to-mid fidelity wireframe is the minimum useful artifact for the next phase. The problem is primarily about mobile information architecture, screen hierarchy, detail composition, and editing ergonomics, not about polished visual design or motion.

A wireframe is more useful than a pure user flow because the key risks are screen-level: how the dashboard is structured, how search and quick actions dominate the home screen, how the title list behaves on Android, how full-status filtering is exposed without clutter, how title detail and sub-variants are structured, and how edits are initiated with minimal friction. A prototype would be premature at this stage and would add effort without reducing the most important product and engineering ambiguities.

## 7. Handoff Notes

Product should keep the MVP tightly bounded around daily archive usage, with browsing and editing as the dominant experience and import/export treated as secondary operational flows.

Engineering should expect the wireframe to drive screen structure for at least these areas: dashboard, archive list, search/filter behavior, title detail, sub-variant edit flow, import confirmation, export entry point, and archive status screen. The design must preserve the confirmed data rules, especially title grouping, fill-down-derived source meaning, sub-variant order, and the full explicit status set.

The dashboard should place search first, expose quick actions clearly, and provide visible but secondary access to import. The title detail should stay scan-oriented until the user explicitly enters edit mode. Status handling should support all real statuses while making the most common ones significantly faster to set.

QA should pay close attention to whether the final implementation actually removes spreadsheet-style friction on Android. The most important validation is not visual fidelity, but whether the user can quickly find a title, understand its variants, and make safe edits offline without falling back to spreadsheet habits.
