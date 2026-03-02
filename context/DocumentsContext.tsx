'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { SableDocument } from '@/lib/types';
import {
  createDocument,
  generateId,
  loadDocuments,
  randomCoverColor,
  saveDocuments,
} from '@/lib/documents';

interface DocumentsContextType {
  documents: SableDocument[];
  createDoc: () => SableDocument;
  getDoc: (id: string) => SableDocument | undefined;
  updateDoc: (id: string, partial: Partial<SableDocument>) => void;
  deleteDoc: (id: string) => void;
  duplicateDoc: (id: string) => SableDocument;
  renameDoc: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
  toggleArchive: (id: string) => void;
}

const DocumentsContext = createContext<DocumentsContextType | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<SableDocument[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setDocuments(loadDocuments());
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever documents change (after hydration)
  useEffect(() => {
    if (hydrated) {
      saveDocuments(documents);
    }
  }, [documents, hydrated]);

  const createDoc = useCallback((): SableDocument => {
    const doc = createDocument();
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }, []);

  const getDoc = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents]
  );

  const updateDoc = useCallback(
    (id: string, partial: Partial<SableDocument>) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, ...partial, updatedAt: new Date().toISOString() }
            : d
        )
      );
    },
    []
  );

  const deleteDoc = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, isDeleted: true, updatedAt: new Date().toISOString() }
          : d
      )
    );
  }, []);

  const duplicateDoc = useCallback(
    (id: string): SableDocument => {
      const original = documents.find((d) => d.id === id);
      if (!original) throw new Error('Document not found');
      const now = new Date().toISOString();
      const copy: SableDocument = {
        ...original,
        id: generateId(),
        title: `${original.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
        coverColor: randomCoverColor(),
        isFavorited: false,
      };
      setDocuments((prev) => [copy, ...prev]);
      return copy;
    },
    [documents]
  );

  const renameDoc = useCallback((id: string, title: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, title, updatedAt: new Date().toISOString() }
          : d
      )
    );
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              isFavorited: !d.isFavorited,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
  }, []);

  const toggleArchive = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              isArchived: !d.isArchived,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
  }, []);

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        createDoc,
        getDoc,
        updateDoc,
        deleteDoc,
        duplicateDoc,
        renameDoc,
        toggleFavorite,
        toggleArchive,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextType {
  const ctx = useContext(DocumentsContext);
  if (!ctx)
    throw new Error('useDocuments must be used within <DocumentsProvider>');
  return ctx;
}
