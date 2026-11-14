import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom pgvector type for Drizzle ORM
 * Represents an array of floating point numbers with fixed dimensions (e.g. 768 for text-embedding-004)
 */
export const vector = customType<{
  data: number[];
  config: { dimensions?: number };
}>({
  dataType(config) {
    return config?.dimensions ? `vector(${config.dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    if (Array.isArray(value)) return value as number[];
    if (typeof value === 'string') {
      return value
        .replace(/[\[\]]/g, '')
        .split(',')
        .filter(Boolean)
        .map((v) => parseFloat(v.trim()));
    }
    return [];
  },
});

/**
 * Custom PostgreSQL Full-Text Search tsvector type for Drizzle ORM
 */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: unknown): string {
    return typeof value === 'string' ? value : '';
  },
});
