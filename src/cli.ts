'use strict';

const path = require('path');
const { program } = require('commander');
const pkg = require('../package.json');

const params = program
  .name('swagger-ts')
  .usage('[options]')
  .version(pkg.version)
  //.requiredOption('-i, --input <value>', 'OpenAPI specification, can be a path or url. string | string[] (required)')
  .option('-i, --input <value>', 'OpenAPI specification, can be a path or url. string | string[]')
  .option('-s, --schemaOuta <value>', 'path (with filename) for schemas file. EX: .types/schema.d.ts')
  .option('-c, --controllerOut <value>', 'path (with filename) for controller file. EX: ./src/api/controller.ts')
  .option('-m, --mode <value>', 'mode for the controller format.')
  .option('--strictSSL <value>', 'enforce SSL certificate chain when calling HTTPS', true)
  .parse(process.argv)
  .opts();

const SwaggerTs = require(path.resolve(__dirname, './index.js'));

if (SwaggerTs) {
  SwaggerTs.generate(params)
    .then(() => process.exit(0))
    .catch((err: any) => { console.log(err); process.exit(1); })
}