// Fix for Express v5 params type - force params values to be string
declare namespace Express {
  interface Request {
    params: Record<string, string>;
  }
}
