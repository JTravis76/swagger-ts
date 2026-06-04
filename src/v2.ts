import { IEndpoint, ISwagger } from "./swagger.d";
const fs = require("fs")

const params = {
  input: new Array<string>(),
  header: {},
  strictSSL: true,
  schemaOut: "",
  controllerOut: "",
  configType: "" // 'axios'
};

//============================================================
let swagger = {} as ISwagger;
const endpoints = new Array<any>();
const controllers = {} as Record<string, Record<string, string[]>>;

const nonInterfaceTypes = "boolean|number|number[]|string|string[]|object|void|Record<string, boolean>|Record<string, string>";
const dataTypes = { "integer": "number", "string": "string", "boolean": "boolean", "array": "[]" } as Record<string, string>;
//==== Utilities ======================================================

function generatedMessage() {
  return "/* eslint-disable */\n/* tslint:disable */\n// @ts-nocheck This file is auto-generated\n/*\n * -----------------------------------------------------\n * ## THIS FILE WAS GENERATED VIA SWAGGER-TS          ##\n * ## https://github.com/JTravis76/swagger-ts         ##\n * -----------------------------------------------------\n */\n";
}

function getReferenceType(value: string) {
  const ref = value.split("/");
  return `${ref[ref.length - 1]}`;
}

function getType(content?: { schema: any }) {
  if (!content) return "";
  let refType = content.schema["$ref"]
    ? getReferenceType(content.schema["$ref"])
    : "void";

  if (content.schema.items) {
    if (content.schema.items["$ref"]) {
      refType = getReferenceType(content.schema.items["$ref"]);
    } else {
      // get items/type
      refType = dataTypes[content.schema.items.type];
    }
  }

  // set either the scalar or object type
  switch (content.schema.type) {
    case "array":
      refType = `${refType}[]`
      break;
    case "integer":
      refType = "number"
      break;
    case "boolean":
      refType = "boolean"
      break;
    case "string":
      refType = "string"
      break;
    case "object":
      if (content.schema.additionalProperties) {
        refType = `Record<string, ${content.schema.additionalProperties.type}>`
      }
      break;
    default:
      //do nothing
      break;
  }
  return refType;
}

function generateEndpoints() {
  Object.keys(swagger.paths)
    // PRO-TIP! use the filter to assist with debugging
    //.filter(x => x.includes("/Version/"))
    .forEach((path) => {
      // Some path is indentified as a controller along with an action.
      // Other are considered resources with a verb that calls out the action.
      // Whether controller or resource, this is how end-points are grouped.
      // Under each group, will be either action(s) or verb(s).
      const parts = path.split("/");
      let action = parts[parts.length - 1];
      if (action.includes("{")) action = parts[parts.length - 2];

      // loop backward and check if there is a controller listed. URL might be controller-less.
      let controller = "";
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] == "" || parts[i] == "api" || parts[i] == "v{version}") break;
        controller = parts[i];
      }
      if (controller == action) controller = "";


      Object.keys(swagger.paths[path])
        .forEach((verb) => {
          const pathVerb = swagger.paths[path][verb];

          // == Fetch the parameters and type  == //
          const routeParameters = new Array<{ name: string, type: string, required: boolean, params: string }>();
          const queryParameters = new Array<{ name: string, type: string, required: boolean, params: string }>();
          if (pathVerb.parameters) {
            pathVerb.parameters.forEach((parameter) => {
              const type = dataTypes[parameter.schema.type] ?? "";
              const name = parameter.name;

              if (parameter.in === "path" && parameter.required) {
                routeParameters.push({
                  name,
                  type,
                  required: parameter.required ?? false,
                  params: `${name}${parameter.required ? "" : "?"}: ${type}`,
                });
              }
              else if (parameter.in === "query") {
                queryParameters.push({
                  name,
                  type,
                  required: parameter.required ?? false,
                  params: `${name}${parameter.required ? "" : "?"}: ${type}${parameter.required ? "" : " | null"}`,
                });
              }
            });
          }

          // == Fetch the body and type  == //
          let payloadParameter = "";
          if (pathVerb.requestBody) {
            let type = "any";
            Object.keys(pathVerb.requestBody.content).forEach((ct) => {
              if (ct.includes("application/json")) {
                type = getType(pathVerb.requestBody!.content[ct]);
              }
            });
            payloadParameter = `payload: ${nonInterfaceTypes.includes(type) ? type : "I" + type}`;
          }

          // == Fetch the return-type for the path/verb == //
          let returnType = "void";
          if (pathVerb.responses) {
            Object.keys(pathVerb.responses)
              .forEach((statusCode) => {
                if (statusCode === "200") {
                  if (pathVerb.responses![statusCode].content) {
                    Object.keys(pathVerb.responses![statusCode].content)
                      .forEach((ct) => {
                        if (ct.includes("application/json")) {
                          returnType = getType(pathVerb.responses![statusCode].content[ct]);
                        }
                      });
                  }
                }
              });
          }
          returnType = nonInterfaceTypes.includes(returnType) ? returnType : `I${returnType}`;

          const argumentParameters = new Array<string>();
          routeParameters.map((x) => x.params).forEach((p) => argumentParameters.push(p));
          queryParameters.sort((a, b) => Number(b.required) - Number(a.required)).map((x) => x.params).forEach((p) => argumentParameters.push(p));
          if (payloadParameter.length) argumentParameters.push(payloadParameter);

          let config = "config?: any";
          if (params.configType === "axios") config = "config?: AxiosRequestConfig";
          argumentParameters.push(config);

          endpoints.push({
            controller,
            action,
            verb,
            tag: swagger.info.version,
            arguments: `(${argumentParameters.join(", ")})`,
            parameters: `{ ${queryParameters.map((x) => x.name).join(", ")} }`,
            returnType,
            path: path.replace("v{version}", swagger.info.version).replaceAll("{", "${"),
            deprecated: pathVerb.deprecated ?? false,
          });
        });
    });

  // ===============================

  endpoints
    .forEach((e) => {
      // initialize the object either as, controller/action or resource/verb
      if (e.controller.length > 0 && !controllers[e.controller]) {
        controllers[e.controller] = {};
      }
      else if (e.controller.length === 0 && !controllers[e.action]) {
        controllers[e.action] = {};
      }

      if (e.controller.length > 0 && !controllers[e.controller][e.tag]) controllers[e.controller][e.tag] = [];
      else if (e.controller.length == 0 && !controllers[e.action][e.tag]) controllers[e.action][e.tag] = [];

      //== function builder
      let sb = "";
      const indent = e.controller.length === 0 ? "      " : "      ";
      if (e.deprecated) sb += `${indent}/** @deprecated */\n`;

      let method = `${indent}${e.action}: `;
      if (e.controller.length === 0) method = `${indent}${e.verb}: `;

      if ("get|delete|head|option".includes(e.verb)) {
        if (e.parameters === "{  }") {
          sb += `${method}${e.arguments} => httpClient.${e.verb}<${e.returnType}>(\`${e.path}\`, config),\n`;
        }
        else {
          e.arguments = e.arguments.replace(", config?: any", "").replace(", config?: AxiosRequestConfig", "");
          sb += `${method}${e.arguments} => httpClient.${e.verb}<${e.returnType}>(\`${e.path}\`, { params: ${e.parameters} }),\n`;
        }
      }
      if ("post|put|patch".includes(e.verb)) {
        if (e.parameters === "{  }") {
          sb += `${method}${e.arguments} => httpClient.${e.verb}<${e.returnType}>(\`${e.path}\`, ${e.arguments.includes("payload:") ? "payload" : "null"}, config),\n`;
        }
        else {
          e.arguments = e.arguments.replace(", config?: any", "").replace(", config?: AxiosRequestConfig", "");
          sb += `${method}${e.arguments} => httpClient.${e.verb}<${e.returnType}>(\`${e.path}\`, null, { params: ${e.parameters} }),\n`;
        }
      }

      if (sb.length > 0) {
        if (e.controller.length > 0) controllers[e.controller][e.tag].push(sb);
        else controllers[e.action][e.tag].push(sb);
      }
    });
}

