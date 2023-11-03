import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  generateDepartmentName,
  generateProgrammingLanguage,
} from "@/lib/utils";
import type { Node, PrismaClient } from "@prisma/client";
import type * as runtime from "@prisma/client/runtime/library";

// TODO: Refactor to use a single recursive query
/**
 * Updates the height of all children nodes of a given node in the database.
 * @param input - An object containing the Prisma client instance and the parent node.
 */
const updateHeightRecursive = async (input: {
  db: Omit<PrismaClient, runtime.ITXClientDenyList> | PrismaClient;
  node: Node;
  newHeight: number;
}) => {
  const node = await input.db.node.findFirstOrThrow({
    where: { id: input.node.id },
    include: { children: true },
  });

  await input.db.node.update({
    where: { id: node.id },
    data: { height: input.newHeight },
  });

  if (node.children.length === 0) return;

  for (const child of node.children) {
    await updateHeightRecursive({
      db: input.db,
      node: child,
      newHeight: input.newHeight + 1,
    });
  }

  return;
};

// TODO: Refactor to use a single recursive query
/**
 * Recursively deletes all children of a given node from the database.
 * @param input - An object containing the database client and the node to delete children for.
 * @returns A Promise that resolves when all children have been deleted.
 */
const deleteRecursive = async (input: {
  db: Omit<PrismaClient, runtime.ITXClientDenyList> | PrismaClient;
  node: Node;
}) => {
  const node = await input.db.node.findFirstOrThrow({
    where: { id: input.node.id },
    include: { children: true },
  });

  await input.db.node.delete({ where: { id: node.id } });

  if (node.children.length === 0) return;

  for (const child of node.children) {
    await deleteRecursive({ db: input.db, node: child });
  }

  return;
};

export const nodeRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({ name: z.string().min(1), parentId: z.string().nullish() }),
    )
    .mutation(async ({ ctx, input }) => {
      const parentId = input.parentId;
      if (parentId) {
        // Non-root node
        const parent = await ctx.db.node.findUniqueOrThrow({
          where: { id: parentId },
        });

        const dbRes = await ctx.db.$transaction(async (db) => {
          // Promote parent node
          await db.node.update({
            where: { id: parent.id },
            data: {
              preferredProgrammingLanguage: null,
              managingDepartment:
                parent.managingDepartment ?? generateDepartmentName(),
            },
          });

          return db.node.create({
            data: {
              name: input.name,
              height: parent.height + 1,
              preferredProgrammingLanguage: generateProgrammingLanguage(),
              parent: {
                connect: {
                  id: parentId,
                },
              },
            },
          });
        });

        return dbRes;
      } else {
        // root node
        return ctx.db.node.create({
          data: {
            name: input.name,
            height: 0,
            managingDepartment: generateDepartmentName(),
            preferredProgrammingLanguage: generateProgrammingLanguage(),
          },
        });
      }
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().nullish() }))
    .query<Node[]>(async ({ ctx, input }) => {
      if (input.id) {
        const dbRes = await ctx.db.node.findUniqueOrThrow({
          where: { id: input.id },
          include: { children: true },
        });

        return [dbRes, ...dbRes.children];
      }

      const dbRes = await ctx.db.node.findMany({
        include: { children: true },
      });

      return dbRes;
    }),

  move: publicProcedure
    .input(z.object({ id: z.string(), newParentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbRes = await ctx.db.$transaction(async (db) => {
        const node = await db.node.findUniqueOrThrow({
          where: { id: input.id },
          include: { parent: { include: { children: true } } },
        });

        const newParent = await db.node.findUniqueOrThrow({
          where: { id: input.newParentId },
        });

        const oldParent = node.parent;

        if (oldParent) {
          // If the old parent node has no other children, set its preferredProgrammingLanguage, and eventually demote
          if (oldParent.children.length === 1) {
            await db.node.update({
              where: { id: oldParent.id },
              data: {
                managingDepartment: oldParent.parentId
                  ? null
                  : oldParent.managingDepartment,
                preferredProgrammingLanguage:
                  oldParent.preferredProgrammingLanguage ??
                  generateProgrammingLanguage(),
              },
            });
          }
        }
        const updatedNode = await db.node.update({
          where: { id: input.id },
          include: { children: true },
          data: {
            parent: {
              connect: {
                id: input.newParentId,
              },
            },
            height: newParent.height + 1,
            managingDepartment: null,
          },
        });

        for (const child of updatedNode.children) {
          await updateHeightRecursive({
            db,
            node: child,
            newHeight: updatedNode.height + 1,
          });
        }

        return updatedNode;
      });

      return dbRes;
    }),

  detach: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const node = await ctx.db.node.findUniqueOrThrow({
        where: { id: input.id },
        include: { children: true, parent: { include: { children: true } } },
      });

      const parent = node.parent;

      if (!parent) {
        throw new Error("Cannot detach root node");
      }

      const dbRes = await ctx.db.$transaction(async (db) => {
        if (node.children.length === 0) {
          return db.node.update({
            where: { id: input.id },
            include: { children: true },
            data: {
              parent: {
                disconnect: true,
              },
              height: 0,
              managingDepartment:
                node.managingDepartment ?? generateDepartmentName(),
              preferredProgrammingLanguage:
                node.preferredProgrammingLanguage ??
                generateProgrammingLanguage(),
            },
          });
        }

        // If the parent node has no other children, set its preferredProgrammingLanguage
        if (parent.children.length === 1) {
          await db.node.update({
            where: { id: parent.id },
            data: {
              managingDepartment: parent.parentId
                ? null
                : parent.managingDepartment,
              preferredProgrammingLanguage:
                parent.preferredProgrammingLanguage ??
                generateProgrammingLanguage(),
            },
          });
        }

        const updatedNode = await db.node.update({
          where: { id: input.id },
          include: { children: true },
          data: {
            parent: {
              disconnect: true,
            },
            height: 0,
            managingDepartment:
              node.managingDepartment ?? generateDepartmentName(),
          },
        });

        for (const child of updatedNode.children) {
          await updateHeightRecursive({ db, node: child, newHeight: 1 });
        }

        return updatedNode;
      });

      return dbRes;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const node = await ctx.db.node.findUniqueOrThrow({
        where: { id: input.id },
        include: { parent: { include: { children: true } } },
      });

      const parent = node.parent;

      const dbRes = await ctx.db.$transaction(async (db) => {
        // If the parent node has no other children demote
        if (parent && parent.children.length === 1) {
          await db.node.update({
            where: { id: parent.id },
            data: {
              managingDepartment: parent.parentId
                ? null
                : parent.managingDepartment,

              preferredProgrammingLanguage:
                parent.preferredProgrammingLanguage ??
                generateProgrammingLanguage(),
            },
          });
        }

        const deletedNode = await db.node.delete({
          where: { id: input.id },
          include: { children: true },
        });

        for (const child of deletedNode.children) {
          await deleteRecursive({ db, node: child });
        }

        return deletedNode;
      });

      return dbRes;
    }),
});
