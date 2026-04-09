import cron, { ScheduledTask } from 'node-cron';
import { notificationService } from './notificationService';
import { settingsRepository } from '../repositories/settingsRepository';

class SchedulerService {
  private isRunning = false;
  private lastRun: Date | null = null;
  private cronExpression = '0 8 * * *'; // Default: 8:00 AM daily
  private scheduledTask: ScheduledTask | null = null;
  private isInitialized = false;

  async start(): Promise<void> {
    console.log('[Scheduler] Iniciando servicio de programador...');
    
    // Get scheduled time from settings
    await this.updateScheduleFromSettings();

    // Schedule daily
    this.scheduleTask();

    this.isInitialized = true;
    console.log(`[Scheduler] Programado para ejecutarse diariamente a las ${this.cronExpression.split(' ')[1]}:${this.cronExpression.split(' ')[0]} hours`);
  }

  private scheduleTask(): void {
    // Stop existing task if any
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }

    // Create new scheduled task
    this.scheduledTask = cron.schedule(this.cronExpression, async () => {
      await this.runDailyNotifications();
    });
  }

  async updateScheduleFromSettings(): Promise<void> {
    try {
      const setting = await settingsRepository.findByKey('NOTIFICATION_SCHEDULE_TIME');
      if (setting && setting.value) {
        // Format: "HH:MM" (e.g., "08:00")
        const [hour, minute] = setting.value.split(':');
        const newCron = `${minute} ${hour} * * *`;
        
        if (newCron !== this.cronExpression) {
          this.cronExpression = newCron;
          if (this.isInitialized) {
            this.scheduleTask();
            console.log(`[Scheduler] Programación actualizada dinámicamente: ${setting.value}`);
          }
        }
      }
    } catch (error) {
      console.log('[Scheduler] Usando horario por defecto: 8:00 AM');
    }
  }

  // Método público para actualizar schedule en tiempo real
  async refreshSchedule(): Promise<void> {
    await this.updateScheduleFromSettings();
  }

  private async runDailyNotifications(): Promise<void> {
    if (this.isRunning) {
      console.log('[Scheduler] Ejecución anterior aún en progreso, saltando...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('[Scheduler] Ejecutando notificaciones de vencimiento...');
      this.lastRun = new Date();

      const result = await notificationService.sendExpiryReminders();
      
      console.log(`[Scheduler] Resultado: ${result.contractsFound} contratos, ${result.workOrdersFound} órdenes, ${result.emailsSent} emails enviados`);
      
      if (result.errors.length > 0) {
        console.error('[Scheduler] Errores:', result.errors);
      }

    } catch (error) {
      console.error('[Scheduler] Error al ejecutar notificaciones:', error);
    } finally {
      this.isRunning = false;
    }
  }

  getStatus(): { isRunning: boolean; lastRun: Date | null; schedule: string } {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      schedule: this.cronExpression
    };
  }

  // Manual trigger for testing or admin use
  async triggerNow(): Promise<any> {
    console.log('[Scheduler] Ejecución manual iniciada...');
    const result = await notificationService.sendExpiryReminders();
    return result;
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;