export interface HttpResponse<T> {
  ok: boolean;
  err?: {
    errMessage: string;
    logs: any;
  };
  data?: T;
}
