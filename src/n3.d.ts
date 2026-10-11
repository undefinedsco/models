declare module "n3" {
  export class Parser {
    constructor(options?: { baseIRI?: string })
    parse(source: string): Array<{
      subject: { value?: string }
      predicate: { value?: string }
      object: { value?: string; termType?: string }
    }>
  }
}

declare module 'n3' {
  export interface Term { value: string; termType: string }
  export interface Quad { subject: Term; predicate: Term; object: Term; graph?: Term }
  export class Writer {
    constructor(options?: { format?: string })
    addQuads(quads: Quad[]): void
    end(callback: (error: Error | null, result: string) => void): void
  }
  export const DataFactory: {
    namedNode(value: string): Term
    literal(value: string, datatype?: Term): Term
    quad(subject: Term, predicate: Term, object: Term): Quad
  }
}
