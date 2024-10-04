import { Controller } from "../route-controller";
import { checkIsAdmin } from "../../authentication/check-is-admin";

export const AdminResetController: Controller = (route) => {
  route.post("/admin/reset", checkIsAdmin(), async (req, response) => {
    const { documentsDb, usersDb } = req.dependencies.dataLayer;

    await documentsDb.clearAllDocuments();
    await usersDb.clearAllUsers();
  });
};
