import { useState } from "react";
import { useBackend } from "../backend/use-backend-context";
import {
  Box,
  Button,
  Divider,
  Stack,
  TextareaAutosize,
  TextField,
} from "@mui/material";
import { Fields, createNewDocument, type Document } from "./document-templates";
import { useDocumentIndexes } from "./use-document-indexes";

interface Props {
  onValidate: (id: string) => void;
}
export const NewDocumentForm = ({ onValidate }: Props) => {
  const { endpoints } = useBackend();
  const { addOrUpdateDocument } = useDocumentIndexes();
  const [content, setContent] = useState<Document>(createNewDocument());

  return (
    <form
      onSubmit={(e) => {
        if (!endpoints) {
          return;
        }
        if (Fields.some((f) => f.required && !f.getter(content))) {
          return;
        }
        e.preventDefault();
        const contentStr = JSON.stringify(content);

        endpoints.createDocument(contentStr).then((id) => {
          addOrUpdateDocument(id, contentStr);
          onValidate(id);
        });
      }}
    >
      <Stack divider={<Divider orientation="horizontal" flexItem />}>
        {Fields.filter((c) => !!c.setter).map((f) => {
          const value = f.getter(content);
          const helperText =
            f.required && !f.getter(content) ? "Required" : undefined;
          const error = f.required && !f.getter(content);

          const onChange: React.ChangeEventHandler<
            HTMLInputElement | HTMLTextAreaElement
          > = (e) => {
            setContent((old) => {
              if (!f.setter) {
                return old;
              }
              f.setter(old, e.target.value);
              return { ...old };
            });
          };
          return (
            <Box key={f.title}>
              <Stack>
                <p>{f.title}</p>
                {f.multiLine ? (
                  <TextareaAutosize value={value} onChange={onChange} />
                ) : (
                  <TextField
                    fullWidth
                    value={value}
                    helperText={helperText}
                    error={error}
                    onChange={onChange}
                  />
                )}
              </Stack>
            </Box>
          );
        })}
        <Button type="submit">Send!</Button>
      </Stack>
    </form>
  );
};
