import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingDTO {
  key: string;
  value: string;
  category?: string;
  isSecret?: boolean;
}

class SettingsRepository {
  async findByKey(key: string): Promise<Setting | null> {
    const result = await prisma.$queryRaw<Setting[]>`SELECT * FROM "Setting" WHERE key = ${key}`;
    return result[0] || null;
  }

  async findByCategory(category: string): Promise<Setting[]> {
    return prisma.$queryRaw<Setting[]>`SELECT * FROM "Setting" WHERE category = ${category}`;
  }

  async findAll(): Promise<Setting[]> {
    return prisma.$queryRaw<Setting[]>`SELECT * FROM "Setting"`;
  }

  async upsert(data: SettingDTO): Promise<Setting> {
    const existing = await this.findByKey(data.key);
    if (existing) {
      await prisma.$executeRaw`UPDATE "Setting" SET value = ${data.value}, "updatedAt" = NOW() WHERE key = ${data.key}`;
    } else {
      await prisma.$executeRaw`INSERT INTO "Setting" (id, key, value, category, "isSecret", "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), ${data.key}, ${data.value}, ${data.category || 'general'}, ${data.isSecret || false}, NOW(), NOW())`;
    }
    return (await this.findByKey(data.key))!;
  }

  async delete(key: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM "Setting" WHERE key = ${key}`;
  }

  async deleteByCategory(category: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM "Setting" WHERE category = ${category}`;
  }

  async getSMTPConfig(): Promise<{
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
    from?: string;
  } | null> {
    const settings = await this.findByCategory('smtp');
    if (settings.length === 0) return null;

    const config: any = {};
    for (const s of settings) {
      if (s.key === 'smtp_host') config.host = s.value;
      else if (s.key === 'smtp_port') config.port = parseInt(s.value);
      else if (s.key === 'smtp_secure') config.secure = s.value === 'true';
      else if (s.key === 'smtp_user') config.auth = { ...config.auth, user: s.value };
      else if (s.key === 'smtp_pass') config.auth = { ...config.auth, pass: s.value };
      else if (s.key === 'smtp_from') config.from = s.value;
    }

    if (!config.host || !config.auth?.user || !config.auth?.pass) return null;
    
    console.log('[EmailService] SMTP Config loaded:', { 
      host: config.host, 
      port: config.port, 
      secure: config.secure,
      user: config.auth.user,
      passLength: config.auth.pass?.length
    });
    
    return config;
  }
}

export const settingsRepository = new SettingsRepository();
export default settingsRepository;