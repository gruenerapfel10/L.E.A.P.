import { HelperSheet } from '../types';

class HelperSheetRegistry {
  private helperSheets: Map<string, HelperSheet>;

  constructor() {
    this.helperSheets = new Map();
  }

  clear() {
    this.helperSheets.clear();
  }

  registerHelperSheet(helperSheet: HelperSheet) {
    this.helperSheets.set(helperSheet.id, helperSheet);
  }

  getHelperSheet(id: string): HelperSheet | undefined {
    return this.helperSheets.get(id);
  }

  getHelperSheetsForModule(moduleId: string): HelperSheet[] {
    return Array.from(this.helperSheets.values()).filter(sheet => 
      sheet.linkedModules?.includes(moduleId)
    );
  }

  getAllHelperSheets(): HelperSheet[] {
    return Array.from(this.helperSheets.values());
  }
}

// Export a singleton instance
export const helperSheetRegistry = new HelperSheetRegistry(); 