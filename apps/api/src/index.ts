import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import { prisma } from "@lucasai/db";
import { z } from "zod";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: ["http://localhost:5173"], // Vite dev
    credentials: true
  });
  await app.register(cookie, { secret: process.env.COOKIE_SECRET });

  const CreateUniversity = z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    state: z.string().min(1)
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/universities", async (req, reply) => {
    const universities = await prisma.university.findMany();
    return universities;
  });

  app.post("/api/universities", async (req, reply) => {
    const body = CreateUniversity.parse(req.body);
    const university = await prisma.university.create({
      data: {
        name: body.name,
        location: body.location,
        state: body.state
      }
    });
    reply.code(201);
    return university;
  });

  await app.listen({ port: Number(process.env.PORT) || 3001, host: "0.0.0.0" });
}

main().catch(err => {
//   app.log.error(err);
  process.exit(1);
});
