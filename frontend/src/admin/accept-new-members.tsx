import { Button, Card, CardActions, CardContent, Stack } from "@mui/material";
interface Props {
  unvalidated: Record<string, string>; // id=>name
  reject: (id: string) => void;
  accept: (id: string) => void;
}

export const AcceptNewMembers = ({ unvalidated, accept, reject }: Props) => {
  return (
    <div>
      <h1>As admin, your role is to accept or delete new members</h1>
      <Stack>
        {Object.entries(unvalidated).map(([k, v]) => (
          <Card key={k}>
            <CardContent>Name: {v}</CardContent>
            <CardActions>
              <Button type="button" onClick={() => accept(k)}>
                Accept
              </Button>
              <Button type="button" onClick={() => reject(k)}>
                Reject
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </div>
  );
};
