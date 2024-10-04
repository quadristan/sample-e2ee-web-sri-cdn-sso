export interface Document {
  title: string;
  content: string;
}

export function createNewDocument(): Document {
  return {
    title: "",
    content: "",
  };
}
export interface DocumentField {
  getter: (doc: Document) => string | undefined;
  setter?: (doc: Document, value: string) => void;
  required?: boolean;
  title: string;
  multiLine?: boolean;
}

export const Fields: DocumentField[] = [
  {
    title: "title",
    required: true,
    getter: (doc) => doc.title,
    setter: (doc, value) => {
      doc.title = value;
    },
  },
  {
    title: "content",
    required: true,
    getter: (doc) => doc.content,
    setter: (doc, value) => {
      doc.content = value;
    },
    multiLine: true,
  },
];

export const documentIndex = (id: string, docStr: string) => {
  try {
    const doc = JSON.parse(docStr);
    if (!doc) {
      return id;
    }
    if (typeof doc !== "object") {
      return doc;
    }

    if ("title" in doc) {
      return doc.title;
    }
  } catch (error) {}

  return id;
};
