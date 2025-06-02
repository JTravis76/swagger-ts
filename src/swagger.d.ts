export interface ISwagger {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: any;
  components: {
    schemas: any;
  };
}

export interface IPath {
  /** Gets or sets the version tag for the path */
  tag: string;
  /** Gets or sets the URLs for the path 
   * @summary Could contain two different URLs:
   * '/api/controller/action', '/api/v{version}/controller/action'
  */
  url: string[];
  /** Gets or the sets the list of URL query string parameters */
  query: { name: string, type: string }[];
  /** Gets or sets the payload object type */
  payload: string;
  /** Gets or sets the return object/scaler type */
  returnType: string;
}

export interface IEndpoint {
  paths: IPath[],
  controller: string;
  action: string;
  verb: string;
  isMerged: boolean;
}