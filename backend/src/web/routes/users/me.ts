import { Controller } from "../route-controller";

export const UsersMeController: Controller = (route) => {
  route.get("/users/me", async (req, response) => {
    const user = await req.dependencies.dataLayer.usersDb.getUserById(
      req.oid.sub
    );
    if (!user) {
      return response.status(200).send({
        id: req.oid.sub,
        name: req.oid.name,
        registered: false,
        claims: [...req.oid.claims.values()],
      });
    }

    return response.status(200).send({
      id: user.id,
      name: req.oid.name,
      registered: true,
      user,
      claims: [...req.oid.claims.values()],
    });
  });
};
