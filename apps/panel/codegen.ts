import type { CodegenConfig } from "@graphql-codegen/cli";

const schemaEndpoint =
  process.env.GRAPHQL_ENDPOINT ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  "http://localhost:8081/query";

const config: CodegenConfig = {
  schema: schemaEndpoint,
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  verbose: true,
  generates: {
    "./src/providers/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
        scalars: {
          DateTime: {
            input: "Date",
            output: "Date",
          },
        },
      },
    },
    "./schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
