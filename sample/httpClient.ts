/* == httpClient.ts ==
 * This sample http-client is used to demostrate how to use the generated controller from swagger-ts.
 * In most cases, this file would contain the logic for Fetch API, axios client, or other similar http clients.
 */

type Method = "GET" | "DELETE" | "HEAD" | "OPTIONS" | "POST" | "PUT" | "PATCH";

interface IHttpRequestConfig extends RequestInit {
  baseURL?: string;
  url?: string;
  params?: any;
  method?: Method;
}

interface IHttpClient {
  get<T = any>(url: string, config?: IHttpRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: IHttpRequestConfig): Promise<T>;
  head<T = any>(url: string, config?: IHttpRequestConfig): Promise<T>;
  options<T = any>(url: string, config?: IHttpRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T>;
}

class HttpClient implements IHttpClient {
  delete<T = any>(url: string, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  head<T = any>(url: string, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  options<T = any>(url: string, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  put<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  patch<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  post<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
  get<T = any>(url: string, config?: IHttpRequestConfig): Promise<T> {
    throw new Error("Method not implemented.");
  }
}

export default new HttpClient();
