import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export interface RLSContext {
  userId: string;
  userRole: string;
}

export const rlsStorage = new AsyncLocalStorage<RLSContext>();

const basePrisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Cada query autenticada se envuelve en una transacción que:
// 1. Cambia el rol a orka_app (no-superusuario → RLS se activa)
// 2. Inyecta app.user_id y app.user_role como settings de sesión locales
// 3. Ejecuta la query original
// Si no hay contexto (ej: login), la query corre como postgres y omite RLS.
const extended = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const ctx = rlsStorage.getStore();

        if (!ctx) {
          return query(args);
        }

        const [, , , result] = await basePrisma.$transaction([
          basePrisma.$executeRaw`SET LOCAL ROLE orka_app`,
          basePrisma.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`,
          basePrisma.$executeRaw`SELECT set_config('app.user_role', ${ctx.userRole}, true)`,
          query(args) as any,
        ]);

        return result;
      },
    },
  },
});

// Cast necesario porque $extends devuelve DynamicClientExtensionThis,
// que no extiende PrismaClient en el sistema de tipos aunque es
// compatible en runtime con todos los métodos de modelo.
export default extended as unknown as PrismaClient;
