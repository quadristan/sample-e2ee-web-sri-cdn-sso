import { Controller } from "../route-controller";
import { checkIsAdmin } from "../../authentication/check-is-admin";

export const UsersDeleteController: Controller = (route) => {
  route.delete("/users/:id", checkIsAdmin(), async (req, response) => {
    const { usersDb } = req.dependencies.dataLayer;
    const { id } = req.params;

    await usersDb.deleteUser(id);
    return response.status(202).send();
  });
};
