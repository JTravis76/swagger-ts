# Swagger-TS

- Objective
- Configuration
- CLI
- Request Payload vs. Response Return Types
- Controller Format Modes
- Releases

## OBJECTIVE

This CLI tool is use to generate TypeScript typing's from Swagger OpenAPI JSON. This tool ONLYS builds the schema (TypeScript Types) and the controller. Feel free to use any HTTP client along side.

> Just be mindful of the import statement in controller output.

```ts
// controller.ts
import httpClient from "httpClient";
```

## CONFIGURATION

There is several ways for configuring the swagger generation.  
Option 1 is the `package.json`. This is the default.  
Option 2: create a `swagger.config` file, which is also a JSON structure.  
Option 3: using inline arguments from a command or bash statement.

The 'input' parameter can either be a string pointing to a single swagger file or array of string for multi-swagger file. Fetching files from HTTP is also an option.

- package.json
- swagger.config

```json
// package.json
"swagger": {
  "input": [
    "./swagger-v1.json",
    ".https://domain.com/swagger/v2/swagger.json"
  ],
  "strictSSL": true,
  "schemaOut": "./types/schema.d.ts",
  "controllerOut": "./src/api/controller.ts",
  "configType": "axios"
}
```

- **StrictSSL** to false allow fetching swagger.json from a self-signed cert.  
- **ConfigType** sets the configuration for the client. Currently, there is a single option 'axios'. This option will include the import header and mark the config parameter as 'AxiosRequestConfig'.
- Inline arguments (see CLI section of this article)

## CLI

The command-line interface (CLI) is a tool to generate TypeScript typing's outside of project. For help, use `swagger-ts -h`.

Example usage for a single JSON input file.

> NOTE: input parameter can also accept URL path(s): https://domain.net/swagger/v1/swagger.json

```
>swagger-ts -i ./swagger-v1.json -s ./types/schema.d.ts  -c ./src/api/controller.ts
```

Example usage for multi-input JSON file.

```
>swagger-ts -i [\"./swagger-v1.json\",\"./swagger-v2.json\"] -s ./types/schema.d.ts  -c ./src/api/controller.ts
```

## NOTES ON REQUEST PAYLOAD vs. RESPONSE RETURN TYPES

Just some notes on the differences between request payloads and response types. When sending a payload, there is no way to enforce the user to include the required or optional properties within the payload. This is different from a response type. The API is guaranteed to send you those properties. Now, their expect value might be marked as NULL instead of their default value, based on scalar types of; Boolean, Integers, etcetera.

For Request payload, the generator will mark the properties of the type with a question mark '?'. This tells TypeScript to treat the property as 'undefined'.

> NOTE: Undefined and NULLs are handled differently in JavaScript. This is beyond the scope of this article.

For Response types, the question mark "?" is removed. Doing this tells TypeScript the property is available. Again, it could be Null depending on the value set.

Below are some example of Request and Response interfaces.

```ts
interface IAlertRuleRequest {
  IncludeAllPages?: boolean;
  /** @format int32 */
  PageSize?: number;
  /** @format int32 */
  PageNumber?: number | null;
  Culture?: string | null;
  SortField?: string | null;
  SortOrder?: string | null;
  Search?: string | null;
  AlertRule?: IAlertRule;
}

interface IAlertRuleResponse {
  IsSuccess: boolean;
  Message: string | null;
  AlertRule: IAlertRule;
}
```

## CONTROLLER FORMAT MODES

This section is a bit tricky and probably opinionated. Going through this process, I'm guessing that I refactor the formatting of the controller, at least three times. Ha! So I can up with the concept of `Format Modes`. This modes will tell the CLI tool which controller format is best suited for your project.

- 'Version' mode

Version mode is best suited for APIs that use versioning. Sometimes, work is split between back-end and front-end developers. Or maybe the API is exposed to the public. If the payload or response changes and their is no control to whom accesses it. This is your format.

_Sample output_

```ts
// controller.ts
import httpClient from "httpClient";

export default {
  Person: {
    v1: {
      GetUsers: (payload: IBaseRequest) =>
        httpClient.post<IBaseResponse>("/api/v1/Person/GetUsers", payload),
    },
    v2: {
      GetUsers: (payload: IBaseRequest) =>
        httpClient.post<IUsersListResponse>("/api/v2/Person/GetUsers", payload),
    },
  },
  Location: {
    v1: {
      GetLocation: (id: string) =>
        httpClient.get<ILocationResponse>("/api/Location/GetLocation", {
          params: { id },
        }),
    },
  },
};

// usage in another file.ts
import controller from "../api/controller";

controller.Person.v2
  .GetUsers({ pageSize: 25, page: 1, search: "" })
  .then((res) => console.log(res));

controller.Location.v1.GetLocation(1).then((res) => console.log(res));
```

- 'Verb' mode

!! WIP !! This is a work-in-process. The thought would be, that a developer would have access to both UI and API changes. And that new work would be in-sync. Possibly the API is semi-private, to local area network. With that said, no version control is necessary.

_Projected - Sample Output_

```ts
// controller.ts
import httpClient from "httpClient";

export default {
  Person: {
    get: (id: string) =>
      httpClient.get<IUserResponse>(`/api/Person/User/${id}`, { params: {} }),
    post: (payload: IUserRequest) =>
      httpClient.post<IUserResponse>("/api/Person/User", payload),
  },
  Location: {
    Get: (id: string) =>
      httpClient.get<ILocationResponse>("/api/Location/Location", {
        params: { id },
      }),
  },
};

// usage in another file.ts
import controller from "../api/controller";

controller.Person.post({ id: 1, firstname: "Johnny", lastname: "Blaze" }).then(
  (res) => console.log(res)
);

controller.Location.get(1).then((res) => console.log(res));
```

## RELEASES

- 1.0.3 new 'configType' to set the configuration; blank || axios
- 1.0.2 fix fetching swagger.json via URL
- 1.0.1 update generated message banner
- 1.0.0 initial release
