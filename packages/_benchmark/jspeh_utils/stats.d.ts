declare module '*.js' {
  const check: any;
  export default check;
}

declare function check(filename: string | URL): void;
export default check;