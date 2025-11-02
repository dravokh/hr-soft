# Codebase Refactoring Plan

## Analysis Summary

### Large Files Identified (>500 lines)
1. **ApplicationsPage.tsx** - 1,428 lines ⚠️ CRITICAL
2. **AppContext.tsx** - 1,127 lines ⚠️ CRITICAL
3. TicketsPage.tsx - 271 lines ✓ OK
4. DashboardPage.tsx - ~150 lines ✓ OK

### Problems Identified

#### 1. ApplicationsPage.tsx Issues
- **Multiple Responsibilities**: UI, business logic, data formatting, translations
- **Duplicated Code**: Date formatting, field rendering logic
- **Poor Maintainability**: Changes require editing a 1400+ line file
- **Testing Difficulty**: Components tightly coupled with business logic

#### 2. AppContext.tsx Issues
- **God Object**: Handles state, business logic, normalization, storage, SLA automation
- **Poor Separation of Concerns**: Authentication, applications, tickets all mixed
- **Hard to Test**: Business logic embedded in context
- **Performance**: All logic re-runs on any state change

#### 3. Duplicate Functionality
- Date formatting appears in multiple files
- Status definitions scattered across files
- Field templates could be shared

## Refactoring Strategy

### Phase 1: Create New Folder Structure (Preparation)

```
src/
├── components/
│   ├── applications/          # NEW - Application-specific components
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationDetailsModal.tsx
│   │   ├── CreateApplicationModal.tsx
│   │   ├── ApplicationStepper.tsx
│   │   ├── ApplicationSummary.tsx
│   │   ├── FieldInput.tsx
│   │   └── index.ts
│   ├── tickets/               # NEW - Ticket-specific components
│   │   └── index.ts
│   ├── shared/               # NEW - Shared/common components
│   │   ├── StatusBadge.tsx
│   │   ├── PriorityBadge.tsx
│   │   └── index.ts
│   └── ...existing
├── hooks/                     # NEW - Custom hooks
│   ├── useApplicationForm.ts
│   ├── useApplications.ts
│   ├── useAuth.ts
│   └── index.ts
├── services/                  # NEW - Business logic services
│   ├── applicationService.ts
│   ├── slaService.ts
│   ├── storageService.ts
│   └── index.ts
├── utils/                     # EXPAND - Utility functions
│   ├── formatting.ts         # Date, file size, time formatting
│   ├── applicationNormalizers.ts
│   ├── validation.ts
│   └── storage.ts (existing)
├── constants/                 # EXPAND - Constants
│   ├── applications.ts       # Application-specific constants
│   ├── tickets.ts           # Ticket-specific constants
│   ├── defaultData.ts       # Default data sets
│   ├── translations.ts      # Centralized translations
│   └── permissions.ts (existing)
└── ...existing
```

### Phase 2: Extract Constants & Utilities

#### 2.1 Create constants/applications.ts
Extract from ApplicationsPage.tsx:
- `STATUS_META`
- `COPY`
- `BUILT_IN_FIELD_KEYS`
- Field templates

#### 2.2 Create utils/formatting.ts
Extract and consolidate formatting functions:
- `formatDateTime`
- `formatDate`
- `formatFileSize`
- `formatRemainingTime`
- `classNames`

#### 2.3 Create constants/defaultData.ts
Extract from AppContext.tsx:
- `DEFAULT_ROLES`
- `DEFAULT_USERS`
- `DEFAULT_TICKETS`
- `DEFAULT_APPLICATION_TYPES`
- `DEFAULT_APPLICATIONS`

### Phase 3: Split AppContext.tsx

#### 3.1 Create services/applicationService.ts
Move business logic functions:
- `applyApprove`
- `applyReject`
- `applySubmit`
- `applyResend`
- `applyClose`
- `applyValuesUpdate`
- `applyAttachment`
- `applyDelegate`

#### 3.2 Create services/slaService.ts
Move SLA-related logic:
- `computeDueDate`
- `runSlaAutomation`

#### 3.3 Create utils/applicationNormalizers.ts
Move normalization functions:
- `normalizeApplicationType`
- `normalizeApplicationTypeList`
- `normalizeApplicationBundle`
- `normalizeApplications`
- `buildApplicationNumber`
- `ensureCapabilities`
- `buildFieldsForCapabilities`

#### 3.4 Create hooks/useApplications.ts
Extract application-specific hooks from context:
- Application CRUD operations
- Application state management

