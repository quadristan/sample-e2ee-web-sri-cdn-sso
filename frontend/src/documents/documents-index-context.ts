import React from "react";
export interface IndexState {
  idsByTitle: Map<string, Set<string>>;
  docTitles: Map<string, string>;
}
export interface IndexContext {
  readonly state: IndexState;
  findByTitle(value: string): string[];

  addOrUpdateDocument(id: string, document: unknown): void;
  indexNewDocuments(): Promise<void>;
  removeDocument(id: string): void;
}

export const DocumentsIndexContext = React.createContext<IndexContext>({
  state: { idsByTitle: new Map(), docTitles: new Map() },
  findByTitle: () => [],
  addOrUpdateDocument: () => Promise.resolve(),
  indexNewDocuments: () => Promise.resolve(),
  removeDocument: () => {},
});
