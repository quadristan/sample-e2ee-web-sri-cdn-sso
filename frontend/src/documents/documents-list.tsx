import { Fragment, useRef, useState } from "react";
import { useBackend } from "../backend/use-backend-context";
import { Box, Button, Divider, IconButton, Stack } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useDocumentIndexes } from "./use-document-indexes";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useImporter } from "./importer/use-importer";
import { DocumentViewer } from "./document-viewer";
import { NewDocumentForm } from "./new-document-form";

export const DocumentsList = () => {
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const { endpoints } = useBackend();
  const { state, removeDocument } = useDocumentIndexes();
  const inputFile = useRef<HTMLInputElement>(null);
  const { dialog: importDialog, onProcessFile } = useImporter();
  if (!endpoints) {
    return <div>Loading doc list</div>;
  }

  return (
    <Stack spacing={"16px"} direction={"row"}>
      <Stack>
        <Stack direction={"row"} gap={"16px"}>
          <Button
            size="small"
            type={"button"}
            variant="contained"
            endIcon={<AddIcon />}
            sx={{
              height: "50px",
              borderColor: "black",
              border: "2px",
              marginBottom: "8px",
            }}
            onClick={() => {
              setShowNewDocForm(true);
            }}
          >
            Create
          </Button>
          {importDialog}
          <input
            type="file"
            id="file"
            ref={inputFile}
            style={{ display: "none" }}
            onChange={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const file = e?.target?.files?.[0];
              if (!file) {
                return;
              }
              onProcessFile(file);
            }}
          />
        </Stack>

        <Box sx={{ height: "calc(100vh - 150px)", overflow: "auto" }}>
          <Stack
            spacing={"2px"}
            sx={{ padding: "8px" }}
            divider={<Divider orientation="horizontal" flexItem />}
          >
            {[...state.idsByTitle.entries()].sort().map(([title, docId]) => (
              <Fragment key={title}>
                {[...docId.values()].sort().map((id) => (
                  <Stack direction={"row"} key={id}>
                    <Button
                      fullWidth
                      sx={[
                        {
                          width: "100%",
                        },
                        id === selectedDocId && {
                          backgroundColor: "dodgerblue",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "dodgerblue",
                            color: "white",
                          },
                        },
                      ]}
                      type="button"
                      onClick={() => {
                        setShowNewDocForm(false);
                        setSelectedDocId(id);
                      }}
                    >
                      {title}
                    </Button>
                    <IconButton
                      aria-label="delete"
                      type="button"
                      onClick={async () => {
                        await endpoints.deleteDocument(id);
                        removeDocument(id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                ))}
              </Fragment>
            ))}
          </Stack>
        </Box>
      </Stack>

      {showNewDocForm ? (
        <NewDocumentForm
          onValidate={(id) => {
            setShowNewDocForm(false);
            setSelectedDocId(id);
          }}
        />
      ) : selectedDocId ? (
        <DocumentViewer id={selectedDocId} />
      ) : (
        <p>Select a document!</p>
      )}
    </Stack>
  );
};
