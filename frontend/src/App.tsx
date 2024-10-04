import { LoginWrapper } from "./login-screens/login-wrapper";
import { DocumentsList } from "./documents/documents-list";
import { DocumentsIndexContexProdider } from "./documents/documents-index.provider";
import { documentIndex } from "./documents/document-templates";
import { AdminTaskWrapper } from "./admin/admin-task-wrapper";

export const App = () => {
  return (
    <LoginWrapper>
      <AdminTaskWrapper>
        <DocumentsIndexContexProdider index={documentIndex}>
          <DocumentsList />
        </DocumentsIndexContexProdider>
      </AdminTaskWrapper>
    </LoginWrapper>
  );
};