function createController(): string {
  let sb = generatedMessage()
  if (params.configType === "axios") sb += "import type { AxiosRequestConfig } from 'axios';\n"

  sb += "import httpClient from './httpClient';\n";
  sb += "\n// prettier-ignore\nexport default {\n";
  Object.keys(controllers).forEach((c) => {
    let controller = controllers[c];
    let indent = c == "" ? "  " : "    ";
    if (c != "") sb += `  ${c}: {\n`;
    Object.keys(controller).forEach(v => {
      if (controller[v].length > 0) {
        sb += `${indent}${v}: {\n`;
        sb += `${controller[v].join("")}`;
        sb += `${indent}},\n`
      }
    });
    if (c != "") sb += "  },\n"
  })
  sb += "}\n";

  return sb;
}

//==== Index ==========================================================

/** Print phrase to either console or file
 * @param phrase text phrase to print
 */
function print(phrase: string, filePath?: string): void {
  if (filePath) fs.writeFileSync(filePath, phrase)
  else console.log(phrase);
}

export const generate = async (opt?: { input: string | string[] }): Promise<void> => {
  if (!opt) return;

  if (typeof opt.input === "string" && opt.input.includes("["))
    opt.input = JSON.parse(opt.input);
  else if (typeof opt.input === "string") opt.input = [opt.input];

  Object.assign(params, opt);

  if (params.input.length === 0) {
    const packageInfo = JSON.parse(fs.readFileSync("package.json", "utf8"));
    if (packageInfo.swagger) {
      Object.assign(params, packageInfo.swagger);
    } else {
      // check for local config
      if (fs.existsSync("swagger.config")) {
        const config = JSON.parse(fs.readFileSync("swagger.config", "utf8"));
        Object.assign(params, config);
      }
    }
  }

  if (Array.isArray(params.input)) {

    for (let idx in params.input) {
      let value = params.input[idx];

      if (value.startsWith("http")) {
        if (!params.strictSSL) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        await fetch(value)
          .then((res) => res.ok ? res.json() : res.text())
          .then((d) => {
            swagger = d as ISwagger;
          })
          .catch((err) => console.error(err));
      }
      else if (value.includes(".json")) {
        swagger = JSON.parse(fs.readFileSync(value, "utf8"));
      }

      if (!swagger.openapi) {
        console.error("Unknown error. Check the swagger.json.");
        return
      }
      // collectResponseTypes();
      // generateSchema();
      generateEndpoints();
    }

    // print(createSchema(), params.schemaOut);
    print(createController(), params.controllerOut);
  }
}