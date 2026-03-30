/**
 * Script para enviar notificaciones diarias de vencimiento
 * 
 * Uso:
 *   npx ts-node scripts/send-daily-notifications.ts
 * 
 * Programación diaria (Linux/Mac):
 *   crontab -e
 *   0 8 * * * cd /path/to/backend && npx ts-node scripts/send-daily-notifications.ts >> /var/log/notifications.log 2>&1
 * 
 * Programación diaria (Windows Task Scheduler):
 *   Crear tarea programada que ejecute: npx ts-node scripts/send-daily-notifications.ts
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from '../src/infrastructure/services/notificationService';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(50));
  console.log('🔔 Iniciando envío de notificaciones diarias');
  console.log('📅 Fecha:', new Date().toLocaleString('es-CL'));
  console.log('='.repeat(50));

  try {
    const result = await notificationService.sendExpiryReminders();
    
    console.log('\n📊 Resultado:');
    console.log(`   - Contratos encontrados: ${result.contractsFound}`);
    console.log(`   - Órdenes de trabajo encontradas: ${result.workOrdersFound}`);
    console.log(`   - Emails enviados: ${result.emailsSent}`);
    console.log(`   - Éxito: ${result.success ? '✅ Sí' : '❌ No'}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errores:');
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (result.contractsFound === 0 && result.workOrdersFound === 0) {
      console.log('\n✅ No hay items próximos a vencer. No se enviaron notificaciones.');
    } else {
      console.log(`\n✅ Notificaciones enviadas exitosamente a ${result.emailsSent} destinatario(s).`);
    }

  } catch (error) {
    console.error('\n❌ Error al ejecutar script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();