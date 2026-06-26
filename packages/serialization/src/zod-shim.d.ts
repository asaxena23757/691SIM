declare module 'zod' {
  export type ZodIssue = {
    path: (string | number)[];
    message: string;
  };

  export type SafeParseSuccess<T> = {
    success: true;
    data: T;
  };

  export type SafeParseError = {
    success: false;
    error: {
      issues: ZodIssue[];
    };
  };

  export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError;

  export interface ZodType<T> {
    readonly _output: T;
    optional(): ZodType<T | undefined>;
    min(value: number): ZodType<T>;
    safeParse(data: unknown): SafeParseResult<T>;
  }

  export type ZodTypeAny = ZodType<any>;

  export interface ZodNamespace {
    string(): ZodType<string>;
    number(): ZodType<number>;
    unknown(): ZodType<unknown>;
    literal<T extends string | number | boolean>(value: T): ZodType<T>;
    array<T>(schema: ZodType<T>): ZodType<T[]>;
    object<T extends Record<string, ZodTypeAny>>(
      shape: T,
    ): ZodType<{ [K in keyof T]: T[K]['_output'] }>;
    record<V>(keySchema: ZodTypeAny, valueSchema: ZodType<V>): ZodType<Record<string, V>>;
  }

  export const z: ZodNamespace;

  export namespace z {
    export type infer<T extends ZodTypeAny> = T['_output'];
  }
}
