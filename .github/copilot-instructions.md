# Invoice Hours Generator - AI Coding Instructions

## Project Overview
Single-page Angular 14 app for freelance invoicing that converts Trello timer CSV exports (format: "2h 40m") into decimal hours and calculates costs with GST, tax withholdings, and custom items.

## Architecture & Data Flow
- **Single Component App**: All logic in `src/app/app.component.ts` - no services or routing
- **CSV Processing Pipeline**: Upload → Papa.parse → `processRow()` → `aggregateDecimalHoursPerCard()` → display
- **Two Data Types**: 
  - `jobData`: Hourly items from CSV aggregated by card name (row[6])
  - `customItems`: Manual hourly additions
  - `fixedPriceItems`: Manual fixed-price items (amounts excluding GST)

## Critical CSV Format Assumptions
- **Time Column**: Index 1 contains Trello format ("2h 40m", "45m", "1h")
- **Card Name Column**: Index 6 contains the job/card identifier for aggregation
- **Decimal Hours**: Always appended as last column after processing

## Key Business Logic Patterns

### Time Conversion (Core Function)
```typescript
// Always converts "Xh Ym" format to decimal with .toFixed(3)
private convertTimeToDecimal(time: string) // Returns "2.667" for "2h 40m"
```

### Rate Calculations (Australian GST)
- Base rate includes 10% GST (`rate = 77`)
- Excluding GST: `Math.round(rate / 1.1)` = 70
- Tax withholding: 35% of pre-GST amount for self-employed tax planning
- **Fixed Price Items**: Stored as excluding GST, GST applied in display (amount * 1.1)

### Data Aggregation Pattern
```typescript
// Always aggregate by cardName (row[6]), sum decimal hours
const aggregatedData: Record<string, number> = {};
// Key insight: Uses cardName as primary grouping mechanism
```

## UI/UX Conventions
- **Copy-to-Clipboard**: Every data cell has copy button with visual feedback (green row highlighting)
- **Drag & Drop**: CSV upload area with visual state changes (`dragOver` class)
- **Form Validation**: Radio button switching between hourly/fixed-price item types
- **Table Structure**: Summary table shows aggregated data, Breakdown table shows raw CSV

## Development Workflows
```bash
npm start          # Development server (ng serve)
npm run build      # Production build
npm test           # Karma unit tests
```

## AI Development Constraints
- **No Terminal Commands**: AI models should NOT execute terminal commands. Only suggest commands for manual execution by the developer.

## Styling Architecture
- Component-scoped SCSS in `app.component.scss`
- Row state classes: `.clicked-row`, `.custom-item-row`, `.fixed-price-row`, `.total-row`
- Form styling: `.custom-item-form` with radio button toggles

## External Dependencies
- **papaparse**: CSV parsing - always use `header: true` option
- **FormsModule**: Required for `[(ngModel)]` - already imported in `app.module.ts`

## Testing Considerations
- CSV parsing assumes specific column structure (time at index 1, card name at index 6)
- Rate calculations are hardcoded for Australian tax system (GST + withholding)
- Manual testing workflow: Upload CSV → verify decimal conversion → test custom items

## Common Patterns to Follow
1. **Decimal Precision**: Always use `.toFixed(3)` for hours, `.toFixed(2)` for currency
2. **State Updates**: Call `updateTotals()` after any data modification
3. **Form Resets**: Clear input fields after successful additions
4. **Error Handling**: Alert for invalid CSV files, clipboard API error logging
