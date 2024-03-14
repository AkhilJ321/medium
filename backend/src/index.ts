import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

app.use("/api/v1/blog/*", async (c, next) => {
  const token = c.req.header("authorization") || "";

  const res = await verify(token, "secret");
  if (res.id) {
    next();
  } else {
    c.status(403);
    return c.json({ error: "unauthorized" });
  }
});

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
      },
    });
    const jwt = await sign({ id: user.id }, "secret");
    return c.json({ jwt });
  } catch (e) {
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
});

app.post("/api/v1/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = c.req.json();
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password,
    },
  });
  if (!user) {
    c.status(403);
    return c.json({ error: "user not found" });
  }

  const jwt = await sign({ id: user.id }, "secret");
  return c.json({ jwt });
});

app.post("api/v1/blog", (c) => {
  return c.text("blog route");
});

app.put("api/v1/blog", (c) => {
  return c.text("blog route");
});

app.get("api/v1/blog/:id", (c) => {
  const id = c.req.params("id");
  console.log(id);
  return c.text(" get blog route");
});
app.get("api/v1/blog/bulk", (c) => {
  return c.text("blog route");
});

export default app;
