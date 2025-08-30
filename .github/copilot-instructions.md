# Invoice Hours Generator - AI Coding Instructions

## Project Overview
Single-page Angular 14 app for freelance invoicing that converts Trello timer CSV exports (format: "2h 40m") into decimal hours and calculates costs with GST, tax withholdings, and custom items.

## Architecture & Data Flow
- **Service-Based Architecture**: Business logic separated into dedicated services
  - `CsvService`: Handles CSV parsing, time conversion, and data aggregation
  - `CalculationService`: Manages all financial calculations (GST, tax, totals)
  - `ConfigService`: Stores application configuration (rates, tax percentages)
- **Single Component App**: UI logic in `src/app/app.component.ts` with services injected
- **CSV Processing Pipeline**: Upload → CsvService.parseFile() → aggregation → CalculationService.calculateTotals() → display
- **Three Data Types**: 
  - `jobData`: Hourly items from CSV aggregated by card name (row[6])
  - `customItems`: Manual hourly additions
  - `fixedPriceItems`: Manual fixed-price items (amounts excluding GST)

## Critical CSV Format Assumptions
- **Time Column**: Index 1 contains Trello format ("2h 40m", "45m", "1h")
- **Card Name Column**: Index 6 contains the job/card identifier for aggregation
- **Decimal Hours**: Always appended as last column after processing

## Key Business Logic Patterns

### Service Dependencies
```typescript
// AppComponent constructor injection
constructor(
  private csvService: CsvService,
  private calculationService: CalculationService,
  public configService: ConfigService
) {}
```

### Time Conversion (CsvService)
```typescript
// Always converts "Xh Ym" format to decimal with .toFixed(3)
csvService.convertTimeToDecimal(time: string) // Returns "2.667" for "2h 40m"
```

### Rate Calculations (CalculationService + ConfigService)
- Base rate includes 10% GST (`configService.rate = 77`)
- Excluding GST: `Math.round(rate / 1.1)` = 70
- Tax withholding: 35% of pre-GST amount for self-employed tax planning
- **Fixed Price Items**: Stored as excluding GST, GST applied in display (amount * 1.1)

### Data Aggregation Pattern (CsvService)
```typescript
// Always aggregate by cardName (row[6]), sum decimal hours
const aggregatedData: Record<string, number> = {};
// Key insight: Uses cardName as primary grouping mechanism
```

### Totals Calculation (CalculationService)
```typescript
// Single method handles all totals with proper GST logic
calculateTotals(jobData, customItems, fixedPriceItems): TotalSummary
```

## UI/UX Conventions
- **Copy-to-Clipboard**: Every data cell has copy button with visual feedback (green row highlighting)
- **Drag & Drop**: CSV upload area with visual state changes (`dragOver` class)
- **Form Validation**: Radio button switching between hourly/fixed-price item types
- **Table Structure**: Summary table shows aggregated data, Breakdown table shows raw CSV
- **Service Integration**: Component uses computed properties that delegate to services

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
- **papaparse**: CSV parsing - used via CsvService.parseFile() with Observable pattern
- **FormsModule**: Required for `[(ngModel)]` - already imported in `app.module.ts`
- **RxJS**: Used for Observable-based CSV processing

## Testing Considerations
- CSV parsing assumes specific column structure (time at index 1, card name at index 6)
- Rate calculations are centralized in CalculationService for easy testing
- Services are injectable with `providedIn: 'root'` for easy mocking
- Manual testing workflow: Upload CSV → verify decimal conversion → test custom items

## Common Patterns to Follow
1. **Service Delegation**: UI components should delegate business logic to services
2. **Observable Pattern**: Use CsvService.parseFile() returns Observable for async operations
3. **Decimal Precision**: Always use `.toFixed(3)` for hours, `.toFixed(2)` for currency
4. **State Updates**: Call `updateTotals()` after any data modification (delegates to CalculationService)
5. **Form Resets**: Clear input fields after successful additions
6. **Error Handling**: Services return Observables with proper error handling
7. **Configuration Access**: Use `configService.property` for rate and tax settings
