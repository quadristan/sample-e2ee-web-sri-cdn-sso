import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { DocumentsIndexContext, IndexState } from "./documents-index-context";
import { useBackend } from "../backend/use-backend-context";

interface Props {
  index: (id: string, document: string) => string;
}

const EmptyState: IndexState = {
  idsByTitle: new Map(),
  docTitles: new Map(),
};

export const DocumentsIndexContexProdider = ({
  index,
  children,
}: PropsWithChildren<Props>) => {
  const { endpoints } = useBackend();
  const [state, setState] = useState<IndexState>(EmptyState);

  const addOrUpdateDocuments = useCallback(
    (docs: [id: string, d: string][]) => {
      setState((oldState) => {
        for (const [id, d] of docs) {
          const title = index(id, d);
          const reverse = oldState.docTitles.get(id) ?? "";
          const inOldState = oldState.idsByTitle.get(reverse) ?? new Set();
          inOldState.delete(id);

          const list = oldState.idsByTitle.get(title) ?? new Set();
          list.add(id);
          oldState.idsByTitle.set(title, list);
          oldState.docTitles.set(id, title);
        }

        return { ...oldState };
      });
    },
    [index]
  );

  const docTitles = state.docTitles;
  const indexNewDocuments = useCallback(async () => {
    if (!endpoints) {
      throw new Error("not ready");
    }
    const allDocs = await endpoints.getAllDocumentsIds();
    const indexed = new Set([...docTitles.keys()]);
    const toIndex = allDocs.filter((d) => !indexed.has(d));
    const toUpdate = new Array<[string, string]>();
    for (const id of toIndex) {
      const doc = await endpoints.getDocument(id);
      if (doc.ok) {
        toUpdate.push([id, doc.data.content]);
      }
    }
    addOrUpdateDocuments(toUpdate);
  }, [endpoints, addOrUpdateDocuments, docTitles]);

  useEffect(() => {
    async function load() {
      indexNewDocuments();
    }
    load();
  }, [indexNewDocuments]);

  const addOrUpdateDocument = useCallback(
    (id: string, d: string) => {
      addOrUpdateDocuments([[id, d]]);
    },
    [addOrUpdateDocuments]
  );

  const removeDocument = useCallback(
    async (id: string) => {
      setState((oldState) => {
        const title = state.docTitles.get(id) ?? "";
        const newIds = oldState.idsByTitle.get(title) ?? new Set();
        newIds.delete(id);
        oldState.docTitles.delete(id);
        if (newIds.size > 0) {
          oldState.idsByTitle.set(title, new Set([...newIds.values()]));
        } else {
          oldState.idsByTitle.delete(title);
        }
        return {
          idsByTitle: new Map(oldState.idsByTitle),
          docTitles: new Map(oldState.docTitles),
        };
      });
    },
    [state]
  );

  return (
    <DocumentsIndexContext.Provider
      value={{
        addOrUpdateDocument,
        findByTitle: (title) => {
          const inIndex = state.idsByTitle.get(title);
          if (!inIndex) return [];
          return [...inIndex.values()];
        },
        state,
        indexNewDocuments,
        removeDocument,
      }}
    >
      {children}
    </DocumentsIndexContext.Provider>
  );
};