#### 3.5 Create hooks/useAuth.ts
Extract authentication logic:
- `login`
- `logout`
- `hasPermission`

#### 3.6 Refactor AppContext.tsx
Keep only:
- Core context provider
- State declarations
- Integration with hooks and services

### Phase 4: Split ApplicationsPage.tsx

#### 4.1 Create components/applications/ApplicationTable.tsx
Extract table rendering logic (200-300 lines)

#### 4.2 Create components/applications/CreateApplicationModal.tsx
Extract create modal (300-400 lines)

#### 4.3 Create components/applications/ApplicationDetailsModal.tsx
Extract details modal (300-400 lines)

#### 4.4 Create components/applications/ApplicationStepper.tsx
Extract stepper component (50-100 lines)

#### 4.5 Create components/applications/ApplicationSummary.tsx
Extract summary rendering (100-150 lines)

#### 4.6 Create components/applications/FieldInput.tsx
Extract field rendering logic (100-150 lines)

#### 4.7 Create hooks/useApplicationForm.ts
Extract form state management

#### 4.8 Refactor ApplicationsPage.tsx
Keep only:
- Page layout
- Component composition
- High-level state coordination

### Phase 5: Testing & Validation

1. Test each page still works correctly
2. Verify no functionality was lost
3. Check that file imports are correct
4. Ensure storage/persistence works
5. Test all user workflows

## Expected Results

### File Sizes After Refactoring

**Before:**
- ApplicationsPage.tsx: 1,428 lines
- AppContext.tsx: 1,127 lines
- Total: 2,555 lines in 2 files

**After:**
- ApplicationsPage.tsx: ~100-150 lines (orchestration only)
- AppContext.tsx: ~200-300 lines (state + context provider)
- New utility files: ~600-800 lines (split across 10+ files)
- New component files: ~1,000-1,200 lines (split across 10+ files)
- New service files: ~400-600 lines (split across 3-4 files)

**Benefits:**
- ✅ No single file over 400 lines
- ✅ Clear separation of concerns
- ✅ Reusable components and utilities
- ✅ Easier to test individual pieces
- ✅ Easier to navigate and maintain
- ✅ Better code organization

## Implementation Order

### Step 1: Create Utilities (Low Risk)
1. Create `utils/formatting.ts`
2. Create `constants/applications.ts`
3. Update imports in existing files

### Step 2: Extract Constants (Low Risk)
1. Create `constants/defaultData.ts`
2. Create `constants/tickets.ts`
3. Update AppContext.tsx imports

### Step 3: Create Services (Medium Risk)
1. Create `utils/applicationNormalizers.ts`
2. Create `services/slaService.ts`
3. Create `services/applicationService.ts`
4. Update AppContext.tsx to use services

### Step 4: Split ApplicationsPage (Medium Risk)
1. Create `components/applications/FieldInput.tsx`
2. Create `components/applications/ApplicationStepper.tsx`
3. Create `components/applications/ApplicationSummary.tsx`
4. Create `components/applications/ApplicationTable.tsx`
5. Create `components/applications/CreateApplicationModal.tsx`
6. Create `components/applications/ApplicationDetailsModal.tsx`
7. Update ApplicationsPage.tsx to use new components

### Step 5: Create Hooks (Low-Medium Risk)
1. Create `hooks/useApplicationForm.ts`
2. Optionally create other hooks as needed

### Step 6: Final Testing
1. Test all pages
2. Test all user workflows
3. Verify storage persistence
4. Check for any regressions

## Notes for Implementation

- **Commit after each step** to make rollback easy if needed
- **Test frequently** - don't wait until the end
- **Use TypeScript strictly** - ensure all types are correct
- **Keep existing functionality** - this is a refactor, not a rewrite
- **Document as you go** - add comments to new files
- **Consider backward compatibility** - don't break existing imports until ready

## Priority Files to Refactor

### High Priority (Do First)
1. ✅ **ApplicationsPage.tsx** - Most critical, 1428 lines
2. ✅ **AppContext.tsx** - Second most critical, 1127 lines

### Medium Priority (After high priority)
3. Extract duplicate utilities and constants
4. Create shared components

### Low Priority (Optional improvements)
5. Other page optimizations
6. Additional hooks
7. Further componentization

## Success Criteria

- ✅ No file exceeds 500 lines
- ✅ All functionality still works
- ✅ Code is more maintainable
- ✅ Components are reusable
- ✅ Business logic separated from UI
- ✅ Tests pass (if any exist)
- ✅ No console errors
- ✅ TypeScript compiles without errors
