declare module '*.js' {
  const stats: any;
  export default stats;
}

declare function stats(filename: string | URL): void;
export default stats;