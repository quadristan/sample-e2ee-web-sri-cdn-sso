import { useEffect, useState } from "react";
import { useBackend } from "../backend/use-backend-context";
import {
  Box,
  Divider,
  Stack,
  TextareaAutosize,
  TextField,
} from "@mui/material";
import { Fields } from "./document-templates";

export const DocumentViewer = (props: { id: string }) => {
  const { endpoints } = useBackend();
  const [content, setContent] = useState<string | undefined>();

  useEffect(() => {
    if (!endpoints) {
      return;
    }
    endpoints.getDocument(props.id).then((result) => {
      if (result.ok) {
        setContent(result.data.content);
      }
    });
  }, [props.id, endpoints]);

  if (!content) {
    return <p>Loading ${props.id}</p>;
  }
  const json = JSON.parse(content);
  return (
    <Stack divider={<Divider orientation="horizontal" flexItem />}>
      {Fields.map((f) => (
        <Box key={f.title}>
          <Stack>
            <p>{f.title}</p>{" "}
            {f.multiLine ? (
              <TextareaAutosize disabled value={f.getter(json)} />
            ) : (
              <TextField fullWidth disabled value={f.getter(json)} />
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};
