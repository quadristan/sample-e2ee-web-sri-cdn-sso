import { Controller } from "../route-controller";

export const UsersGetAllController: Controller = (route) => {
  route.get("/users", async (req, response) => {
    const allIds = await req.dependencies.dataLayer.usersDb.getAllIdentifiers();

    return response.status(200).send(allIds);
  });
};

export const UsersGetAllUnvalidatedController: Controller = (route) => {
  route.get("/users/unvalidated", async (req, response) => {
    const allIds = await req.dependencies.dataLayer.usersDb.getAllUnvalidated();

    return response.status(200).send(allIds);
  });
};

export const UsersGetController: Controller = (route) => {
  route.get("/users/:id", async (req, response) => {
    const { id } = req.params;
    const user = await req.dependencies.dataLayer.usersDb.getUserById(id);
    if (!user) {
      response.status(404).send("User not found");
      return;
    }
    const isMyself = id === req.oid.sub;
    const {
      encryptionRegistrationRecord: _, // we never send that one
      validerPublicExchangeKey,
      userPrivateKeys,
      documentsPrivateKeys,
      ...rest
    } = user;

    if (isMyself) {
      return response.status(200).send({
        ...rest,
        validerPublicExchangeKey,
        userPrivateKeys,
        documentsPrivateKeys,
      });
    }
    return response.status(200).send(rest);
  });
};
